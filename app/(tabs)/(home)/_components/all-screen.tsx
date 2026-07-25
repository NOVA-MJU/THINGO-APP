import { Text } from '@/components/ui/text';
import { openLink, openLinkOrNavigate } from '@/lib/open-link';
import * as React from 'react';
import { Link } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { YoutubeEmbed } from '@/components/youtube-embed';
import { CategoryFilter } from '@/components/ui/category-filter';
import { Footer } from '@/components/footer';
import {
  getNotices,
  getHotNotices,
  type Notice,
  type NoticeCategory,
  type HotNotice,
} from '@/api/notices';
import { getBoards, getHotBoards, type Board } from '@/api/posts';
import { Skeleton } from '@/components/ui/skeleton';
import { getNews, type NewsItem, type NewsCategory } from '@/api/news';
import { getBanners, type Banner } from '@/api/banners';
import { getBroadcasts, type BroadcastItem, type BroadcastSource } from '@/api/broadcast';
import { getMenus, type DailyMenu } from '@/api/menus';
import {
  getCalendar,
  getCalendarDdays,
  type CalendarDday,
  type CalendarEvent,
} from '@/api/calendar';
import { formatTimeAgo } from '@/lib/utils';
import {
  MyeongjiMapIcon,
  DiningIcon,
  CalendarIcon,
  MegaphoneIcon,
  ChatIcon,
  FireIcon,
  StarIcon,
} from '@/components/icons/home';
import { ArrowRightIcon, ChatBubbleIcon, HeartIcon } from '@/components/icons';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';

const NOTICE_CATEGORIES: { label: string; value: NoticeCategory }[] = [
  { label: '전체', value: 'all' },
  { label: '일반', value: 'general' },
  { label: '학사', value: 'academic' },
  { label: '장학', value: 'scholarship' },
  { label: '진로', value: 'career' },
  { label: '학생활동', value: 'activity' },
  { label: '학칙개정', value: 'rule' },
];

const CATEGORY_MAP: Record<string, NoticeCategory> = Object.fromEntries(
  NOTICE_CATEGORIES.map((c) => [c.label, c.value])
);

type Props = {
  onNavigate: (tabIndex: number) => void;
};

const NEWSPAPER_CATEGORY_MAP: Record<string, NewsCategory> = {
  전체: null,
  보도: 'REPORT',
  사회: 'SOCIETY',
};

const BROADCAST_SOURCE_MAP: Record<string, BroadcastSource> = {
  전체: 'ALL',
  명지대학교: 'OFFICIAL',
  명대방송국: 'BROADCAST',
};

const BOARD_CATEGORY_LABELS: Record<string, string> = {
  FREE: '자유게시판',
  NOTICE: '공지게시판',
};

const CAROUSEL_PEEK = 12;
const CAROUSEL_GAP = 10;
const DDAYS_LIMIT = 3;

function formatDdayValue(value: number): string {
  return value === 0 ? 'D-DAY' : `D-${value}`;
}

