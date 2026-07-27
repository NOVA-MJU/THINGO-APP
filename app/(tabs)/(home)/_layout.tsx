import { NotificationIcon, SearchIcon, ThingoLogoSmall } from '@/components/icons';
import Sidebar from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { TabBar } from '@/components/ui/tab-bar';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/auth-context';
import { useNotificationBadge } from '@/hooks/useNotificationBadge';
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
  const { user } = useAuth();
  const [sidebarVisible, setSidebarVisible] = React.useState(false);
  const [notificationDialogVisible, setNotificationDialogVisible] = React.useState(false);
  const hasUnreadNotification = useNotificationBadge();

  // 헤더 알림 버튼 클릭
  const handleNotificationPress = () => {
    if (!user) {
      setNotificationDialogVisible(true);
    } else {
      router.push('/notifications');
    }
  };

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
          <TouchableOpacity
            onPress={() => handleTabPress(0)}
            accessibilityRole="button"
            accessibilityLabel="ALL 탭으로 이동"
          >
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
          <TouchableOpacity
            className="h-fit p-1"
            onPress={handleNotificationPress}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="알림"
          >
            <NotificationIcon className="text-grey-80" showBadge={hasUnreadNotification} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 탭 네비게이션 */}
      <TabBar tabs={TABS} currentTab={currentTab} onTabPress={handleTabPress} />

      {/* 컨텐츠 */}
      <Stack screenOptions={{ headerShown: false, animation: 'none' }} />

      {/* 로그인 유도 dialog */}
      <Dialog open={notificationDialogVisible} onOpenChange={setNotificationDialogVisible}>
        <DialogContent className="w-80 items-center gap-4 p-5" showCloseButton={false}>
          <DialogTitle className="text-body04 text-grey-80">
            로그인이 필요한 서비스입니다.
          </DialogTitle>
          <View className="w-full flex-row items-center gap-2">
            <Button
              className="flex-1 py-[7.5px]"
              variant="outline"
              onPress={() => setNotificationDialogVisible(false)}
            >
              <Text>취소</Text>
            </Button>
            <Button
              className="flex-1 py-[7.5px]"
              onPress={() => {
                setNotificationDialogVisible(false);
                router.push('/login');
              }}
            >
              <Text>로그인</Text>
            </Button>
          </View>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function HomeLayout() {
  if (Platform.OS !== 'web') {
    return <Slot />;
  }
  return <WebHomeLayout />;
}
