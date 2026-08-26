import {
  getFavoriteGroupErrorMessage,
  getFavoriteGroupPlaces,
  removeFavoriteGroupPlace,
  type FavoriteGroupPlace,
  type FavoriteGroupPlaceSort,
} from '@/api/maps-favorites';
import { AppHeader } from '@/components/app-header';
import { ArrowDownIcon } from '@/components/icons';
import { FavoriteIcon, PinIcon } from '@/components/icons/map';
import { Text } from '@/components/ui/text';
import { showAlert } from '@/lib/alert';
import { getMapIcon, getMapIconClassName } from '@/lib/maps/icons';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, FlatList, Pressable, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 그룹 상세(장소 목록) 정렬 옵션. 그룹 목록 페이지와 달리 '최신순'은 없다(서버 sort가 place_added/name만 지원).
const SORT_OPTIONS = ['장소 추가순', '가나다순'] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

const SORT_OPTION_TO_API: Record<SortOption, FavoriteGroupPlaceSort> = {
  '장소 추가순': 'place_added',
  가나다순: 'name',
};

export default function MapsFavoriteDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { favoriteId } = useLocalSearchParams<{ favoriteId: string }>();
  const groupId = Number(favoriteId);

  const [isSortMenuOpen, setSortMenuOpen] = React.useState(false);
  const [sortOption, setSortOption] = React.useState<SortOption>('장소 추가순');
  // 거리 표시용 현재 위치. 이미 권한이 있을 때만 조용히 가져오고, 없거나 실패해도 거리 없이 정상 동작한다
  // (재요청 안 함 — app/(tabs)/maps/search/index.tsx와 동일한 패턴).
  const [coordinates, setCoordinates] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  React.useEffect(() => {
    let active = true;

    async function loadLastKnownLocation() {
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (permission.status !== 'granted') return;

        const location = await Location.getLastKnownPositionAsync();
        if (!active || !location) return;

        setCoordinates({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch {
        // 위치를 사용할 수 없어도 거리 정보 없이 정상 동작합니다.
      }
    }

    void loadLastKnownLocation();
    return () => {
      active = false;
    };
  }, []);

  const apiSort = SORT_OPTION_TO_API[sortOption];
  const groupDetailQuery = useQuery({
    queryKey: ['favorite-group-places', groupId, apiSort, coordinates],
    queryFn: () =>
      getFavoriteGroupPlaces({
        groupId,
        sort: apiSort,
        lat: coordinates?.latitude,
        lng: coordinates?.longitude,
      }),
    enabled: Number.isFinite(groupId),
  });
  const group = groupDetailQuery.data?.group;
  const places = groupDetailQuery.data?.places ?? [];

  const queryClient = useQueryClient();
  // 별을 눌러 해제해도 이 화면에 머무는 동안은 카드가 안 사라지게(API 스펙 요구사항) 로컬로만 별 상태를 덮어쓴다.
  // 서버는 "이 그룹에서 제거"만 지원하고 "다시 담기"는 없어서, 별을 다시 누르면 API 호출 없이 로컬 표시만 되돌린다.
  // 실제로는 이미 삭제된 상태라, 목록을 다시 조회하면(화면을 나갔다 들어오면) 카드 자체가 사라진다.
  const [localFavoriteOverrides, setLocalFavoriteOverrides] = React.useState<
    Record<number, boolean>
  >({});

  const { mutate: removeFromGroup } = useMutation({
    mutationFn: (pinId: number) => removeFavoriteGroupPlace(groupId, pinId),
    onSuccess: () => {
      // 그룹 목록 페이지의 placeCount 갱신용. 이 화면 자신의 쿼리(favorite-group-places)는
      // 일부러 무효화하지 않는다 — 하면 카드가 바로 사라져서 "머무는 동안 유지" 요구사항이 깨진다.
      queryClient.invalidateQueries({ queryKey: ['favorite-groups'] });
    },
    onError: (error, pinId) => {
      // 실패했으니 로컬 별 표시를 원래대로 되돌림
      setLocalFavoriteOverrides((prev) => ({ ...prev, [pinId]: true }));
      showAlert(
        '즐겨찾기 해제 실패',
        getFavoriteGroupErrorMessage(error, '잠시 후 다시 시도해주세요.')
      );
    },
  });

  // 아이템 클릭 → 지도로 돌아가서 해당 핀을 열어 보여준다.
  // push가 아니라 dismissTo를 쓴다: push면 스택에 이미 있는 /maps 위에 새 /maps가 또 쌓여서
  // (favorites → favorites/[id] → maps) 지도가 새로 열리는 것처럼 보이고 뒤로가기도 꼬인다.
  // dismissTo는 이 화면에 오기 전까지 거쳐온 favorites/favorites/[id]를 스택에서 제거하고
  // 이미 떠 있던 /maps 인스턴스로 돌아가면서 params만 바꿔치기한다 (merge 옵션을 안 주면
  // react-navigation이 해당 라우트의 params를 완전히 새 값으로 교체하므로, buildingId/placeId 중
  // 하나만 넘겨도 이전 방문에서 남아있던 반대쪽 값이 섞여 들어올 걱정이 없다).
  // type이 BUILDING/PLACE로 갈리는 이유는 지도 화면의 상세 조회·시트 종류가 서로 달라서다
  // (app/(tabs)/maps/index.tsx의 selectCategoryPin과 동일한 분기 — buildingId는 건물 상세 시트,
  // placeId는 장소 상세 시트를 열고 각각의 좌표로 카메라를 이동시킨다).
  function onItemPress(item: FavoriteGroupPlace) {
    if (item.type === 'BUILDING') {
      router.dismissTo({ pathname: '/maps', params: { buildingId: String(item.pinId) } });
      return;
    }
    router.dismissTo({ pathname: '/maps', params: { placeId: String(item.pinId) } });
  }

  function onFavoriteTogglePress(pinId: number, isFavorite: boolean) {
    if (isFavorite) {
      setLocalFavoriteOverrides((prev) => ({ ...prev, [pinId]: false }));
      removeFromGroup(pinId);
    } else {
      // 서버에 재등록 API가 없어서 로컬 표시만 되돌린다 (위 주석 참고)
      setLocalFavoriteOverrides((prev) => ({ ...prev, [pinId]: true }));
    }
  }

  return (
    <View className="flex-1 bg-white">
      {/* 앱 헤더 */}
      <View style={{ paddingTop: insets.top }}>
        <AppHeader
          title={group?.name ?? ''}
          right={
            <View className="flex-row items-center gap-0.5 py-1 pe-3 ps-1.5">
              <PinIcon size={24} className="text-grey-40" />
              <Text className="text-body05 text-grey-40">{group?.placeCount ?? 0}</Text>
            </View>
          }
        />
      </View>

      {/* 즐겨찾기 장소 목록 */}
      <FlatList
        data={places}
        keyExtractor={(item) => String(item.pinId)}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom }}
        // 정렬 옵션 버튼
        ListHeaderComponent={
          <View className="items-end p-4">
            <TouchableOpacity
              className="flex-row items-center gap-1"
              hitSlop={4}
              onPress={() => setSortMenuOpen((prev) => !prev)}
            >
              <Text className="text-caption02 text-grey-60">{sortOption}</Text>
              <View style={isSortMenuOpen ? { transform: [{ rotate: '180deg' }] } : undefined}>
                <ArrowDownIcon size={14} className="text-grey-40" />
              </View>
            </TouchableOpacity>
          </View>
        }
        // 아이템 구분자
        ItemSeparatorComponent={() => (
          <View className="p-4">
            <View className="h-[1.5px] bg-grey-02" />
          </View>
        )}
        // 리스트 로딩/에러/빈 상태
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center">
            {groupDetailQuery.isLoading ? (
              <ActivityIndicator color="#2587ff" />
            ) : groupDetailQuery.isError ? (
              <Text className="text-body05 text-grey-30">목록을 불러오지 못했습니다</Text>
            ) : (
              <Text className="text-body05 text-grey-30">아직 저장된 장소가 없어요</Text>
            )}
          </View>
        }
        // 아이템
        renderItem={({ item }) => {
          const Icon = getMapIcon(item.iconKey ?? '', item.categoryCode);
          const iconClassName = getMapIconClassName(item.categoryCode);
          const isFavorite = localFavoriteOverrides[item.pinId] ?? item.favorite;

          return (
            <TouchableOpacity className="gap-2.5 px-4" onPress={() => onItemPress(item)}>
              <View className="flex-row items-center gap-3.5">
                <View className="rounded bg-blue-05 p-2">
                  <Icon size={28} className={iconClassName} />
                </View>

                <View className="min-w-0 flex-1">
                  <Text className="text-body02 text-black">{item.name}</Text>
                  {(item.classroomCode ?? item.location) && (
                    <Text className="text-body05 text-grey-80">
                      {item.classroomCode ?? item.location}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  hitSlop={4}
                  onPress={() => onFavoriteTogglePress(item.pinId, isFavorite)}
                >
                  <FavoriteIcon size={28} active={isFavorite} />
                </TouchableOpacity>
              </View>

              {(item.operatingStatus || item.distanceMeters !== null) && (
                <View className="flex-row items-center gap-1.5">
                  {item.operatingStatus && (
                    <Text className="text-caption01 text-blue-35">{item.operatingStatus}</Text>
                  )}
                  {item.operatingStatus && item.distanceMeters !== null && (
                    <View className="h-[3px] w-[3px] rounded-full bg-grey-30" />
                  )}
                  {item.distanceMeters !== null && (
                    <Text className="text-caption02 text-grey-30">{item.distanceMeters}m</Text>
                  )}
                </View>
              )}

              {/* TODO: 그룹 내 메모(item.memo) 표시 UI 미정 — 디자인 확정되면 추가 */}
            </TouchableOpacity>
          );
        }}
      />

      {/* 정렬 드롭다운 메뉴. ListHeaderComponent 내부는 FlatList가 아이템별로 별도 셀에 감싸 렌더링해서
          absolute + zIndex가 뒤에 오는 리스트 아이템 셀을 넘어서지 못한다 — FlatList 밖의 최상위 형제로
          빼서 항상 리스트 위에 그려지도록 한다. */}
      {isSortMenuOpen && (
        <>
          {/* 바깥 영역 클릭 시 닫히도록 하는 투명 backdrop. 메뉴보다 먼저 렌더링해 메뉴 아래에 깔린다. */}
          <Pressable
            className="absolute inset-0"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            onPress={() => setSortMenuOpen(false)}
          />
          <View
            className="absolute w-[84px] bg-white py-1.5"
            style={{
              top: insets.top + 60 + 42,
              right: 16,
              boxShadow: '0px 2px 6px rgba(23,23,27,0.15), 0px 1px 4px rgba(23,23,27,0.15)',
            }}
          >
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                className={cn(
                  'items-center px-2 py-1',
                  option === sortOption ? 'bg-blue-05' : undefined
                )}
                onPress={() => {
                  setSortOption(option);
                  setSortMenuOpen(false);
                }}
              >
                <Text
                  className={cn(
                    'text-caption02',
                    option === sortOption ? 'text-blue-35' : 'text-grey-30'
                  )}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
}