export default function AllScreen({ onNavigate }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = React.useState(screenWidth);
  const cardSlot = containerWidth - (CAROUSEL_PEEK + CAROUSEL_GAP / 2) * 2;
  const carouselOffset = (containerWidth - cardSlot) / 2;

  const [banners, setBanners] = React.useState<Banner[]>([]);
  const [bannersLoading, setBannersLoading] = React.useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = React.useState(0);
  const isBannerDraggingRef = React.useRef(false);
  const [selectedNoticeCategory, setSelectedNoticeCategory] = React.useState('전체');
  const [selectedNewspaperCategory, setSelectedNewspaperCategory] = React.useState('전체');
  const [selectedBroadcastSource, setSelectedBroadcastSource] = React.useState('전체');
  const [notices, setNotices] = React.useState<Notice[]>([]);
  const [noticesLoading, setNoticesLoading] = React.useState(false);
  const [hotNotices, setHotNotices] = React.useState<HotNotice[]>([]);
  const [hotNoticesLoading, setHotNoticesLoading] = React.useState(false);
  const [hotBoards, setHotBoards] = React.useState<Board[]>([]);
  const [hotBoardsLoading, setHotBoardsLoading] = React.useState(false);
  const [boards, setBoards] = React.useState<Board[]>([]);
  const [boardsLoading, setBoardsLoading] = React.useState(false);
  const [newspaper, setNewspaper] = React.useState<NewsItem[]>([]);
  const [newspaperLoading, setNewspaperLoading] = React.useState(false);
  const [broadcasts, setBroadcasts] = React.useState<BroadcastItem[]>([]);
  const [broadcastsLoading, setBroadcastsLoading] = React.useState(false);
  const [menus, setMenus] = React.useState<DailyMenu[]>([]);
  const [calendarDdays, setCalendarDdays] = React.useState<CalendarDday[]>([]);
  const [calendarDdaysLoading, setCalendarDdaysLoading] = React.useState(false);
  const [todayEvents, setTodayEvents] = React.useState<
    { dateLabel: string; description: string }[]
  >([]);

  React.useEffect(() => {
    setBannersLoading(true);
    getBanners()
      .then((data) => setBanners(data))
      .catch(() => setBanners([]))
      .finally(() => setBannersLoading(false));
  }, []);

  React.useEffect(() => {
    setNoticesLoading(true);
    getNotices({ category: CATEGORY_MAP[selectedNoticeCategory], size: 5 })
      .then((res) => setNotices(res.content))
      .catch(() => setNotices([]))
      .finally(() => setNoticesLoading(false));
  }, [selectedNoticeCategory]);

  React.useEffect(() => {
    setNewspaperLoading(true);
    getNews({ category: NEWSPAPER_CATEGORY_MAP[selectedNewspaperCategory], size: 4 })
      .then((res) => setNewspaper(res.content))
      .catch(() => setNewspaper([]))
      .finally(() => setNewspaperLoading(false));
  }, [selectedNewspaperCategory]);

  React.useEffect(() => {
    setBroadcastsLoading(true);
    getBroadcasts({ source: BROADCAST_SOURCE_MAP[selectedBroadcastSource], size: 5 })
      .then((res) => setBroadcasts(res.content))
      .catch(() => setBroadcasts([]))
      .finally(() => setBroadcastsLoading(false));
  }, [selectedBroadcastSource]);

  React.useEffect(() => {
    getMenus()
      .then((res) => setMenus(res.data))
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    setCalendarDdaysLoading(true);
    getCalendarDdays(DDAYS_LIMIT)
      .then(setCalendarDdays)
      .catch(() => setCalendarDdays([]))
      .finally(() => setCalendarDdaysLoading(false));
  }, []);

  React.useEffect(() => {
    setHotNoticesLoading(true);
    getHotNotices({ size: 6 })
      .then((data) => setHotNotices(data))
      .catch(() => setHotNotices([]))
      .finally(() => setHotNoticesLoading(false));
  }, []);

  React.useEffect(() => {
    setBoardsLoading(true);
    getBoards({ size: 5 })
      .then((res) => setBoards(res.boards))
      .catch(() => setBoards([]))
      .finally(() => setBoardsLoading(false));
  }, []);

  React.useEffect(() => {
    setHotBoardsLoading(true);
    getHotBoards({ size: 2 })
      .then((data) => setHotBoards(data))
      .catch(() => setHotBoards([]))
      .finally(() => setHotBoardsLoading(false));
  }, []);

  React.useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const inRange = (e: CalendarEvent) => e.startDate <= dateStr && dateStr <= e.endDate;
    const toItem = (e: CalendarEvent) => {
      const fmt = (d: string) => d.slice(5).replace('-', '.');
      const dateLabel =
        e.startDate === e.endDate ? fmt(e.startDate) : `${fmt(e.startDate)} - ${fmt(e.endDate)}`;
      return { dateLabel, description: e.description };
    };
    getCalendar(y, m)
      .then((data) => {
        setTodayEvents([
          ...data.all.filter(inRange).map(toItem),
          ...data.undergrad.filter(inRange).map(toItem),
          ...data.graduate.filter(inRange).map(toItem),
          ...data.holiday.filter(inRange).map(toItem),
        ]);
      })
      .catch(() => {});
  }, []);

  // 현재 시각 기준으로 조식(~09:00) / 중식(~14:00) / 석식(14:00~) 결정 및 오늘 날짜 레이블 생성
  const { currentMealLabel, currentMealTimeRange, currentMealCategory } = React.useMemo(() => {
    const now = new Date();
    const hour = now.getHours() * 60 + now.getMinutes();
    let label: string;
    let timeRange: string;
    let category: 'BREAKFAST' | 'LUNCH' | 'DINNER';
    if (hour < 9 * 60) {
      label = '조식';
      timeRange = '(08:00 - 09:00)';
      category = 'BREAKFAST';
    } else if (hour < 14 * 60) {
      label = '중식';
      timeRange = '(11:30 - 14:00)';
      category = 'LUNCH';
    } else {
      label = '석식';
      timeRange = '(17:00 - 18:30)';
      category = 'DINNER';
    }
    return {
      currentMealLabel: label,
      currentMealTimeRange: timeRange,
      currentMealCategory: category,
    };
  }, []);

  const todayLabel = React.useMemo(() => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const day = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()];
    return `${mm}.${dd} (${day})`;
  }, []);

  // menus 배열에서 오늘 날짜 + 현재 식사 카테고리에 해당하는 메뉴 항목 추출
  const todayMeals = React.useMemo(() => {
    const mm = String(new Date().getMonth() + 1).padStart(2, '0');
    const dd = String(new Date().getDate()).padStart(2, '0');
    const dotDate = `${mm}.${dd}`;
    return (
      menus.find((m) => m.date.startsWith(dotDate) && m.menuCategory === currentMealCategory)
        ?.meals ?? []
    );
  }, [menus, currentMealCategory]);

  // 배너 링크가 홈 탭(다른 스와이프 화면)을 가리키는 경우, 모바일에서는 router로 이동하면
  // 헤더·탭바가 없는 화면이 렌더링되므로 onNavigate로 스와이프 전환하고, 웹은 실제 URL이 있어 그대로 이동
  function handleBannerPress(linkUrl: string) {
    // 웹에서 캐러셀 드래그 종료 시 클릭 이벤트도 함께 발생하는 문제 방지
    if (isBannerDraggingRef.current) return;

    if (Platform.OS !== 'web') {
      if (linkUrl === '/') {
        onNavigate(0);
        return;
      }
      if (linkUrl.startsWith('/meal')) {
        onNavigate(1);
        return;
      }
      if (linkUrl.startsWith('/posts')) {
        onNavigate(2);
        return;
      }
      if (linkUrl.startsWith('/notices')) {
        onNavigate(3);
        return;
      }
      if (linkUrl.startsWith('/academic-calendar')) {
        onNavigate(4);
        return;
      }
      if (linkUrl.startsWith('/newspaper')) {
        onNavigate(5);
        return;
      }
      if (linkUrl.startsWith('/news')) {
        onNavigate(6);
        return;
      }
    }
    openLinkOrNavigate(linkUrl);
  }

  return (
    <ScrollView className="native:w-screen flex-1 web:w-full">
      <View className="min-h-screen bg-grey-02">
        <View className="bg-white py-5">
          {(bannersLoading || banners.length > 0) && (
            <View className="items-center">
              {/* 배너 */}
              <View
                onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
                style={{ width: Platform.OS === 'web' ? '100%' : screenWidth, overflow: 'hidden' }}
              >
                <View style={{ marginLeft: carouselOffset }}>
                  {bannersLoading ? (
                    <Skeleton style={{ width: cardSlot, height: 200, borderRadius: 16 }} />
                  ) : (
                    <Carousel
                      width={cardSlot}
                      height={200}
                      style={{ overflow: 'visible' }}
                      data={banners}
                      loop
                      autoPlay
                      autoPlayInterval={3000}
                      onSnapToItem={setCurrentBannerIndex}
                      onScrollStart={() => {
                        isBannerDraggingRef.current = true;
                      }}
                      onScrollEnd={() => {
                        // 클릭 이벤트가 스크롤 종료 직후 발생하므로 약간의 지연 후 해제
                        setTimeout(() => {
                          isBannerDraggingRef.current = false;
                        }, 50);
                      }}
                      renderItem={({ item, index }: { item: Banner; index: number }) => (
                        <TouchableOpacity
                          onPress={() => handleBannerPress(item.linkUrl)}
                          activeOpacity={1}
                          accessibilityRole="button"
                          accessibilityLabel={item.title}
                          style={{
                            flex: 1,
                            marginHorizontal: CAROUSEL_GAP / 2,
                            borderRadius: 16,
                            overflow: 'hidden',
                          }}
                        >
                          <Image
                            source={{ uri: item.imageUrl }}
                            className="absolute bottom-0 left-0 right-0 top-0 z-0"
                            resizeMode="cover"
                          />

                          <View
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              zIndex: 10,
                            }}
                          >
                            <Svg width="100%" height="100%">
                              <Defs>
                                <SvgLinearGradient id="hotGrad" x1="0" y1="0" x2="0" y2="1">
                                  <Stop offset="0" stopColor="#000000" stopOpacity="0" />
                                  <Stop offset="1" stopColor="#000000" stopOpacity="0.5" />
                                </SvgLinearGradient>
                              </Defs>
                              <Rect width="100%" height="100%" fill="url(#hotGrad)" />
                            </Svg>
                          </View>

                          <View className="absolute bottom-0 left-0 right-0 top-0 z-20 justify-between p-4">
                            <View className="self-end rounded-full bg-bg px-2 py-0.5">
                              <Text className="text-caption02 text-white">
                                {index + 1}/{banners.length}
                              </Text>
                            </View>
                            <View className="p-2">
                              <View className="self-start rounded-md bg-blue-05 px-1 py-0.5">
                                <Text className="text-caption01 text-blue-35">{item.category}</Text>
                              </View>
                              {/* TODO: 텍스트 스타일 적용해야함 */}
                              <Text
                                className="mt-3 text-[20px] font-bold text-white"
                                numberOfLines={2}
                              >
                                {item.title}
                              </Text>
                              <Text className="mt-0.5 text-body04 text-blue-05" numberOfLines={1}>
                                {item.oneLineIntro}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      )}
                    />
                  )}
                </View>
              </View>
              {/* 배너 인디케이터 */}
              {!bannersLoading && (
                <View className="mt-2 flex-row items-center gap-2">
                  {banners.map((_, i) => (
                    <View
                      key={i}
                      className={`h-1 w-1 rounded-full ${i === currentBannerIndex ? 'bg-blue-20' : 'bg-grey-20'}`}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          <View className="mt-3 flex-row gap-4 px-4">
            {/* 퀵 메뉴 */}
            <View className="flex-[4] gap-2">
              <View className="flex-1 flex-row gap-2">
                <Link href="/maps" asChild>
                  <TouchableOpacity className="flex-1 rounded-xl bg-blue-02 pb-0.5 pe-1.5 ps-2.5 pt-2">
                    <Text className="text-body05 text-black">명지도</Text>
                    <View className="flex-1 items-end justify-end">
                      <MyeongjiMapIcon />
                    </View>
                  </TouchableOpacity>
                </Link>
                <TouchableOpacity
                  className="flex-1 rounded-xl bg-blue-02 pb-0.5 pe-1.5 ps-2.5 pt-2"
                  onPress={() => onNavigate(1)}
                >
                  <Text className="text-body05 text-black">학식</Text>
                  <View className="flex-1 items-end justify-end">
                    <DiningIcon />
                  </View>
                </TouchableOpacity>
              </View>
              <View className="flex-1 flex-row gap-2">
                <TouchableOpacity className="flex-1 gap-1" onPress={() => onNavigate(4)}>
                  <View className="items-center rounded-xl bg-blue-02 p-2">
                    <CalendarIcon />
                  </View>
                  <Text className="text-center text-body05 text-black">학사일정</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 gap-1" onPress={() => onNavigate(3)}>
                  <View className="items-center rounded-xl bg-blue-02 p-2">
                    <MegaphoneIcon />
                  </View>
                  <Text className="text-center text-body05 text-black">공지사항</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 gap-1" onPress={() => onNavigate(2)}>
                  <View className="items-center rounded-xl bg-blue-02 p-2">
                    <ChatIcon />
                  </View>
                  <Text className="text-center text-body05 text-black">게시판</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 학사일정 */}
            <View className="flex-[3] gap-2 rounded-xl bg-blue-02 px-3.5 py-3">
              {calendarDdaysLoading ? (
                Array.from({ length: DDAYS_LIMIT }).map((_, index) => (
                  <View key={index} className="flex-1 gap-1">
                    <Skeleton className="h-3 w-8 rounded" />
                    <Skeleton className="h-4 w-full rounded" />
                  </View>
                ))
              ) : calendarDdays.length > 0 ? (
                calendarDdays.map((item, index) => (
                  <View key={index} className="flex-1 gap-1">
                    <Text className="text-caption03 text-blue-15" numberOfLines={1}>
                      {formatDdayValue(item.ddayValue)}
                    </Text>
                    <Text className="text-caption02 text-grey-80" numberOfLines={1}>
                      {item.eventName}
                    </Text>
                  </View>
                ))
              ) : (
                <View className="flex-1 justify-center">
                  <Text className="text-caption02 text-grey-40">예정된 학사일정이 없습니다.</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* 학식 */}
        <TouchableOpacity
          onPress={() => onNavigate(1)}
          className="mx-4 mt-6 gap-2.5 rounded-xl bg-white px-4 py-5"
        >
          <View className="flex-row items-center gap-2">
            <Text className="text-body02 text-black">{currentMealLabel}</Text>
            <Text className="text-caption02 text-grey-60">{currentMealTimeRange}</Text>
          </View>
          <View className="flex-row flex-wrap gap-1.5">
            {todayMeals.length > 0 ? (
              todayMeals.map((meal) => (
                <View key={meal} className="rounded-[6px] bg-grey-02 px-1 py-0.5">
                  <Text className="text-body05 text-grey-80">{meal}</Text>
                </View>
              ))
            ) : (
              <Text className="text-body05 text-grey-40">식단 정보가 없습니다.</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* HOT 공지사항 */}
        <View className="mt-8 flex-row items-center gap-1 px-4">
          <FireIcon />
          <Text className="text-title03 text-black">HOT 공지사항</Text>
        </View>
        <Text className="px-4 text-caption02 text-grey-60">최근 일주일간 가장 많은 조회 수</Text>
        <View className="mx-4 mt-3 rounded-xl bg-white py-1">
          {hotNoticesLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <View key={i} className="flex-row items-center gap-1 px-4 py-3">
                  <Skeleton className="h-4 w-10 rounded" />
                  <Skeleton className="h-4 flex-1 rounded" />
                  <Skeleton className="h-4 w-10 rounded" />
                </View>
              ))
            : hotNotices.map((item, index) => {
                const d = new Date(item.date);
                const dateLabel = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
                return (
                  <TouchableOpacity
                    key={index}
                    className="flex-row items-center gap-1 px-4 py-3"
                    onPress={() => openLink(item.link)}
                  >
                    <Text className="text-body04 text-black" numberOfLines={1}>
                      {NOTICE_CATEGORIES.find((c) => c.value === item.category)?.label ??
                        item.category}
                    </Text>
                    <Text className="flex-1 text-body05 text-black" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="text-caption04 text-grey-30">{dateLabel}</Text>
                  </TouchableOpacity>
                );
              })}
        </View>

        {/* HOT 게시판 */}
        <View className="mt-8 flex-row items-center gap-1 px-4">
          <StarIcon />
          <Text className="text-title03 text-black">HOT 게시판</Text>
        </View>
        <Text className="px-4 text-caption02 text-grey-60">모두가 가장 보고 싶은 글</Text>
        <View className="mx-4 mt-3 rounded-xl bg-white py-1">
          {hotBoardsLoading
            ? Array.from({ length: 2 }).map((_, i) => (
                <View key={i} className="gap-2 px-4 pb-2 pt-3">
                  <View className="flex-row gap-1">
                    <Skeleton className="h-4 w-16 rounded" />
                    <Skeleton className="h-4 flex-1 rounded" />
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Skeleton className="h-3 w-10 rounded" />
                    <Skeleton className="h-3 w-12 rounded" />
                    <Skeleton className="h-3 w-12 rounded" />
                  </View>
                </View>
              ))
            : hotBoards.map((item, index) => {
                const d = new Date(item.createdAt);
                const dateLabel = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
                return (
                  <Link key={index} href={`/posts/${item.uuid}`} asChild>
                    <TouchableOpacity className="gap-2 px-4 pb-2 pt-3">
                      <View className="flex-row gap-1">
                        <Text className="text-body04 text-black" numberOfLines={1}>
                          {BOARD_CATEGORY_LABELS[item.communityCategory ?? ''] ??
                            item.communityCategory}
                        </Text>
                        <Text className="flex-1 text-body05 text-black" numberOfLines={1}>
                          {item.title}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Text className="flex-1 text-caption04 text-grey-30">{dateLabel}</Text>
                        <HeartIcon className="text-blue-10" />
                        <Text className="ms-1 text-caption02 text-grey-40">{item.likeCount}</Text>
                        <ChatBubbleIcon className="ms-2 text-blue-10" />
                        <Text className="ms-1 text-caption02 text-grey-40">
                          {item.commentCount}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </Link>
                );
              })}
        </View>

        {/* 공지사항 */}
        <View className="mt-8">
          <View className="flex-row items-center justify-between">
            <Text className="ms-4 text-title03 text-black">공지사항</Text>
            <TouchableOpacity
              onPress={() => onNavigate(3)}
              className="me-3.5"
              accessibilityRole="button"
              accessibilityLabel="공지사항 더보기"
            >
              <ArrowRightIcon size={20} className="text-grey-60" />
            </TouchableOpacity>
          </View>
          <View className="mt-3">
            <CategoryFilter
              categories={Object.keys(CATEGORY_MAP)}
              selected={selectedNoticeCategory}
              onSelect={setSelectedNoticeCategory}
              paddingHorizontal={16}
              nestedScrollEnabled
            />
          </View>
          <View className="relative mx-4 mt-2 rounded-xl bg-white py-1">
            {notices.map((item, index) => (
              <TouchableOpacity
                key={index}
                className="flex-row items-center gap-1 px-4 py-3"
                onPress={() => openLink(item.link)}
              >
                <Text className="text-body04 text-black" numberOfLines={1}>
                  {NOTICE_CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category}
                </Text>
                <Text className="flex-1 text-body05 text-black" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="text-caption04 text-grey-30" numberOfLines={1}>
                  {formatTimeAgo(item.date)}
                </Text>
              </TouchableOpacity>
            ))}
            {noticesLoading && (
              <View className="absolute inset-0 items-center justify-center">
                <ActivityIndicator />
              </View>
            )}
          </View>
        </View>

        {/* 학사일정 */}
        <View className="mt-8">
          <View className="flex-row items-center justify-between">
            <Text className="ms-4 text-title03 text-black">학사일정</Text>
            <TouchableOpacity
              onPress={() => onNavigate(4)}
              className="me-3.5"
              accessibilityRole="button"
              accessibilityLabel="학사일정 더보기"
            >
              <ArrowRightIcon size={20} className="text-grey-60" />
            </TouchableOpacity>
          </View>
          <View className="mx-4 mt-3 rounded-xl bg-white">
            <Text className="border-b border-grey-02 px-4 pb-1 pt-2 text-body02 text-mju-primary">
              {todayLabel}
            </Text>
            <View>
              {todayEvents.length === 0 ? (
                <Text className="px-5 py-2 text-caption02 text-grey-30">오늘 일정이 없습니다.</Text>
              ) : (
                todayEvents.map((item, index) => (
                  <View key={index} className="flex-row items-start gap-2 px-4 py-3">
                    <Text className="w-[80px] text-caption02 text-grey-40">{item.dateLabel}</Text>
                    <Text className="flex-1 text-caption02 text-black" numberOfLines={2}>
                      {item.description}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        {/* 게시판 */}
        <View className="mt-8">
          <View className="flex-row items-center justify-between">
            <Text className="ms-4 text-title03 text-black">게시판</Text>
            <TouchableOpacity
              onPress={() => onNavigate(2)}
              className="me-3.5"
              accessibilityRole="button"
              accessibilityLabel="게시판 더보기"
            >
              <ArrowRightIcon size={20} className="text-grey-60" />
            </TouchableOpacity>
          </View>
          <View className="mx-4 mt-3 rounded-xl bg-white py-1">
            {boardsLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <View key={i} className="gap-2 px-4 pb-2 pt-3">
                    <View className="flex-row gap-1">
                      <Skeleton className="h-4 w-16 rounded" />
                      <Skeleton className="h-4 flex-1 rounded" />
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Skeleton className="h-3 w-10 rounded" />
                      <Skeleton className="h-3 w-12 rounded" />
                      <Skeleton className="h-3 w-12 rounded" />
                    </View>
                  </View>
                ))
              : boards.map((item) => {
                  const d = new Date(item.createdAt);
                  const dateLabel = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
                  return (
                    <Link key={item.uuid} href={`/posts/${item.uuid}`} asChild>
                      <TouchableOpacity className="gap-2 px-4 pb-2 pt-3">
                        <View className="flex-row gap-1">
                          <Text className="text-body04 text-black">
                            {BOARD_CATEGORY_LABELS[item.communityCategory ?? ''] ??
                              item.communityCategory}
                          </Text>
                          <Text className="flex-1 text-body05 text-black" numberOfLines={1}>
                            {item.title}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Text className="flex-1 text-caption04 text-grey-30">{dateLabel}</Text>
                          <HeartIcon className="ms-3 text-blue-10" />
                          <Text className="ms-1 text-caption02 text-grey-40">{item.likeCount}</Text>
                          <ChatBubbleIcon className="ms-2 text-blue-10" />
                          <Text className="ms-1 text-caption02 text-grey-40">
                            {item.commentCount}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </Link>
                  );
                })}
          </View>
        </View>

        {/* 명대신문 */}
        <View className="mt-8">
          <View className="flex-row items-center justify-between">
            <Text className="ms-4 text-title03 text-black">명대신문</Text>
            <TouchableOpacity
              onPress={() => onNavigate(5)}
              className="me-3.5"
              accessibilityRole="button"
              accessibilityLabel="명대신문 더보기"
            >
              <ArrowRightIcon size={20} className="text-grey-60" />
            </TouchableOpacity>
          </View>
          <View className="mt-3">
            <CategoryFilter
              categories={Object.keys(NEWSPAPER_CATEGORY_MAP)}
              selected={selectedNewspaperCategory}
              onSelect={setSelectedNewspaperCategory}
              paddingHorizontal={16}
            />
          </View>
          <View className="relative mx-4 mt-2 gap-2">
            {newspaper.map((item, index) => (
              <TouchableOpacity
                key={index}
                className="flex-row items-center gap-4 rounded-xl bg-white p-4"
                onPress={() => openLink(item.link)}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={{ width: 110, height: 110 }}
                  className="rounded border border-grey-10 bg-white"
                />
                <View className="flex-1">
                  <Text className="text-body02 text-black" numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text className="mt-0.5 flex-1 text-body05 text-black" numberOfLines={2}>
                    {item.summary}
                  </Text>
                  <Text className="mt-0.5 text-caption01 text-grey-30" numberOfLines={1}>
                    {item.reporter}
                  </Text>
                  <Text className="text-caption04 text-grey-30" numberOfLines={1}>
                    {new Date(item.date).toISOString().slice(0, 10)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {newspaperLoading && (
              <View className="absolute inset-0 items-center justify-center">
                <ActivityIndicator />
              </View>
            )}
          </View>
        </View>

        {/* 명대뉴스 */}
        <View className="mb-9 mt-8">
          <View className="flex-row items-center justify-between">
            <Text className="ms-4 text-title03 text-black">명대뉴스</Text>
            <TouchableOpacity
              onPress={() => onNavigate(6)}
              className="me-3.5"
              accessibilityRole="button"
              accessibilityLabel="명대뉴스 더보기"
            >
              <ArrowRightIcon size={20} className="text-grey-60" />
            </TouchableOpacity>
          </View>
          <View className="mt-3">
            <CategoryFilter
              categories={Object.keys(BROADCAST_SOURCE_MAP)}
              selected={selectedBroadcastSource}
              onSelect={setSelectedBroadcastSource}
              paddingHorizontal={16}
            />
          </View>
          <View className="relative mx-4 mt-4 gap-4">
            {broadcasts.map((item, index) => {
              const videoId = new URL(item.url).searchParams.get('v') ?? '';
              const d = new Date(item.publishedAt);
              const dateLabel = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
              return (
                <View key={index}>
                  <View className="overflow-hidden rounded-t-xl">
                    <YoutubeEmbed videoId={videoId} height={192} />
                  </View>
                  <TouchableOpacity onPress={() => openLink(item.url)}>
                    <View className="h-24 gap-0.5 rounded-b-xl bg-white px-4 py-2">
                      <Text className="flex-1 text-body02 text-black" numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text className="text-caption04 text-grey-30" numberOfLines={1}>
                        {dateLabel}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
            {broadcastsLoading && (
              <View className="absolute inset-0 items-center justify-center">
                <ActivityIndicator />
              </View>
            )}
          </View>
        </View>
      </View>
      <Footer />
    </ScrollView>
  );
}
