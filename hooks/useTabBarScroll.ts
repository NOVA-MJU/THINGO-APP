import * as React from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Easing, makeMutable, withTiming } from 'react-native-reanimated';

// 하단 탭바가 숨은 정도(0 다 보임, 1 다 숨음). 탭바와 여러 탭 화면의 스크롤이 같은 값을 읽고 써야 해서 앱에 하나만 둔다
export const tabBarHiddenProgress = makeMutable(0);

// 같은 방향으로 계속 스크롤하는 동안 애니메이션을 매번 새로 시작하지 않게 마지막 목표를 기억한다
const target = { hidden: false };

// 손가락이 조금 떨리는 정도로는 숨기거나 꺼내지 않는다
const MIN_DELTA = 6;
// 맨 위 근처에서는 항상 보인다
const TOP_ZONE = 24;

export function setTabBarHidden(hidden: boolean) {
  if (target.hidden === hidden) return;
  target.hidden = hidden;
  tabBarHiddenProgress.value = withTiming(hidden ? 1 : 0, {
    duration: 280,
    easing: Easing.out(Easing.cubic),
  });
}

// 탭 화면의 세로 ScrollView에 onScroll로 단다. 아래로 내리면 탭바를 숨기고, 위로 올리면 다시 띄운다
export function useTabBarScroll() {
  const lastY = React.useRef(0);

  return React.useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const y = contentOffset.y;
    const delta = y - lastY.current;
    lastY.current = y;

    if (y <= TOP_ZONE) {
      setTabBarHidden(false);
      return;
    }
    // iOS 바닥에서 튕길 때 생기는 위쪽 움직임은 사용자가 올린 게 아니라서 무시한다
    if (y + layoutMeasurement.height >= contentSize.height - 2) return;
    if (delta > MIN_DELTA) setTabBarHidden(true);
    if (delta < -MIN_DELTA) setTabBarHidden(false);
  }, []);
}
