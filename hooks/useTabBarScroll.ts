import * as React from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { makeMutable, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 하단 탭바가 접힌 정도(0 다 펼침, 1 현재 탭 아이콘만 남은 작은 캡슐). 탭바와 여러 탭 화면의 스크롤이
// 같은 값을 읽고 써야 해서 앱에 하나만 둔다
export const tabBarMinimizeProgress = makeMutable(0);

// 같은 방향으로 계속 스크롤하는 동안 애니메이션을 매번 새로 시작하지 않게 마지막 목표를 기억하고,
// 접힘 여부가 바뀌면 탭바에 알린다(접힌 동안은 작은 캡슐만 눌리게 하려고)
const target = { minimized: false };
const listeners = new Set<() => void>();

// iOS 탭바처럼 살짝 탄력 있게 접히고 펼쳐진다
const SPRING = { dampingRatio: 0.86, duration: 520 };

// 손가락이 조금 떨리는 정도로는 접거나 펼치지 않는다
const MIN_DELTA = 6;
// 맨 위 근처에서는 항상 펼친다
const TOP_ZONE = 24;

export const TAB_BAR = {
  pillHeight: 58,
  miniSize: 50,
  sideMargin: 28,
  maxWidth: 360,
};

// 홈 인디케이터 바로 위에 띄운다. 인디케이터가 없는 기기·웹은 12만큼 띄운다
export function tabBarBottomGap(insetBottom: number) {
  return Math.max(insetBottom - 4, 12);
}

export function setTabBarMinimized(minimized: boolean) {
  if (target.minimized === minimized) return;
  target.minimized = minimized;
  tabBarMinimizeProgress.value = withSpring(minimized ? 1 : 0, SPRING);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useTabBarMinimized() {
  return React.useSyncExternalStore(
    subscribe,
    () => target.minimized,
    () => false
  );
}

// 탭 화면의 세로 ScrollView에 단다. 아래로 내리면 탭바를 작게 접고, 위로 올리면 다시 펼친다.
// 탭바가 화면 위에 떠 있어서, 마지막 내용이 가리지 않게 bottomSpace만큼 스크롤 끝에 여백을 둔다
export function useTabBarScroll() {
  const insets = useSafeAreaInsets();
  const lastY = React.useRef(0);

  const onScroll = React.useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const y = contentOffset.y;
    const delta = y - lastY.current;
    lastY.current = y;

    if (y <= TOP_ZONE) {
      setTabBarMinimized(false);
      return;
    }
    // iOS 바닥에서 튕길 때 생기는 위쪽 움직임은 사용자가 올린 게 아니라서 무시한다
    if (y + layoutMeasurement.height >= contentSize.height - 2) return;
    if (delta > MIN_DELTA) setTabBarMinimized(true);
    if (delta < -MIN_DELTA) setTabBarMinimized(false);
  }, []);

  const bottomSpace = TAB_BAR.pillHeight + tabBarBottomGap(insets.bottom) + 12;
  return { onScroll, bottomSpace };
}
