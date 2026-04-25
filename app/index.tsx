import { HamburgerIcon, SearchIcon, ThingoLogoSmall } from '@/components/icons';
import { Text } from '@/components/ui/text';
import * as React from 'react';
import { Dimensions, Keyboard, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Page1 } from './_components/Page1';
import { Page2 } from './_components/Page2';
import { Page3 } from './_components/Page3';
import MealSection from './_components/meal';
import { Page4 } from './_components/Page4';
import { NoticePage } from './_components/notice-page';
import { Page6 } from './_components/Page6';
import { Page7 } from './_components/Page7';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import clsx from 'clsx';

const { width } = Dimensions.get('window');
const TABS = ['ALL', '학식', '게시판', '명지도', '공지사항', '학사일정', '명대신문', '명대뉴스'];
const INITIAL_PAGE = 0;

export default function Screen() {
  const insets = useSafeAreaInsets();
  const scrollRef = React.useRef<ScrollView>(null);
  const [currentTab, setCurrentTab] = React.useState(TABS[INITIAL_PAGE]);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ x: width * INITIAL_PAGE, animated: false });
  }, []);

  const handleTabPress = (index: number) => {
    Keyboard.dismiss();
    setCurrentTab(TABS[index]);
    scrollRef.current?.scrollTo({ x: width * index, animated: true });
  };

  const handleScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    if (TABS[page]) setCurrentTab(TABS[page]);
  };

  return (
    <>
      {/* 앱 헤더 */}
      <View style={{ paddingTop: insets.top }}>
        <View className="h-15 w-screen flex-row items-center px-3 pb-1 pt-2">
          <ThingoLogoSmall />
          <View className="flex-1 p-1.5">
            <View className="bg-grey-02 flex-1 flex-row items-center rounded-full px-3 py-1.5">
              <SearchIcon className="text-grey-30" />
              <Input
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="검색어를 입력하세요"
                className="text-grey-80 text-body06 flex-1 border-0 bg-transparent p-0 shadow-none"
              />
            </View>
          </View>
          <Button className="h-fit p-1" variant="ghost">
            <HamburgerIcon />
          </Button>
        </View>
      </View>

      {/* 탭 네비게이션 */}
      <View className="border-grey-20 border-b">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}>
          {TABS.map((label, index) => (
            <Button
              key={label}
              variant="ghost"
              className={clsx(
                'rounded-none px-5 pb-2 pt-2.5',
                currentTab === label && 'border-mju-primary border-b-2'
              )}
              onPress={() => handleTabPress(index)}>
              <Text
                className={`${currentTab === label ? 'text-body04 text-mju-primary' : 'text-body06 text-grey-40'}`}>
                {label}
              </Text>
            </Button>
          ))}
        </ScrollView>
      </View>

      {/* 스와이프 페이지 */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        onScrollBeginDrag={Keyboard.dismiss}
        style={{ flex: 1 }}>
        <Page2 />
        <MealSection />
        <Page1 />
        <Page4 />
        <NoticePage />
        <Page6 />
        <Page7 />
        <Page3 />
      </ScrollView>
    </>
  );
}
