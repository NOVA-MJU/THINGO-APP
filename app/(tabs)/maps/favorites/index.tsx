import {
  deleteFavoriteGroup,
  getFavoriteGroupErrorMessage,
  getFavoriteGroups,
  type FavoriteGroup,
  type FavoriteGroupSort,
} from '@/api/maps-favorites';
import { AppHeader } from '@/components/app-header';
import { ArrowDownIcon, MoreVerticalIcon, PlusIcon } from '@/components/icons';
import { FavoriteBadgeIcon, PinIcon } from '@/components/icons/map';
import GroupEditSheet, {
  type GroupEditSheetHandle,
} from '@/app/(tabs)/maps/favorites/_components/group-edit-sheet';
import { getGroupBadgeClassName } from '@/app/(tabs)/maps/favorites/_constants/group-colors';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/auth-context';
import { showAlert } from '@/lib/alert';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import * as React from 'react';
import type { GestureResponderEvent } from 'react-native';
import { ActivityIndicator, FlatList, Pressable, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 즐겨찾기 정렬 옵션. 서버 sort 파라미터(latest/name/place_added)와 1:1 매핑된다.
const SORT_OPTIONS = ['최신순', '가나다순', '장소 추가순'] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

const SORT_OPTION_TO_API: Record<SortOption, FavoriteGroupSort> = {
  최신순: 'latest',
  가나다순: 'name',
  '장소 추가순': 'place_added',
};

// favoriteGroupsQuery.data가 없을 때 매 렌더마다 새 배열을 만들지 않도록 고정 참조로 둠
const EMPTY_FAVORITE_GROUPS: FavoriteGroup[] = [];

// 그룹 아이템 케밥 메뉴 옵션
const GROUP_MENU_OPTIONS = ['수정하기', '삭제하기'] as const;

// FlatList keyExtractor/케밥 메뉴 열림 상태 등에 쓰는 그룹 식별자.
// '버스'는 실제 그룹 로우가 없어 id가 null로 내려오므로, 그럴 때는 type(SYSTEM_BUS는 유일)으로 대체한다.
function getGroupKey(group: FavoriteGroup): string {
  return group.id !== null ? String(group.id) : group.type;
}

export default function MapsFavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isInitializing } = useAuth();
  const [isSortMenuOpen, setSortMenuOpen] = React.useState(false);
  const [sortOption, setSortOption] = React.useState<SortOption>('최신순');
  // 케밥 메뉴가 열려있는 그룹 key와, 눌린 위치(pageY) — 메뉴를 그 아래에 띄우는 데 사용
  const [openGroupMenuKey, setOpenGroupMenuKey] = React.useState<string | null>(null);
  const [groupMenuAnchorY, setGroupMenuAnchorY] = React.useState(0);
  // "새 그룹 추가" / "그룹명 수정" 바텀시트
  const groupEditSheetRef = React.useRef<GroupEditSheetHandle>(null);
  // 삭제 확인 다이얼로그 대상 그룹. null이면 닫힌 상태
  const [deleteTargetGroup, setDeleteTargetGroup] = React.useState<FavoriteGroup | null>(null);
  // 그룹 상세로 이동 중인 그룹 key. null이 아니면 다른 아이템 탭도 막는다 — 빠르게 여러 번 눌러서
  // 상세 화면이 중복으로 push되는 걸 방지. 화면이 다시 포커스될 때(뒤로가기 등) 자동으로 풀린다.
  const [pendingGroupKey, setPendingGroupKey] = React.useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      setPendingGroupKey(null);
    }, [])
  );

  const queryClient = useQueryClient();
  const apiSort = SORT_OPTION_TO_API[sortOption];
  const favoriteGroupsQuery = useQuery({
    queryKey: ['favorite-groups', apiSort],
    queryFn: () => getFavoriteGroups(apiSort),
    enabled: !!user,
  });
  const favoriteGroups = favoriteGroupsQuery.data ?? EMPTY_FAVORITE_GROUPS;

  const { mutate: deleteGroup, isPending: isDeletingGroup } = useMutation({
    mutationFn: (groupId: number) => deleteFavoriteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-groups'] });
      setDeleteTargetGroup(null);
    },
    onError: (error) => {
      showAlert(
        '그룹 삭제 실패',
        getFavoriteGroupErrorMessage(error, '잠시 후 다시 시도해주세요.')
      );
    },
  });

  const openGroupMenuGroup = React.useMemo(
    () => favoriteGroups.find((group) => getGroupKey(group) === openGroupMenuKey) ?? null,
    [favoriteGroups, openGroupMenuKey]
  );

  // 로그인해야만 볼 수 있는 화면 — 초기화가 끝났는데 로그인이 안 돼 있으면 로그인 화면으로 보낸다
  if (!isInitializing && !user) return <Redirect href="/login" />;

  function onNewGroupPress() {
    setSortMenuOpen(false);
    setOpenGroupMenuKey(null);
    groupEditSheetRef.current?.open();
  }

  // 그룹 아이템 클릭 — 해당 그룹의 즐겨찾기 장소 목록 페이지로 이동
  function onGroupItemPress(group: FavoriteGroup) {
    if (pendingGroupKey !== null) return; // 이미 다른 항목으로 이동 중이면 무시

    if (group.type === 'SYSTEM_BUS') {
      // TODO: '버스' 그룹은 여러 정류장/노선 즐겨찾기를 합친 가상 항목이라 id가 없다.
      // 지금은 /maps 메인 화면의 바텀시트가 정류장 하나를 선택해야만 도착정보를 보여줄 수 있어서
      // 바로 연결할 화면이 없다 — 즐겨찾기한 정류장/노선을 모아 보여주는 화면이 필요하다.
      showAlert('버스', '준비 중인 기능입니다.');
      return;
    }
    setPendingGroupKey(getGroupKey(group));
    router.push(`/maps/favorites/${group.id}`);
  }

  // 그룹 아이템 케밥 아이콘 클릭 — 정렬 드롭다운은 닫고, 눌린 위치 아래에 케밥 메뉴를 띄운다
  function onGroupMenuPress(group: FavoriteGroup, event: GestureResponderEvent) {
    setSortMenuOpen(false);
    setGroupMenuAnchorY(event.nativeEvent.pageY + 12);
    setOpenGroupMenuKey((prev) => (prev === getGroupKey(group) ? null : getGroupKey(group)));
  }

  // "수정하기" 메뉴 클릭
  function onEditGroupPress(group: FavoriteGroup) {
    setOpenGroupMenuKey(null);
    groupEditSheetRef.current?.open(group);
  }

  // "삭제하기" 메뉴 클릭 — 바로 삭제하지 않고 확인 다이얼로그부터 띄운다
  function onDeleteGroupPress(group: FavoriteGroup) {
    setOpenGroupMenuKey(null);
    setDeleteTargetGroup(group);
  }

  // 삭제 확인 다이얼로그의 "삭제" 버튼 클릭
  function onDeleteConfirmPress() {
    // system 그룹은 케밥 메뉴 자체가 안 뜨고, id가 null인 건 '버스' 시스템 그룹뿐이라 실질적으로 항상 number.
    // 방어적으로만 체크.
    if (deleteTargetGroup?.id == null) return;
    deleteGroup(deleteTargetGroup.id);
  }

  return (
    <View className="flex-1 bg-white">
      {/* 앱 헤더 */}
      <View style={{ paddingTop: insets.top }}>
        <AppHeader title="즐겨찾기" />
      </View>

      {/* 즐겨찾기 그룹 목록 */}
      <FlatList
        data={favoriteGroups}
        keyExtractor={getGroupKey}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom }}
        // 정렬 옵션 버튼
        ListHeaderComponent={
          <View className="items-end px-4 pt-4">
            <TouchableOpacity
              className="flex-row items-center gap-1"
              hitSlop={4}
              onPress={() => {
                setOpenGroupMenuKey(null);
                setSortMenuOpen((prev) => !prev);
              }}
            >
              <Text className="text-grey-60 text-caption02">{sortOption}</Text>
              <View style={isSortMenuOpen ? { transform: [{ rotate: '180deg' }] } : undefined}>
                <ArrowDownIcon size={14} className="text-grey-40" />
              </View>
            </TouchableOpacity>
          </View>
        }
        // 아이템 구분자
        ItemSeparatorComponent={() => (
          <View className="px-4">
            <View className="h-[1.5px] bg-grey-02" />
          </View>
        )}
        // 리스트 로딩/에러/빈 상태
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center">
            {favoriteGroupsQuery.isLoading ? (
              <ActivityIndicator color="#2587ff" />
            ) : favoriteGroupsQuery.isError ? (
              <Text className="text-grey-30 text-body05">목록을 불러오지 못했습니다</Text>
            ) : (
              <Text className="text-grey-30 text-body05">즐겨찾기 그룹이 없습니다</Text>
            )}
          </View>
        }
        // 아이템
        renderItem={({ item }) => {
          const itemKey = getGroupKey(item);
          const isPending = pendingGroupKey === itemKey;

          return (
            <TouchableOpacity
              className="flex-row items-center gap-3 p-4"
              onPress={() => onGroupItemPress(item)}
            >
              <FavoriteBadgeIcon size={28} className={getGroupBadgeClassName(item.color)} />

              <View className="min-w-0 flex-1 flex-row items-center">
                <Text className="text-black text-body06" numberOfLines={1}>
                  {item.name}
                </Text>
                <PinIcon size={12} className="ms-1.5 text-grey-30" />
                <Text className="text-grey-30 text-caption02">{item.placeCount}</Text>
              </View>

              {isPending ? (
                <ActivityIndicator size="small" color="#2587ff" />
              ) : (
                // 시스템 기본 그룹('내 장소'/'버스')은 편집 메뉴(케밥)를 노출하지 않는다
                !item.system && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`${item.name} 그룹 메뉴`}
                    hitSlop={8}
                    onPress={(event) => onGroupMenuPress(item, event)}
                  >
                    <MoreVerticalIcon size={20} className="text-grey-30" />
                  </TouchableOpacity>
                )
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* 정렬 드롭다운 메뉴. ListHeaderComponent 내부는 FlatList가 아이템별로 별도 셀에 감싸 렌더링해서
          absolute + zIndex가 뒤에 오는 리스트 아이템 셀을 넘어서지 못한다 — FlatList 밖의 최상위 형제로
          빼서 "새 그룹 추가" 버튼처럼 항상 리스트 위에 그려지도록 한다. */}
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

      {/* 그룹 케밥(더보기) 메뉴. 정렬 드롭다운과 동일한 구조 — backdrop으로 바깥 클릭 시 닫히고,
          FlatList 밖의 최상위 형제라 항상 리스트 위에 그려진다. */}
      {openGroupMenuGroup && (
        <>
          <Pressable
            className="absolute inset-0"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            onPress={() => setOpenGroupMenuKey(null)}
          />
          <View
            className="absolute w-[84px] bg-white py-1.5"
            style={{
              top: groupMenuAnchorY,
              right: 16,
              boxShadow: '0px 2px 6px rgba(23,23,27,0.15), 0px 1px 4px rgba(23,23,27,0.15)',
            }}
          >
            {GROUP_MENU_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                className="items-center px-2 py-1"
                onPress={() =>
                  option === '수정하기'
                    ? onEditGroupPress(openGroupMenuGroup)
                    : onDeleteGroupPress(openGroupMenuGroup)
                }
              >
                <Text className="text-grey-30 text-caption02">{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* 새 그룹 추가 버튼 */}
      <TouchableOpacity
        className="absolute flex-row items-center gap-1 rounded-full border border-blue-35 bg-white px-4 py-2.5"
        style={{
          right: 16,
          bottom: insets.bottom + 16,
          boxShadow: '0px 2px 6px rgba(23,23,27,0.15), 0px 1px 4px rgba(23,23,27,0.15)',
        }}
        onPress={onNewGroupPress}
      >
        <PlusIcon size={14} className="text-blue-35" />
        <Text className="text-blue-35 text-body04">새 그룹 추가</Text>
      </TouchableOpacity>

      {/* 새 그룹 추가 / 그룹명 수정 바텀시트 */}
      <GroupEditSheet ref={groupEditSheetRef} />

      {/* 그룹 삭제 확인 다이얼로그 */}
      <Dialog
        open={deleteTargetGroup !== null}
        onOpenChange={(open) => !open && setDeleteTargetGroup(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="mx-6 w-[320px] max-w-[320px] gap-4 rounded-xl border-none py-[24px]"
        >
          <DialogHeader className="gap-1">
            <DialogTitle className="text-center text-grey-80 text-body04">
              {`'${deleteTargetGroup?.name}' 그룹을 삭제하시겠습니까?`}
            </DialogTitle>
            <DialogDescription className="text-center text-grey-80 text-caption02">
              그룹 내 저장된 장소와 메모가 모두 삭제되며{'\n'}복구할 수 없습니다.
            </DialogDescription>
          </DialogHeader>

          <View className="flex-row gap-2">
            <Button
              variant="outline"
              className="h-[36px] flex-1 p-0"
              onPress={() => setDeleteTargetGroup(null)}
              disabled={isDeletingGroup}
            >
              <Text className="text-black text-body06">취소</Text>
            </Button>

            <Button
              className="h-[36px] flex-1 p-0"
              onPress={onDeleteConfirmPress}
              disabled={isDeletingGroup}
            >
              <Text className="text-white text-body06">
                {isDeletingGroup ? '삭제 중...' : '삭제'}
              </Text>
            </Button>
          </View>
        </DialogContent>
      </Dialog>
    </View>
  );
}
