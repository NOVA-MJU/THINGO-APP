import {
  createFavoriteGroup,
  getFavoriteGroupErrorMessage,
  updateFavoriteGroup,
  type FavoriteGroup,
} from '@/api/maps-favorites';
import { XThinIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { showAlert } from '@/lib/alert';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GROUP_COLORS, { type GroupColor } from '../_constants/group-colors';

// 서버 기본값(미지정 시 BLUE, 띵고 색)과 맞춘 초기 선택 색상
const DEFAULT_GROUP_COLOR = GROUP_COLORS.find((color) => color.label === 'BLUE') ?? GROUP_COLORS[0];

export type GroupEditSheetHandle = {
  // group을 안 넘기면 "새 그룹 추가", 넘기면 그 그룹 값으로 채운 "그룹명 수정" 모드로 연다.
  // 시스템 그룹(내 장소/버스)은 부모(favorites/index.tsx)가 케밥 메뉴 자체를 숨겨서 여기로 들어오지 않는다.
  open: (group?: FavoriteGroup | null) => void;
};

type GroupEditSheetProps = {
  // 생성/수정 성공 시(그룹 목록 무효화 이후) 호출. 즐겨찾기 저장 바텀시트(favorite-save-sheet.tsx)에서
  // "새 그룹 추가"로 만든 그룹을 그 자리에서 바로 체크 상태로 반영할 때 사용한다.
  onSaved?: (group: FavoriteGroup) => void;
};

// 즐겨찾기 "새 그룹 추가" / "그룹명 수정" 바텀시트.
// BottomSheetModal은 @gorhom/portal로 앱 루트에 렌더링되어 (tabs) 하단 네비게이션 바까지 덮음
const GroupEditSheet = React.forwardRef<GroupEditSheetHandle, GroupEditSheetProps>(
  function GroupEditSheet({ onSaved }, ref) {
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();
    const sheetRef = React.useRef<BottomSheetModal>(null);
    // null이면 새 그룹 추가 모드, 값이 있으면 그 그룹을 수정하는 모드
    const [editingGroup, setEditingGroup] = React.useState<FavoriteGroup | null>(null);
    const [groupName, setGroupName] = React.useState('');
    const [selectedColor, setSelectedColor] = React.useState<GroupColor>(DEFAULT_GROUP_COLOR);
    const isEditMode = editingGroup !== null;

    React.useImperativeHandle(
      ref,
      () => ({
        open(group) {
          setEditingGroup(group ?? null);
          setGroupName(group?.name ?? '');
          setSelectedColor(
            (group && GROUP_COLORS.find((color) => color.label === group.color)) ||
              DEFAULT_GROUP_COLOR
          );
          sheetRef.current?.present();
        },
      }),
      []
    );

    const { mutate: saveGroup, isPending } = useMutation({
      mutationFn: () => {
        // editingGroup이 있는데 id가 null인 경우는 없다 — id가 null인 건 '버스' 시스템 그룹뿐이고
        // 시스템 그룹은 애초에 open()에 넘어오지 않는다(부모가 케밥 메뉴를 숨김). 방어적으로만 분기.
        if (editingGroup && editingGroup.id !== null) {
          return updateFavoriteGroup({
            groupId: editingGroup.id,
            name: groupName.trim(),
            color: selectedColor.label,
          });
        }
        return createFavoriteGroup({ name: groupName.trim(), color: selectedColor.label });
      },
      onSuccess: (group) => {
        queryClient.invalidateQueries({ queryKey: ['favorite-groups'] });
        sheetRef.current?.dismiss();
        onSaved?.(group);
      },
      onError: (error) => {
        showAlert(
          isEditMode ? '그룹 수정 실패' : '그룹 생성 실패',
          getFavoriteGroupErrorMessage(error, '잠시 후 다시 시도해주세요.')
        );
      },
    });

    function onSavePress() {
      saveGroup();
    }

    return (
      <BottomSheetModal
        ref={sheetRef}
        enablePanDownToClose
        enableOverDrag={false}
        // 기본값 'switch'는 현재 떠 있는 모달(favorite-save-sheet.tsx에서 연 경우)을 최소화시켜버려서
        // 이 시트를 닫아도 아래 모달이 그냥 사라진 것처럼 보인다. 'push'는 현재 모달을 그대로 둔 채
        // 이 시트를 그 위에 쌓아서, 닫으면 아래 모달이 그대로 다시 보이는 스택 형태로 동작한다.
        stackBehavior="push"
        // Android 기본값(adjustPan)은 키보드가 열려도 시트 위치를 못 따라가서 인풋을 가린다.
        // adjustResize로 바꿔야 시트가 키보드 높이만큼 밀려 올라간다. iOS는 keyboardBehavior
        // 기본값(interactive)만으로 이미 동일하게 동작해서 별도 설정이 필요 없다.
        android_keyboardInputMode="adjustResize"
        backdropComponent={GroupEditSheetBackdrop}
        handleComponent={Handle}
      >
        <BottomSheetView className="px-4">
          <View className="flex-row items-center justify-center">
            <Text className="text-black text-title03">
              {isEditMode ? '그룹명 수정' : '새 그룹 추가'}
            </Text>
            <TouchableOpacity
              className="absolute right-0"
              accessibilityRole="button"
              accessibilityLabel="닫기"
              hitSlop={8}
              onPress={() => sheetRef.current?.dismiss()}
            >
              <XThinIcon size={24} className="text-grey-30" />
            </TouchableOpacity>
          </View>
          <View className="-mx-4 mt-4 h-1 bg-grey-02" />
          <View className="mt-4 gap-2">
            <Text className="text-grey-80 text-body02">그룹 명</Text>
            <Input
              placeholder="설정하실 그룹명을 입력해 주세요."
              value={groupName}
              onChangeText={setGroupName}
              maxLength={12}
            />
          </View>
          <View className="mt-4 gap-2">
            <Text className="text-grey-80 text-body02">그룹 색상</Text>
            <View className="flex-row items-center justify-between">
              {GROUP_COLORS.map((color) => (
                <TouchableOpacity
                  key={color.label}
                  accessibilityRole="button"
                  accessibilityLabel="그룹 색상 선택"
                  hitSlop={4}
                  onPress={() => setSelectedColor(color)}
                >
                  <View className="h-6 w-6">
                    <View className={cn('h-6 w-6 rounded-full', color.swatchClassName)} />
                    {selectedColor.label === color.label && (
                      <View className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full border-[1.5px] border-white" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View className="mt-7" style={{ paddingBottom: insets.bottom + 20 }}>
            <Button onPress={onSavePress} disabled={groupName.trim().length === 0 || isPending}>
              <Text className="text-white">
                {isPending ? (isEditMode ? '수정 중...' : '저장 중...') : '저장'}
              </Text>
            </Button>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

export default GroupEditSheet;

function GroupEditSheetBackdrop(props: BottomSheetBackdropProps) {
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
