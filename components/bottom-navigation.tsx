import { useAuth } from '@/context/auth-context';
import { usePathname, useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
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
  const { user } = useAuth();

  return (
    <View
      className="w-full flex-row border-t border-grey-02 bg-white pt-[14px]"
      style={{ paddingBottom: insets.bottom || 20 }}
    >
      {TABS.map(({ key, label, Icon, href }) => {
        const isActive = activeKey === key;
        const color = isActive ? 'text-blue-35' : 'text-grey-20';
        return (
          <TouchableOpacity
            key={key}
            className="flex-1 items-center gap-0.5"
            onPress={() => {
              // '마이' 탭은 로그인 여부에 따라 목적지가 갈린다(비로그인 시 profile이 아니라
              // (auth) 그룹의 login으로 이동) — profile/(auth) 둘 다 자체 중첩 Stack이 있어
              // 아래 dismissTo 분기 대상이 될 수 있으므로 href 대신 이 target을 써야 한다.
              const target = key === 'my' ? (user ? '/profile' : '/login') : href;

              // 이미 열려있는 탭을 다시 누른 경우: navigate는 각 탭 내부의 중첩 스택까지는 정리하지
              // 않아서(예: 지도 탭이 즐겨찾기 상세까지, 마이 탭이 프로필 수정까지 깊이 들어간 상태)
              // 그 탭의 루트 화면이 새로 하나 더 push된 것처럼 보인다. dismissTo로 해당 탭의
              // 중첩 스택에 이미 떠 있는 루트 화면으로 곧장 돌아가야 자연스럽다.
              if (isActive) {
                // 홈 탭은 웹에서 하위 라우트(/meal, /posts 등)가 dismissTo로 되돌아갈
                // 자기 자신의 스택 항목을 갖지 않는다(탭 전환이 push가 아니라 replace라서).
                // 그래서 dismissTo 대신 매번 새 타임스탬프를 params로 실어 navigate한다.
                // 모바일은 이 값이 바뀔 때마다 index.tsx가 ALL 화면으로 스크롤하고,
                // 웹은 '/'(ALL 페이지) 라우트로 이동한다.
                if (key === 'home') {
                  router.navigate({ pathname: '/', params: { scrollToAll: String(Date.now()) } });
                } else {
                  router.dismissTo(target);
                }
              } else {
                router.navigate(target);
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
  );
}
