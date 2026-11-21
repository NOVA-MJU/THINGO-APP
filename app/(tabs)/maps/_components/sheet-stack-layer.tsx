import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { XThinIcon } from '@/components/icons';
import * as React from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable } from 'react-native';
import SheetHandle from './sheets/sheet-handle';

// 시트 내용의 헤더(이름·닫기 버튼)가 이만큼 스크롤돼 가려지면 떠 있는 닫기 버튼을 보여준다
const FLOATING_CLOSE_SCROLL_Y = 48;

interface SheetStackLayerProps {
  sheetRef: React.RefObject<BottomSheet | null>;
  initialIndex: number;
  snapPoints: (string | number)[];
  topInset: number;
  onChange: (index: number) => void;
  onClose: () => void;
  // 떠 있는 닫기 버튼을 눌렀을 때 (이 레이어만 닫고 이전 화면으로 돌아간다)
  onDismiss?: () => void;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  children: React.ReactNode;
}

// 카테고리 시트 위에 쌓이는 스택 레이어 하나 (places 목록, building/place 상세 등)
// 언마운트되지 않고 index 0으로 접혔다가 복귀하는 방식으로 스크롤/페이지네이션 상태를 유지한다
// 시트를 끝까지 올려 내용을 내리면 헤더의 닫기 버튼이 같이 올라가 사라지므로, 오른쪽 위에 얇은 닫기 버튼을 띄운다
export default function SheetStackLayer({
  sheetRef,
  initialIndex,
  snapPoints,
  topInset,
  onChange,
  onClose,
  onDismiss,
  onScroll,
  children,
}: SheetStackLayerProps) {
  const [isHeaderHidden, setIsHeaderHidden] = React.useState(false);

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const hidden = event.nativeEvent.contentOffset.y > FLOATING_CLOSE_SCROLL_Y;
    setIsHeaderHidden((prev) => (prev === hidden ? prev : hidden));
    onScroll?.(event);
  }

  return (
    <BottomSheet
      ref={sheetRef}
      index={initialIndex}
      snapPoints={snapPoints}
      handleComponent={SheetHandle}
      topInset={topInset}
      onChange={onChange}
      onClose={onClose}
    >
      <BottomSheetScrollView onScroll={handleScroll}>{children}</BottomSheetScrollView>
      {onDismiss && isHeaderHidden && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="닫기"
          hitSlop={8}
          onPress={onDismiss}
          className="absolute right-4 top-1 h-8 w-8 items-center justify-center rounded-full bg-white/90 active:opacity-70"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.12,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <XThinIcon size={18} className="text-grey-60" />
        </Pressable>
      )}
    </BottomSheet>
  );
}
