import { AppHeader } from '@/components/app-header';
import { ArrowDownIcon } from '@/components/icons';
import { BuildingIcon, FavoriteIcon, PinIcon } from '@/components/icons/map';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { FlatList, Pressable, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 정렬 옵션 (즐겨찾기 그룹 목록 페이지와 동일)
const SORT_OPTIONS = ['최신순', '가나다순', '장소 추가순'] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

// 즐겨찾기 그룹에 속한 장소 더미 데이터
type FavoritePlace = {
  id: number;
  name: string;
  classroomCode: string;
  operatingStatus: string;
  distanceMeters: number;
};

const DUMMY_PLACES: FavoritePlace[] = [
  {
    id: 1,
    name: '학생회관',
    classroomCode: 'S2XXX',
    operatingStatus: '운영중',
    distanceMeters: 720,
  },
  {
    id: 2,
    name: '학생회관',
    classroomCode: 'S2XXX',
    operatingStatus: '운영중',
    distanceMeters: 720,
  },
  {
    id: 3,
    name: '학생회관',
    classroomCode: 'S2XXX',
    operatingStatus: '운영중',
    distanceMeters: 720,
  },
];

export default function MapsFavoriteDetailScreen() {
  const insets = useSafeAreaInsets();
  // TODO: 실제 API 연동 시 이 값으로 그룹명·장소 목록 조회
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { favoriteId } = useLocalSearchParams<{ favoriteId: string }>();

  const [isSortMenuOpen, setSortMenuOpen] = React.useState(false);
  const [sortOption, setSortOption] = React.useState<SortOption>('장소 추가순');

  // TODO: 실제 API 연동 전까지 더미 데이터 사용
  const places = DUMMY_PLACES;
  // 즐겨찾기 취소(별 토글) 더미 상태. 기본은 이 그룹에 속한 장소이므로 전부 즐겨찾기됨
  const [favoritedIds, setFavoritedIds] = React.useState(() => new Set(places.map((p) => p.id)));

  function toggleFavorite(placeId: number) {
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
  }

  return (
    <View className="flex-1 bg-white">
      {/* 앱 헤더 */}
      <View style={{ paddingTop: insets.top }}>
        <AppHeader
          title="그룹명"
          right={
            <View className="flex-row items-center gap-0.5 py-1 pe-3 ps-1.5">
              <PinIcon size={24} className="text-grey-40" />
              <Text className="text-body05 text-grey-40">{places.length}</Text>
            </View>
          }
        />
      </View>

      {/* 즐겨찾기 장소 목록 */}
      <FlatList
        data={places}
        keyExtractor={(item) => String(item.id)}
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
        // 리스트 비어있는 경우
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center">
            <Text className="text-body05 text-grey-30">아직 저장된 장소가 없어요</Text>
          </View>
        }
        // 아이템
        renderItem={({ item }) => (
          <View className="gap-2.5 px-4">
            <View className="flex-row items-center gap-3.5">
              <View className="rounded bg-blue-05 p-2">
                <BuildingIcon size={28} className="text-blue-15" />
              </View>

              <View className="min-w-0 flex-1">
                <Text className="text-body02 text-black">{item.name}</Text>
                <Text className="text-body05 text-grey-80">{item.classroomCode}</Text>
              </View>

              <TouchableOpacity hitSlop={4} onPress={() => toggleFavorite(item.id)}>
                <FavoriteIcon size={28} active={favoritedIds.has(item.id)} />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center gap-1.5">
              <Text className="text-caption01 text-blue-35">{item.operatingStatus}</Text>
              <View className="h-[3px] w-[3px] rounded-full bg-grey-30" />
              <Text className="text-caption02 text-grey-30">{item.distanceMeters}m</Text>
            </View>
          </View>
        )}
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
