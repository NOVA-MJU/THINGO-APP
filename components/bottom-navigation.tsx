import {
  setTabBarMinimized,
  TAB_BAR,
  tabBarBottomGap,
  tabBarMinimizeProgress,
  useTabBarMinimized,
} from '@/hooks/useTabBarScroll';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { usePathname, useRouter } from 'expo-router';
import * as React from 'react';
import { Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExploreIcon, HomeIcon, MapIcon, ProfileIcon } from './icons/navigation';
import { Text } from './ui/text';

const TABS = [
  { key: 'home', label: '홈', Icon: HomeIcon, href: '/' },
  { key: 'map', label: '명지도', Icon: MapIcon, href: '/maps' },
  { key: 'category', label: '카테고리', Icon: ExploreIcon, href: '/categories' },
  { key: 'my', label: '마이', Icon: ProfileIcon, href: '/profile' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const AUTH_PATHS = ['/login', '/signup', '/forgot-password'];

// 탭바를 화면 위에 띄워 뒤 내용이 비치게 하는 화면. 이 화면들은 스크롤하면 탭바가 접히고(useTabBarScroll)
// 스크롤 끝에 탭바만큼 여백을 둔다. 지도처럼 화면 아래쪽에 버튼·시트를 붙이는 화면은 탭바 자리를 비워 둔다
const FLOATING_PATHS = [
  '/',
  '/meal',
  '/posts',
  '/notices',
  '/academic-calendar',
  '/news',
  '/newspaper',
  '/categories',
  '/profile',
];

// iOS 26 이상은 시스템 유리(Liquid Glass)를 쓴다
const USE_LIQUID_GLASS = Platform.OS === 'ios' && isLiquidGlassAvailable();

// 유리를 못 쓰는 곳의 바탕. 안드로이드·iOS 26 미만은 반투명 흰색, 웹은 뒤를 흐리게 비추는 반투명 흰색으로 둔다
const FALLBACK_SURFACE = Platform.select<ViewStyle>({
  web: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  default: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(23, 23, 27, 0.08)',
  },
});

// react-native-web은 backdrop-filter 스타일을 걸러내서 웹에서는 DOM 요소에 직접 넣는다
function applyWebBackdropBlur(node: View | null) {
  if (Platform.OS !== 'web' || !node) return;
  const element = node as unknown as HTMLElement;
  element.style.setProperty('backdrop-filter', 'blur(20px) saturate(180%)');
  element.style.setProperty('-webkit-backdrop-filter', 'blur(20px) saturate(180%)');
}

// 캡슐이 내용 위에 떠 보이게 하는 그림자. 시스템 유리는 자체 그림자가 있어 웹·안드로이드·iOS 26 미만만 준다
const PILL_SHADOW = Platform.select<ViewStyle>({
  web: { boxShadow: '0 6px 24px rgba(23, 23, 27, 0.12)' } as ViewStyle,
  android: { elevation: 8 },
  default: USE_LIQUID_GLASS
    ? {}
    : {
        shadowColor: '#17171b',
        shadowOpacity: 0.12,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 6 },
      },
});

// 선택 표시가 다른 탭으로 미끄러지는 속도. 접고 펼치는 것보다 짧고 탄력 있게 한다
const SELECT_SPRING = { dampingRatio: 0.78, duration: 420 };
const PRESS_SPRING = { dampingRatio: 0.6, duration: 260 };

function getActiveKey(pathname: string): TabKey {
  if (pathname.startsWith('/maps')) return 'map';
  if (pathname.startsWith('/categories')) return 'category';
  if (pathname.startsWith('/profile') || AUTH_PATHS.some((p) => pathname.startsWith(p)))
    return 'my';
  return 'home';
}

