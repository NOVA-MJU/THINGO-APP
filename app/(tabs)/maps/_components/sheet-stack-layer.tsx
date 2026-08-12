import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import SheetHandle from './sheets/sheet-handle';

interface SheetStackLayerProps {
  sheetRef: React.RefObject<BottomSheet | null>;
  initialIndex: number;
  snapPoints: string[];
  topInset: number;
  onChange: (index: number) => void;
  onClose: () => void;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  children: React.ReactNode;
}

// 카테고리 시트 위에 쌓이는 스택 레이어 하나 (places 목록, building/place 상세 등)
// 언마운트되지 않고 index 0으로 접혔다가 복귀하는 방식으로 스크롤/페이지네이션 상태를 유지한다
export default function SheetStackLayer({
  sheetRef,
  initialIndex,
  snapPoints,
  topInset,
  onChange,
  onClose,
  onScroll,
  children,
}: SheetStackLayerProps) {
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
      <BottomSheetScrollView onScroll={onScroll}>{children}</BottomSheetScrollView>
    </BottomSheet>
  );
}
