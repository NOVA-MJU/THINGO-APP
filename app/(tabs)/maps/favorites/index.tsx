import { AppHeader } from '@/components/app-header';
import { ArrowDownIcon, MoreVerticalIcon, PlusIcon } from '@/components/icons';
import { FavoriteBadgeIcon, PinIcon } from '@/components/icons/map';
import { Text } from '@/components/ui/text';
import { showAlert } from '@/lib/alert';
import { cn } from '@/lib/utils';
import { useRouter } from 'expo-router';
import * as React from 'react';
import type { GestureResponderEvent } from 'react-native';
import { FlatList, Pressable, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 즐겨찾기 정렬 옵션
const SORT_OPTIONS = ['최신순', '가나다순', '장소 추가순'] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

// 그룹 아이템 케밥 메뉴 옵션
const GROUP_MENU_OPTIONS = ['수정하기', '삭제하기'] as const;

// 즐겨찾기 그룹 더미 데이터. 'my-places'/'bus'는 시스템 기본 그룹이라 편집 메뉴(케밥)를 노출하지 않는다.
// colorClassName은 FavoriteBadgeIcon의 배경색(className으로 자유롭게 지정)에 그대로 전달된다.
type FavoriteGroup = {
  id: string;
  name: string;
  placeCount: number;
  colorClassName: string;
  system?: boolean;
};

const DUMMY_FAVORITE_GROUPS: FavoriteGroup[] = [
  {
    id: 'my-places',
    name: '내 장소',
    placeCount: 12,
    colorClassName: 'text-blue-35',
  },
  { id: 'bus', name: '버스', placeCount: 12, colorClassName: 'text-[#F2A93B]' },
  { id: 'group-1', name: '그룹명', placeCount: 0, colorClassName: 'text-[#F2A93B]' },
  { id: 'group-2', name: '그룹명', placeCount: 12, colorClassName: 'text-blue-35' },
  { id: 'group-3', name: '그룹명', placeCount: 12, colorClassName: 'text-[#F2803C]' },
  { id: 'group-4', name: '그룹명', placeCount: 12, colorClassName: 'text-[#F2A93B]' },
  { id: 'group-5', name: '그룹명', placeCount: 1777, colorClassName: 'text-[#34A853]' },
  { id: 'group-6', name: '그룹명', placeCount: 16, colorClassName: 'text-blue-35' },
  { id: 'group-7', name: '그룹명', placeCount: 14, colorClassName: 'text-blue-35' },
  { id: 'group-8', name: '그룹명', placeCount: 12, colorClassName: 'text-blue-35' },
  { id: 'group-9', name: '그룹명', placeCount: 123, colorClassName: 'text-[#F2803C]' },
];

export default function MapsFavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isSortMenuOpen, setSortMenuOpen] = React.useState(false);
  const [sortOption, setSortOption] = React.useState<SortOption>('최신순');
  // 케밥 메뉴가 열려있는 그룹 id와, 눌린 위치(pageY) — 메뉴를 그 아래에 띄우는 데 사용
  const [openGroupMenuId, setOpenGroupMenuId] = React.useState<string | null>(null);
  const [groupMenuAnchorY, setGroupMenuAnchorY] = React.useState(0);

  // TODO: 실제 즐겨찾기 그룹 API 연동 전까지 더미 데이터 사용
  const favoriteGroups = DUMMY_FAVORITE_GROUPS;
  const openGroupMenuGroup = React.useMemo(
    () => favoriteGroups.find((group) => group.id === openGroupMenuId) ?? null,
    [favoriteGroups, openGroupMenuId]
  );

  function onNewGroupPress() {
    showAlert('안내', '준비 중인 기능입니다.');
  }

  // 그룹 아이템 클릭 — 해당 그룹의 즐겨찾기 장소 목록 페이지로 이동
  function onGroupItemPress(group: FavoriteGroup) {
    router.push(`/maps/favorites/${group.id}`);
  }

  // 그룹 아이템 케밥 아이콘 클릭 — 정렬 드롭다운은 닫고, 눌린 위치 아래에 케밥 메뉴를 띄운다
  function onGroupMenuPress(group: FavoriteGroup, event: GestureResponderEvent) {
    setSortMenuOpen(false);
    setGroupMenuAnchorY(event.nativeEvent.pageY + 12);
    setOpenGroupMenuId((prev) => (prev === group.id ? null : group.id));
  }

  // "수정하기" 메뉴 클릭
  function onEditGroupPress(group: FavoriteGroup) {
    setOpenGroupMenuId(null);
    showAlert(group.name, '준비 중인 기능입니다.');
  }

  // "삭제하기" 메뉴 클릭
  function onDeleteGroupPress(group: FavoriteGroup) {
    setOpenGroupMenuId(null);
    showAlert(group.name, '준비 중인 기능입니다.');
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
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom }}
        // 정렬 옵션 버튼
        ListHeaderComponent={
          <View className="items-end p-4">
            <TouchableOpacity
              className="flex-row items-center gap-1"
              hitSlop={4}
              onPress={() => {
                setOpenGroupMenuId(null);
                setSortMenuOpen((prev) => !prev);
              }}
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
            <Text className="text-body05 text-grey-30">즐겨찾기 그룹이 없습니다</Text>
          </View>
        }
        // 아이템
        renderItem={({ item }) => (
          <TouchableOpacity
            className="flex-row items-center gap-3 px-4"
            hitSlop={8}
            onPress={() => onGroupItemPress(item)}
          >
            <FavoriteBadgeIcon size={28} className={item.colorClassName} />

            <View className="min-w-0 flex-1 flex-row items-center">
              <Text className="text-body06 text-black" numberOfLines={1}>
                {item.name}
              </Text>
              <PinIcon size={12} className="ms-1.5 text-grey-30" />
              <Text className="text-caption02 text-grey-30">{item.placeCount}</Text>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`${item.name} 그룹 메뉴`}
              hitSlop={8}
              onPress={(event) => onGroupMenuPress(item, event)}
            >
              <MoreVerticalIcon size={20} className="text-grey-30" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
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
            onPress={() => setOpenGroupMenuId(null)}
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
                <Text className="text-caption02 text-grey-30">{option}</Text>
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
        <Text className="text-body04 text-blue-35">새 그룹 추가</Text>
      </TouchableOpacity>
    </View>
  );
}
