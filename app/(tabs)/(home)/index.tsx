import { HamburgerIcon, SearchIcon, ThingoLogoSmall } from '@/components/icons';
import Sidebar from '@/components/sidebar';
import { Text } from '@/components/ui/text';
import { Link, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { Dimensions, Keyboard, ScrollView, TouchableOpacity, View } from 'react-native';
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

const { width } = Dimensions.get('window');
const TABS = ['ALL', '학식', '게시판', '공지사항', '학사일정', '명대신문', '명대뉴스'];

export default function Screen() {
  const { tab, boardCategory, refreshBoards } = useLocalSearchParams<{
    tab?: string | string[];
    boardCategory?: string | string[];
    refreshBoards?: string | string[];
  }>();

  const targetTab = Array.isArray(tab) ? tab[0] : tab;
  const targetBoardCategory = Array.isArray(boardCategory) ? boardCategory[0] : boardCategory;
  const boardRefreshKey = Array.isArray(refreshBoards) ? refreshBoards[0] : refreshBoards;

  const insets = useSafeAreaInsets();
  const scrollRef = React.useRef<ScrollView>(null);
  const [currentTab, setCurrentTab] = React.useState(TABS[0]);
  const [sidebarVisible, setSidebarVisible] = React.useState(false);

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
        <NoticeBoardScreen
          initialCategory={
            targetBoardCategory === 'free' || targetBoardCategory === 'info'
              ? targetBoardCategory
              : undefined
          }
          refreshKey={boardRefreshKey}
        />

        {/* 공지사항 */}
        <NoticeScreen />

        {/* 학사일정 */}
        <AcademicCalendarScreen />

        {/* 명대신문 */}
        <NewspaperScreen />

        {/* 명대뉴스 */}
        <NewsScreen />
      </ScrollView>
    </>
  );
}
