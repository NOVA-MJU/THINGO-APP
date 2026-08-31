import {
  getFavoriteGroupErrorMessage,
  getFavoritePinGroups,
  saveFavoritePinGroups,
  type FavoriteGroup,
} from '@/api/maps-favorites';
import GroupEditSheet, {
  type GroupEditSheetHandle,
} from '@/app/(tabs)/maps/favorites/_components/group-edit-sheet';
import { getGroupBadgeClassName } from '@/app/(tabs)/maps/favorites/_constants/group-colors';
import { CheckCircleIcon, PlusIcon, XThinIcon } from '@/components/icons';
import { FavoriteBadgeIcon, PinIcon } from '@/components/icons/map';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { showAlert } from '@/lib/alert';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as React from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type FavoriteSaveSheetTarget = {
  pinId: number;
  name: string;
};

export type FavoriteSaveSheetHandle = {
  open: (target: FavoriteSaveSheetTarget) => void;
};

// 건물/장소 상세 시트의 즐겨찾기 버튼 클릭 시 뜨는 즐겨찾기 저장 바텀시트.
// "새 그룹 추가"는 favorites/index.tsx와 동일한 group-edit-sheet.tsx를 그대로 재사용해서 연다
// (생성 성공 시 onGroupCreated로 새 그룹을 바로 체크 상태로 반영).
// BottomSheetModal은 @gorhom/portal로 앱 루트에 렌더링되어, BuildingDetailSheet/PlaceDetailSheet가
// 이미 스택 레이어(BottomSheet) 안에 있어도 화면 전체를 덮는 모달로 뜬다 (group-edit-sheet.tsx와 동일한 패턴).
const FavoriteSaveSheet = React.forwardRef<FavoriteSaveSheetHandle>(
  function FavoriteSaveSheet(_props, ref) {
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();
    const sheetRef = React.useRef<BottomSheetModal>(null);
    const groupEditSheetRef = React.useRef<GroupEditSheetHandle>(null);
    const [target, setTarget] = React.useState<FavoriteSaveSheetTarget | null>(null);

    const pinGroupsQuery = useQuery({
      queryKey: ['favorite-pin-groups', target?.pinId],
      queryFn: () => getFavoritePinGroups(target!.pinId),
      enabled: target !== null,
    });

    // 메모 입력값 / 그룹 체크 선택 상태 — 조회 결과가 도착할 때 서버 값으로 초기화한다.
    // initializedPinIdRef로 "이 핀에 대해 이미 초기화했는지"를 추적해서, 같은 핀을 여는 동안
    // "새 그룹 추가" 성공 후 트리거되는 재조회(아래 onGroupCreated)에는 이 초기화가 다시 일어나지
    // 않도록 한다 — 그러지 않으면 방금 새로 체크한 그룹 선택이 재조회 결과로 덮어써진다.
    // open()에서 이 ref를 null로 되돌려서, 매번 열 때는 항상 서버 값으로 새로 초기화되게 한다.
    const [memo, setMemo] = React.useState('');
    const [selectedGroupIds, setSelectedGroupIds] = React.useState<Set<number>>(new Set());
    const initializedPinIdRef = React.useRef<number | null>(null);
    React.useEffect(() => {
      if (!pinGroupsQuery.data) return;
      if (initializedPinIdRef.current === pinGroupsQuery.data.pinId) return;
      initializedPinIdRef.current = pinGroupsQuery.data.pinId;
      setMemo(pinGroupsQuery.data.memo ?? '');
      setSelectedGroupIds(
        new Set(
          pinGroupsQuery.data.groups.filter((group) => group.selected).map((group) => group.id)
        )
      );
    }, [pinGroupsQuery.data]);

    React.useImperativeHandle(
      ref,
      () => ({
        open(nextTarget) {
          setTarget(nextTarget);
          // 다음 조회 결과가 도착하면 memo/selectedGroupIds를 무조건 서버 값으로 다시 초기화하도록 표시
          initializedPinIdRef.current = null;
          // 같은 핀을 다시 열 때도(queryKey가 안 바뀌어 자동 재요청이 안 됨) 매번 최신 상태를 다시 조회한다.
          queryClient.invalidateQueries({ queryKey: ['favorite-pin-groups', nextTarget.pinId] });
          sheetRef.current?.present();
        },
      }),
      [queryClient]
    );

    const placeName = pinGroupsQuery.data?.placeName ?? target?.name ?? '';
    // '버스'(SYSTEM_BUS)는 핀을 담을 수 없는 시스템 그룹이라 응답에 섞여 와도 목록에서 제외한다
    const groups = (pinGroupsQuery.data?.groups ?? []).filter(
      (group) => group.type !== 'SYSTEM_BUS'
    );

    function onGroupPress(groupId: number) {
      setSelectedGroupIds((prev) => {
        const next = new Set(prev);
        if (next.has(groupId)) {
          next.delete(groupId);
        } else {
          next.add(groupId);
        }
        return next;
      });
    }

    // "새 그룹 추가" 완료 → 새 그룹을 바로 체크 상태로 추가하고, 목록(pinGroupsQuery)을 다시 조회해
    // 새 그룹이 체크리스트에 나타나게 한다. initializedPinIdRef가 이미 이 핀으로 설정돼 있어서
    // 재조회 결과가 와도 위 useEffect가 selectedGroupIds를 서버 값으로 되돌리지 않는다.
    function onGroupCreated(group: FavoriteGroup) {
      if (!target || group.id === null) return;
      setSelectedGroupIds((prev) => new Set(prev).add(group.id!));
      queryClient.invalidateQueries({ queryKey: ['favorite-pin-groups', target.pinId] });
    }

    // 저장 버튼 — groupIds/memo를 통째로 교체하는 방식이라 항상 현재 선택 상태 전체를 보낸다.
    const { mutate: savePinGroups, isPending: isSaving } = useMutation({
      mutationFn: () =>
        saveFavoritePinGroups({
          pinId: target!.pinId,
          groupIds: Array.from(selectedGroupIds),
          memo,
        }),
      onSuccess: (data) => {
        queryClient.setQueryData(['favorite-pin-groups', data.pinId], data);
        // 별 아이콘 상태(favorite)·그룹별 placeCount·그룹 상세 목록에 전부 영향을 주므로 같이 무효화
        queryClient.invalidateQueries({ queryKey: ['map-building-detail'] });
        queryClient.invalidateQueries({ queryKey: ['map-place-detail'] });
        queryClient.invalidateQueries({ queryKey: ['map-category-pins'] });
        queryClient.invalidateQueries({ queryKey: ['map-search'] });
        queryClient.invalidateQueries({ queryKey: ['favorite-groups'] });
        queryClient.invalidateQueries({ queryKey: ['favorite-group-places'] });
        sheetRef.current?.dismiss();
      },
      onError: (error) => {
        showAlert(
          '즐겨찾기 저장 실패',
          getFavoriteGroupErrorMessage(error, '잠시 후 다시 시도해주세요.')
        );
      },
    });

    function onSavePress() {
      if (!target) return;
      savePinGroups();
    }

    return (
      <>
        <BottomSheetModal
          ref={sheetRef}
          enablePanDownToClose
          backdropComponent={FavoriteSaveSheetBackdrop}
          handleComponent={Handle}
          enableOverDrag={false}
        >
          <BottomSheetView style={{ paddingBottom: insets.bottom }}>
            {/* 장소 이름 */}
            <View className="flex-row items-center justify-center">
              <Text className="text-black text-title03" numberOfLines={1}>
                {placeName}
              </Text>
              <TouchableOpacity
                className="absolute right-4"
                accessibilityRole="button"
                accessibilityLabel="닫기"
                hitSlop={8}
                onPress={() => sheetRef.current?.dismiss()}
              >
                <XThinIcon size={24} className="text-grey-30" />
              </TouchableOpacity>
            </View>

            {/* 장소 메모 입력 박스 — 서버 초기값으로 시작하고, 저장 버튼을 누르면 서버에 실제로 반영  */}
            <View className="mt-4 px-4">
              <Input
                placeholder="장소에 대한 메모를 추가해보세요"
                className="text-black text-caption02 placeholder:text-grey-30"
                value={memo}
                onChangeText={setMemo}
                maxLength={30}
              />
            </View>
            <View className="mt-4 h-1 bg-grey-02" />

            {/* 새 그룹 추가 버튼 */}
            <View className="mt-4 items-end px-5">
              <TouchableOpacity
                className="flex-row items-center gap-1"
                hitSlop={8}
                onPress={() => groupEditSheetRef.current?.open()}
              >
                <PlusIcon size={12} className="text-blue-15" />
                <Text className="text-blue-15 text-caption02">새 그룹 추가</Text>
              </TouchableOpacity>
            </View>

            {/* 즐겨찾기 그룹 목록 표시 — 탭하면 로컬 선택 상태만 토글, 저장 버튼 클릭 시 서버에 저장 */}
            <ScrollView className="mt-1.5 max-h-80 min-h-60">
              {pinGroupsQuery.isLoading ? (
                <View className="items-center py-8">
                  <ActivityIndicator color="#2587ff" />
                </View>
              ) : pinGroupsQuery.isError ? (
                <View className="items-center py-8">
                  <Text className="text-grey-30 text-body05">
                    {getFavoriteGroupErrorMessage(
                      pinGroupsQuery.error,
                      '그룹 목록을 불러오지 못했습니다'
                    )}
                  </Text>
                </View>
              ) : (
                groups.map((group) => (
                  <TouchableOpacity
                    key={group.id}
                    className="flex-row items-center gap-1.5 px-4 py-2.5"
                    onPress={() => onGroupPress(group.id)}
                  >
                    <FavoriteBadgeIcon size={20} className={getGroupBadgeClassName(group.color)} />
                    <Text className="ms-1 text-black text-body06">{group.name}</Text>
                    <View className="flex-1 flex-row items-center">
                      <PinIcon size={16} className="text-grey-30" />
                      <Text className="flex-1 text-grey-30 text-caption02">{group.placeCount}</Text>
                    </View>
                    <CheckCircleIcon size={20} checked={selectedGroupIds.has(group.id)} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* 저장 버튼 */}
            <View className="p-4">
              <Button onPress={onSavePress} disabled={isSaving || pinGroupsQuery.isLoading}>
                <Text>{isSaving ? '저장 중...' : '저장'}</Text>
              </Button>
            </View>
          </BottomSheetView>
        </BottomSheetModal>

        <GroupEditSheet ref={groupEditSheetRef} onSaved={onGroupCreated} />
      </>
    );
  }
);

export default FavoriteSaveSheet;

function FavoriteSaveSheetBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      pressBehavior="close"
    />
  );
}

function Handle() {
  return (
    <View className="items-center justify-center">
      <View className="my-4 h-1 w-10 rounded-full bg-grey-10"></View>
    </View>
  );
}
