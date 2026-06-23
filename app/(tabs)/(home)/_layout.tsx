import { HamburgerIcon, SearchIcon, ThingoLogoSmall } from '@/components/icons';
import Sidebar from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { TabBar } from '@/components/ui/tab-bar';
import { Text } from '@/components/ui/text';
import { Link, Slot, Stack, router, usePathname } from 'expo-router';
import * as React from 'react';
import { Platform, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = ['ALL', '학식', '게시판', '공지사항', '학사일정', '명대신문', '명대뉴스'];
const TAB_PATHS = ['/', '/meal', '/posts', '/notices', '/academic-calendar', '/newspaper', '/news'];
const TAB_SLUGS = ['', 'meal', 'posts', 'notices', 'academic-calendar', 'newspaper', 'news'];

function WebHomeLayout() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [sidebarVisible, setSidebarVisible] = React.useState(false);

  const activeIndex = (() => {
    const slug = pathname.split('/').filter(Boolean).at(-1) ?? '';
    const idx = TAB_SLUGS.indexOf(slug);
    return idx === -1 ? 0 : idx;
  })();

  const currentTab = TABS[activeIndex] ?? TABS[0];

  const handleTabPress = (index: number) => {
    router.replace(TAB_PATHS[index] as any);
  };

  return (
    <>
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onNavigate={handleTabPress}
      />

      {/* 앱 헤더 */}
      <View style={{ paddingTop: insets.top }}>
        <View className="h-15 flex-row items-center px-3 pb-1 pt-2">
          <TouchableOpacity onPress={() => handleTabPress(0)}>
            <ThingoLogoSmall />
          </TouchableOpacity>
          <View className="flex-1 p-1.5">
            <Link href="/search" asChild>
              <TouchableOpacity className="flex-1 flex-row items-center gap-2 rounded-full bg-grey-02 px-3 py-1.5">
                <SearchIcon className="text-grey-30" />
                <Text className="text-body06 text-grey-40">검색어를 입력하세요</Text>
              </TouchableOpacity>
            </Link>
          </View>
          <Button className="h-fit p-1" variant="ghost" onPress={() => setSidebarVisible(true)}>
            <HamburgerIcon />
          </Button>
        </View>
      </View>

      {/* 탭 네비게이션 */}
      <TabBar tabs={TABS} currentTab={currentTab} onTabPress={handleTabPress} />

      {/* 컨텐츠 */}
      <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
    </>
  );
}

export default function HomeLayout() {
  if (Platform.OS !== 'web') {
    return <Slot />;
  }
  return <WebHomeLayout />;
}
