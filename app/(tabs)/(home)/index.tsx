import { NotificationIcon, SearchIcon, ThingoLogoSmall } from '@/components/icons';
import Sidebar from '@/components/sidebar';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/auth-context';
import { Link, router, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import * as React from 'react';
import { Dimensions, Keyboard, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NoticeBoardScreen } from './_components/notice-board-page';
import AllScreen from './_components/all-screen';
import NewsScreen from './_components/news-screen';
import MealScreen from './_components/meal-screen';
import NoticeScreen from './_components/notice-screen';
import AcademicCalendarScreen from './_components/academic-calendar-screen';
import NewspaperScreen from './_components/newspaper-screen';
import { Button } from '@/components/ui/button';
import { TabBar } from '@/components/ui/tab-bar';
import { useNotificationBadge } from '@/hooks/useNotificationBadge';

const { width } = Dimensions.get('window');
const TABS = ['ALL', '학식', '게시판', '공지사항', '학사일정', '명대신문', '명대뉴스'];
const TAB_PATHS = ['/', '/meal', '/posts', '/notices', '/academic-calendar', '/newspaper', '/news'];
const HOME_TITLE = '띵고 Thingo - 명지대학교 통합 정보 탐색 플랫폼';

export default function Screen() {
  const { tab, scrollToAll } = useLocalSearchParams<{
    tab?: string | string[];
    scrollToAll?: string | string[];
  }>();

  const targetTab = Array.isArray(tab) ? tab[0] : tab;

  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const scrollRef = React.useRef<ScrollView>(null);
  const [currentTab, setCurrentTab] = React.useState(TABS[0]);
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

  const handleTabPress = (index: number) => {
    setCurrentTab(TABS[index]);
    scrollRef.current?.scrollTo({ x: width * index, animated: true });
  };

  const handleScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    if (TABS[page]) setCurrentTab(TABS[page]);
  };

  React.useEffect(() => {
    if (targetTab !== 'board') return;

    const boardTabIndex = 2;
    setCurrentTab(TABS[boardTabIndex]);
    scrollRef.current?.scrollTo({ x: width * boardTabIndex, animated: false });
  }, [targetTab]);

  // 하단 네비게이션의 홈 탭을 다시 눌렀을 때 신호로 쓰는 값(매번 새 타임스탬프이므로
  // 이미 ALL 화면에 있어도 재클릭할 때마다 effect가 다시 실행된다)
  React.useEffect(() => {
    if (!scrollToAll) return;
    setCurrentTab(TABS[0]);
    scrollRef.current?.scrollTo({ x: 0, animated: true });
  }, [scrollToAll]);

  // web: 헤더·TabBar는 _layout.tsx 제공, AllScreen만 렌더링
  if (Platform.OS === 'web') {
    return (
      <>
        <Head>
          <title>{HOME_TITLE}</title>
          <meta property="og:title" content={HOME_TITLE} />
        </Head>
        <AllScreen onNavigate={(index) => router.replace(TAB_PATHS[index] as any)} />
      </>
    );
  }

  return (
    <>
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onNavigate={handleTabPress}
      />
      {/* 앱 헤더 */}
      <View style={{ paddingTop: insets.top }}>
        <View className="h-15 w-screen flex-row items-center px-3 pb-1 pt-2">
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
                <Text className="text-grey-40 text-body06">검색어를 입력하세요</Text>
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

      {/* 스와이프 페이지 */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        onScrollBeginDrag={Keyboard.dismiss}
        style={{ flex: 1 }}
      >
        {/* ALL */}
        <AllScreen onNavigate={handleTabPress} />

        {/* 학식 */}
        <MealScreen />

        {/* 게시판 */}
        <NoticeBoardScreen />

        {/* 공지사항 */}
        <NoticeScreen />

        {/* 학사일정 */}
        <AcademicCalendarScreen />

        {/* 명대신문 */}
        <NewspaperScreen />

        {/* 명대뉴스 */}
        <NewsScreen />
      </ScrollView>

      {/* 로그인 유도 dialog */}
      <Dialog open={notificationDialogVisible} onOpenChange={setNotificationDialogVisible}>
        <DialogContent className="w-80 items-center gap-4 p-5" showCloseButton={false}>
          <DialogTitle className="text-grey-80 text-body04">
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
