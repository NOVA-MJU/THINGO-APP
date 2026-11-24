import { setTabBarHidden, tabBarHiddenProgress } from '@/hooks/useTabBarScroll';
import { usePathname, useRouter } from 'expo-router';
import * as React from 'react';
import { Platform, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
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

// 둥근 캡슐 탭바의 높이와 위 여백. 숨길 때 이 칸 높이를 0까지 줄여 화면을 그만큼 넓힌다
const PILL_HEIGHT = 60;
const PILL_TOP_GAP = 6;

// 캡슐이 바탕 위에 떠 보이게 하는 그림자. 웹은 boxShadow, 안드로이드는 elevation만 먹는다
const PILL_SHADOW = Platform.select({
  web: { boxShadow: '0 4px 20px rgba(23, 23, 27, 0.08)' },
  android: { elevation: 6 },
  default: {
    shadowColor: '#17171b',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
});

function getActiveKey(pathname: string): TabKey {
  if (pathname.startsWith('/maps')) return 'map';
  if (pathname.startsWith('/categories')) return 'category';
  if (pathname.startsWith('/profile') || AUTH_PATHS.some((p) => pathname.startsWith(p)))
    return 'my';
  return 'home';
}

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const activeKey = getActiveKey(pathname);

  // 홈 아래 바(iPhone 홈 인디케이터) 위에 살짝 띄운다. 인디케이터가 없는 기기·웹은 12만큼 띄운다
  const bottomGap = Math.max(insets.bottom - 8, 12);
  const slotHeight = PILL_TOP_GAP + PILL_HEIGHT + bottomGap;

  // 다른 탭으로 가면 그 화면은 맨 위에서 시작하니 탭바를 다시 보여준다
  React.useEffect(() => {
    setTabBarHidden(false);
  }, [pathname]);

  const slotStyle = useAnimatedStyle(() => ({
    height: slotHeight * (1 - tabBarHiddenProgress.value),
  }));
  // 숨을 때는 아래로 내려가며 작아지고 흐려진다
  const pillStyle = useAnimatedStyle(() => ({
    opacity: 1 - tabBarHiddenProgress.value,
    transform: [
      { translateY: tabBarHiddenProgress.value * 24 },
      { scale: 1 - tabBarHiddenProgress.value * 0.15 },
    ],
  }));

  // Animated.View에는 className이 먹지 않아(웹에서 그대로 무시됨) 움직임만 맡기고 모양은 안쪽 View에 준다
  return (
    <Animated.View style={[{ width: '100%', overflow: 'hidden' }, slotStyle]}>
      <View className="flex-1 bg-grey-02">
        <Animated.View
          style={[
            {
              height: PILL_HEIGHT,
              marginTop: PILL_TOP_GAP,
              marginHorizontal: 16,
              borderRadius: PILL_HEIGHT / 2,
              backgroundColor: '#ffffff',
            },
            Platform.OS === 'web' && { width: '100%', maxWidth: 440, alignSelf: 'center' },
            PILL_SHADOW,
            pillStyle,
          ]}
        >
          <View className="flex-1 flex-row items-center rounded-full border border-grey-10">
            {TABS.map(({ key, label, Icon, href }) => {
              const isActive = activeKey === key;
              const color = isActive ? 'text-blue-35' : 'text-grey-20';
              return (
                <TouchableOpacity
                  key={key}
                  className="flex-1 items-center gap-0.5"
                  onPress={() => {
                    // 로그인·가입 화면도 마이 탭으로 표시하지만 (auth) 그룹이라 마이페이지 스택에 없다.
                    // 그 화면에서 마이를 누르면 dismissTo가 아니라 마이페이지로 이동해야 한다
                    const isOnAuthScreen =
                      key === 'my' && AUTH_PATHS.some((p) => pathname.startsWith(p));

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
                        router.navigate({
                          pathname: '/',
                          params: { scrollToAll: String(Date.now()) },
                        });
                      } else {
                        router.dismissTo(href);
                      }
                    } else {
                      router.navigate(href);
                    }
                  }}
                  hitSlop={{ top: 8, bottom: 4 }}
                >
                  <Icon filled={isActive} className={color} />
                  <Text className={`text-caption02 ${color}`}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}
