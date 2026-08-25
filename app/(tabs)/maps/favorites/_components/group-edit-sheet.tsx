import { createFavoriteGroup } from '@/api/maps-favorites';
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

type GroupEditSheetProps = {
  sheetRef: React.RefObject<BottomSheetModal | null>;
};

// 즐겨찾기 "새 그룹 추가" / "그룹명 수정" 바텀시트.
// BottomSheetModal은 @gorhom/portal로 앱 루트에 렌더링되어 (tabs) 하단 네비게이션 바까지 덮음
export default function GroupEditSheet({ sheetRef }: GroupEditSheetProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [groupName, setGroupName] = React.useState('');
  const [selectedColor, setSelectedColor] = React.useState<GroupColor>(DEFAULT_GROUP_COLOR);

  const { mutate: saveGroup, isPending } = useMutation({
    mutationFn: () => createFavoriteGroup({ name: groupName.trim(), color: selectedColor.label }),
    onSuccess: () => {
      // TODO: 즐겨찾기 그룹 목록이 실제 API로 바뀌면 그 쿼리 키로 맞춰야 함 — 지금은 favorites/index.tsx가
      // 아직 더미 데이터라 무효화할 대상 쿼리가 없어서, 다음 리스트 연동 때 쓸 자리만 미리 잡아둔 것
      queryClient.invalidateQueries({ queryKey: ['favorite-groups'] });
      setGroupName('');
      setSelectedColor(DEFAULT_GROUP_COLOR);
      sheetRef.current?.dismiss();
    },
    onError: () => {
      showAlert('그룹 생성 실패', '잠시 후 다시 시도해주세요.');
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
      // Android 기본값(adjustPan)은 키보드가 열려도 시트 위치를 못 따라가서 인풋을 가린다.
      // adjustResize로 바꿔야 시트가 키보드 높이만큼 밀려 올라간다. iOS는 keyboardBehavior
      // 기본값(interactive)만으로 이미 동일하게 동작해서 별도 설정이 필요 없다.
      android_keyboardInputMode="adjustResize"
      backdropComponent={GroupEditSheetBackdrop}
      handleComponent={Handle}
    >
      <BottomSheetView className="px-4">
        <View className="flex-row items-center justify-center">
          <Text className="text-title03 text-black">새 그룹 추가</Text>
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
          <Text className="text-body02 text-grey-80">그룹 명</Text>
          <Input
            placeholder="설정하실 그룹명을 입력해 주세요."
            value={groupName}
            onChangeText={setGroupName}
            maxLength={12}
          />
        </View>
        <View className="mt-4 gap-2">
          <Text className="text-body02 text-grey-80">그룹 색상</Text>
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
                  <View className={cn('h-6 w-6 rounded-full', color.className)} />
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
            <Text className="text-white">{isPending ? '저장 중...' : '저장'}</Text>
          </Button>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

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