// 누르면 살짝 눌렸다가 튀어 오른다
function TabButton({
  label,
  Icon,
  isActive,
  onPress,
}: {
  label: string;
  Icon: (typeof TABS)[number]['Icon'];
  isActive: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const color = isActive ? 'text-blue-35' : 'text-grey-40';

  return (
    <Pressable
      accessibilityState={{ selected: isActive }}
      className="h-full flex-1 items-center justify-center"
      onPressIn={() => {
        scale.value = withSpring(0.86, PRESS_SPRING);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, PRESS_SPRING);
      }}
      onPress={() => {
        // 웹에는 진동이 없다
        if (Platform.OS !== 'web') void Haptics.selectionAsync();
        onPress();
      }}
      hitSlop={{ top: 8, bottom: 4 }}
    >
      <Animated.View style={[{ alignItems: 'center', gap: 2 }, pressStyle]}>
        <Icon filled={isActive} className={color} />
        <Text className={`text-caption02 ${color}`}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const activeKey = getActiveKey(pathname);
  const activeIndex = TABS.findIndex((tab) => tab.key === activeKey);
  const ActiveIcon = TABS[activeIndex].Icon;
  const isFloating = FLOATING_PATHS.includes(pathname);
  const minimized = useTabBarMinimized();

  const bottomGap = tabBarBottomGap(insets.bottom);
  const slotHeight = TAB_BAR.pillHeight + bottomGap + 12;
  const [barWidth, setBarWidth] = React.useState(0);
  const pillWidth = Math.max(0, Math.min(barWidth - TAB_BAR.sideMargin * 2, TAB_BAR.maxWidth));
  const tabWidth = pillWidth / TABS.length;

  // 다른 탭으로 가면 그 화면은 맨 위에서 시작하니 탭바를 다시 펼친다
  React.useEffect(() => {
    setTabBarMinimized(false);
  }, [pathname]);

  const selection = useSharedValue(activeIndex);
  React.useEffect(() => {
    selection.value = withSpring(activeIndex, SELECT_SPRING);
  }, [activeIndex, selection]);

  // 아래로 스크롤하면 iOS 탭바처럼 왼쪽 아래의 작은 캡슐(지금 탭 아이콘)로 접힌다.
  // 크기만 탭바 안에서 바뀌어 화면 레이아웃은 다시 계산하지 않는다
  const pillStyle = useAnimatedStyle(() => {
    const progress = tabBarMinimizeProgress.value;
    return {
      left: interpolate(progress, [0, 1], [(barWidth - pillWidth) / 2, TAB_BAR.sideMargin]),
      width: interpolate(progress, [0, 1], [pillWidth, TAB_BAR.miniSize]),
      height: interpolate(progress, [0, 1], [TAB_BAR.pillHeight, TAB_BAR.miniSize]),
    };
  });
  const rowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tabBarMinimizeProgress.value, [0, 0.45], [1, 0], Extrapolation.CLAMP),
  }));
  const miniStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tabBarMinimizeProgress.value, [0.55, 1], [0, 1], Extrapolation.CLAMP),
  }));
  const selectionStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: selection.value * tabWidth }],
  }));

  function navigateTo(key: TabKey, href: (typeof TABS)[number]['href'], isActive: boolean) {
    // 로그인·가입 화면도 마이 탭으로 표시하지만 (auth) 그룹이라 마이페이지 스택에 없다.
    // 그 화면에서 마이를 누르면 dismissTo가 아니라 마이페이지로 이동해야 한다
    const isOnAuthScreen = key === 'my' && AUTH_PATHS.some((p) => pathname.startsWith(p));

    // 이미 열려있는 탭을 다시 누른 경우: navigate는 각 탭 내부의 중첩 스택까지는 정리하지
    // 않아서(예: 지도 탭이 즐겨찾기 상세까지, 마이 탭이 프로필 수정까지 깊이 들어간 상태)
    // 그 탭의 루트 화면이 새로 하나 더 push된 것처럼 보인다. dismissTo로 해당 탭의
    // 중첩 스택에 이미 떠 있는 루트 화면으로 곧장 돌아가야 자연스럽다.
    if (isActive && !isOnAuthScreen) {
      // 홈 탭은 웹에서 하위 라우트(/meal, /posts 등)가 dismissTo로 되돌아갈
      // 자기 자신의 스택 항목을 갖지 않는다(탭 전환이 push가 아니라 replace라서).
      // 그래서 dismissTo 대신 매번 새 타임스탬프를 params로 실어 navigate한다.
      // 모바일은 이 값이 바뀔 때마다 index.tsx가 ALL 화면으로 스크롤하고,
      // 웹은 '/'(ALL 페이지) 라우트로 이동한다.
      if (key === 'home') {
        router.navigate({ pathname: '/', params: { scrollToAll: String(Date.now()) } });
      } else {
        router.dismissTo(href);
      }
    } else {
      router.navigate(href);
    }
  }

  return (
    <View
      pointerEvents="box-none"
      onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
      style={[
        { height: slotHeight, width: '100%' },
        // 떠 있는 화면에서는 탭바가 자리를 차지하지 않아 뒤 내용이 그대로 비친다
        isFloating && { position: 'absolute', left: 0, right: 0, bottom: 0 },
      ]}
    >
      {barWidth > 0 && (
        <Animated.View
          style={[
            { position: 'absolute', bottom: bottomGap, borderRadius: TAB_BAR.pillHeight },
            PILL_SHADOW,
            pillStyle,
          ]}
        >
          <View
            ref={applyWebBackdropBlur}
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: TAB_BAR.pillHeight, overflow: 'hidden' },
              !USE_LIQUID_GLASS && FALLBACK_SURFACE,
            ]}
          >
            {USE_LIQUID_GLASS && (
              <GlassView style={StyleSheet.absoluteFill} glassEffectStyle="regular" isInteractive />
            )}

            {/* 펼친 탭바. 접히는 동안 폭은 그대로 두고 흐려지기만 해서 글자가 찌그러지지 않는다 */}
            <Animated.View
              pointerEvents={minimized ? 'none' : 'auto'}
              style={[
                {
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: pillWidth,
                  height: TAB_BAR.pillHeight,
                },
                rowStyle,
              ]}
            >
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    left: 4,
                    top: 5,
                    width: tabWidth - 8,
                    height: TAB_BAR.pillHeight - 10,
                    borderRadius: TAB_BAR.pillHeight,
                    backgroundColor: 'rgba(23, 120, 255, 0.1)',
                  },
                  selectionStyle,
                ]}
              />
              <View className="h-full flex-row">
                {TABS.map(({ key, label, Icon, href }) => (
                  <TabButton
                    key={key}
                    label={label}
                    Icon={Icon}
                    isActive={activeKey === key}
                    onPress={() => navigateTo(key, href, activeKey === key)}
                  />
                ))}
              </View>
            </Animated.View>

            {/* 접힌 캡슐. 누르면 다시 펼친다 */}
            <Animated.View
              pointerEvents={minimized ? 'auto' : 'none'}
              style={[StyleSheet.absoluteFill, miniStyle]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="탭바 펼치기"
                className="flex-1 items-center justify-center"
                onPress={() => setTabBarMinimized(false)}
              >
                <ActiveIcon filled className="text-blue-35" />
              </Pressable>
            </Animated.View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
