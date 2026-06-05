import { usePathname, useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExploreIcon, HomeIcon, MapIcon, ProfileIcon } from './icons/navigation';
import { Text } from './ui/text';

const TABS = [
  { key: 'home', label: '홈', Icon: HomeIcon, href: '/' },
  { key: 'map', label: '명지도', Icon: MapIcon, href: '/maps' },
  { key: 'category', label: '카테고리', Icon: ExploreIcon, href: '/category' },
  { key: 'my', label: '마이', Icon: ProfileIcon, href: '/profile' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const AUTH_PATHS = ['/login', '/signup', '/forgot-password'];

function getActiveKey(pathname: string): TabKey {
  if (pathname.startsWith('/maps')) return 'map';
  if (pathname.startsWith('/category')) return 'category';
  if (pathname.startsWith('/profile') || AUTH_PATHS.some((p) => pathname.startsWith(p)))
    return 'my';
  return 'home';
}

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const activeKey = getActiveKey(pathname);

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
            onPress={() => router.navigate(href)}
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
