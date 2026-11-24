import * as React from 'react';
import {
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { makeMutable, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 하단 탭바가 내려간 정도(0 다 보임, 1 화면 아래로 다 내려가 안 보임). 탭바와 여러 탭 화면의 스크롤이
// 같은 값을 읽고 써야 해서 앱에 하나만 둔다
export const tabBarHiddenProgress = makeMutable(0);

// 같은 방향으로 계속 스크롤하는 동안 애니메이션을 매번 새로 시작하지 않게 마지막 목표를 기억한다
const target = { hidden: false };

// 출렁이지 않고 부드럽게 멈추는 스프링(감쇠비 1). 손을 떼도 갑자기 끊기지 않고 속도가 자연스럽게 줄어든다
const SPRING = { dampingRatio: 1, duration: 480 };

// 손가락이 조금 떨리는 정도로는 숨기거나 꺼내지 않는다
const MIN_DELTA = 6;
// 맨 위 근처에서는 항상 보인다
const TOP_ZONE = 24;

export const TAB_BAR = {
  pillHeight: 58,
  sideMargin: 28,
  maxWidth: 360,
};

// 이 폭 이상(PC 웹, 태블릿)에서는 떠 있는 유리 캡슐 대신 화면 폭 전체의 기존 하단 탭바를 쓴다.
// 스크롤하면 숨는 캡슐은 한 손으로 쓰는 폰 화면에서 내용을 넓게 보려고 만든 것이라서
const WIDE_SCREEN_MIN_WIDTH = 768;

export function useIsWideScreen() {
  const { width } = useWindowDimensions();
  return width >= WIDE_SCREEN_MIN_WIDTH;
}

// 홈 인디케이터 바로 위에 띄운다. 인디케이터가 없는 기기·웹은 12만큼 띄운다
export function tabBarBottomGap(insetBottom: number) {
  return Math.max(insetBottom - 4, 12);
}

export function setTabBarHidden(hidden: boolean) {
  if (target.hidden === hidden) return;
  target.hidden = hidden;
  tabBarHiddenProgress.value = withSpring(hidden ? 1 : 0, SPRING);
}

// 탭 화면의 세로 ScrollView에 단다. 아래로 내리면 탭바가 화면 아래로 내려가 숨고, 위로 올리면 다시 올라온다.
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
      setTabBarHidden(false);
      return;
    }
    // iOS 바닥에서 튕길 때 생기는 위쪽 움직임은 사용자가 올린 게 아니라서 무시한다
    if (y + layoutMeasurement.height >= contentSize.height - 2) return;
    if (delta > MIN_DELTA) setTabBarHidden(true);
    if (delta < -MIN_DELTA) setTabBarHidden(false);
  }, []);

  // 큰 화면의 기존 탭바는 화면 위에 뜨지 않고 자리를 차지해서 여백이 필요 없다
  const isWideScreen = useIsWideScreen();
  const bottomSpace = isWideScreen ? 0 : TAB_BAR.pillHeight + tabBarBottomGap(insets.bottom) + 12;
  return { onScroll, bottomSpace };
}
