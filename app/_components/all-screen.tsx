import { Text } from '@/components/ui/text';
import * as React from 'react';
import { Link } from 'expo-router';
import { ActivityIndicator, Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { YoutubeEmbed } from '@/components/youtube-embed';
import { ArrowRightIcon, ChatBubbleIcon, DiningIcon, HeartIcon } from '@/components/icons';
import { CategoryFilter } from '@/components/ui/category-filter';
import { Footer } from '@/components/footer';
import { getNotices, type Notice, type NoticeCategory } from '@/api/notices';
import { getNews, type NewsItem, type NewsCategory } from '@/api/news';
import { getBroadcasts, type BroadcastItem } from '@/api/broadcast';
import { getMenus, type DailyMenu } from '@/api/menus';
import { getCalendar, type CalendarEvent } from '@/api/calendar';

const CATEGORY_MAP: Record<string, NoticeCategory> = {
  전체: 'all',
  일반: 'general',
  장학: 'scholarship',
  진로: 'career',
  학생활동: 'activity',
  학칙개정: 'rule',
};

function formatNoticeDate(dateStr: string): string {
  const date = new Date(dateStr + 'Z');
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return '어제';
  if (diffDay < 7) return `${diffDay}일 전`;
  return `${date.getMonth() + 1}.${date.getDate()}`;
}

type Props = {
  onNavigate: (tabIndex: number) => void;
};

const NEWSPAPER_CATEGORY_MAP: Record<string, NewsCategory> = {
  전체: null,
  보도: 'REPORT',
  사회: 'SOCIETY',
};

export default function AllScreen({ onNavigate }: Props) {
  const [selectedNoticeCategory, setSelectedNoticeCategory] = React.useState('전체');
  const [selectedNewspaperCategory, setSelectedNewspaperCategory] = React.useState('전체');
  const [notices, setNotices] = React.useState<Notice[]>([]);
  const [noticesLoading, setNoticesLoading] = React.useState(false);
  const [newspaper, setNewspaper] = React.useState<NewsItem[]>([]);
  const [newspaperLoading, setNewspaperLoading] = React.useState(false);
  const [broadcasts, setBroadcasts] = React.useState<BroadcastItem[]>([]);
  const [broadcastsLoading, setBroadcastsLoading] = React.useState(false);
  const [menus, setMenus] = React.useState<DailyMenu[]>([]);
  const [todayEvents, setTodayEvents] = React.useState<
    { dateLabel: string; description: string }[]
  >([]);

  React.useEffect(() => {
    setNoticesLoading(true);
    getNotices({ category: CATEGORY_MAP[selectedNoticeCategory], size: 5 })
      .then((res) => setNotices(res.content))
      .catch(() => setNotices([]))
      .finally(() => setNoticesLoading(false));
  }, [selectedNoticeCategory]);

  React.useEffect(() => {
    setNewspaperLoading(true);
    getNews({ category: NEWSPAPER_CATEGORY_MAP[selectedNewspaperCategory], size: 3 })
      .then((res) => setNewspaper(res.content))
      .catch(() => setNewspaper([]))
      .finally(() => setNewspaperLoading(false));
  }, [selectedNewspaperCategory]);

  React.useEffect(() => {
    setBroadcastsLoading(true);
    getBroadcasts({ size: 5 })
      .then((res) => setBroadcasts(res.content))
      .catch(() => setBroadcasts([]))
      .finally(() => setBroadcastsLoading(false));
  }, []);

  React.useEffect(() => {
    getMenus()
      .then((res) => setMenus(res.data))
      .catch(() => {});
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
  const { currentMealLabel, currentMealCategory, todayLabel } = React.useMemo(() => {
    const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
    const now = new Date();
    const hour = now.getHours() * 60 + now.getMinutes();
    let label: string;
    let category: 'BREAKFAST' | 'LUNCH' | 'DINNER';
    if (hour < 9 * 60) {
      label = '조식';
      category = 'BREAKFAST';
    } else if (hour < 14 * 60) {
      label = '중식';
      category = 'LUNCH';
    } else {
      label = '석식';
      category = 'DINNER';
    }
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const day = DAY_NAMES[now.getDay()];
    return {
      currentMealLabel: label,
      currentMealCategory: category,
      todayLabel: `${m}월 ${d}일 (${day})`,
    };
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

  return (
    <ScrollView className="w-screen flex-1">
      <View className="min-h-screen gap-2 bg-grey-02">
        {/* 식단 */}
        <View className="bg-white p-5">
          <TouchableOpacity onPress={() => onNavigate(1)}>
            <View className="gap-2 rounded-lg border border-grey-10 p-4">
              <View className="flex-row items-center gap-1">
                <DiningIcon className="text-grey-30" />
                <Text className="text-body02 text-black">
                  {todayLabel} {currentMealLabel}
                </Text>
              </View>
              <Text className="text-body05 text-grey-80">
                {todayMeals.length > 0 ? todayMeals.join(', ') : '등록된 식단 내용이 없습니다.'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 공지사항 */}
        <View className="bg-white py-5">
          <View className="flex-row items-center justify-between">
            <Text className="ms-4 text-title03 text-black">공지사항</Text>
            <TouchableOpacity onPress={() => onNavigate(4)} className="me-3.5">
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
          <View className="relative mt-2">
            {notices.map((item, index) => (
              <Link key={index} href={item.link as `https://${string}`} asChild>
                <TouchableOpacity className="flex-row items-center gap-1 px-5 py-3">
                  <Text className="flex-1 text-body05 text-black" numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text className="text-caption04 text-grey-30" numberOfLines={1}>
                    {formatNoticeDate(item.date)}
                  </Text>
                </TouchableOpacity>
              </Link>
            ))}
            {noticesLoading && (
              <View className="absolute inset-0 items-center justify-center">
                <ActivityIndicator />
              </View>
            )}
          </View>
        </View>

        {/* 학사일정 */}
        <View className="bg-white py-5">
          <View className="flex-row items-center justify-between">
            <Text className="ms-4 text-title03 text-black">학사일정</Text>
            <TouchableOpacity onPress={() => onNavigate(5)} className="me-3.5">
              <ArrowRightIcon size={20} className="text-grey-60" />
            </TouchableOpacity>
          </View>
          <Text className="mt-3 border-b border-grey-02 px-5 py-1 text-body02 text-mju-primary">
            {todayLabel}
          </Text>
          <View className="mt-2">
            {todayEvents.length === 0 ? (
              <Text className="px-5 py-2 text-caption02 text-grey-30">오늘 일정이 없습니다.</Text>
            ) : (
              todayEvents.map((item, index) => (
                <View key={index} className="flex-row items-start gap-2 px-5 py-2">
                  <Text className="w-[80px] text-caption02 text-grey-40">{item.dateLabel}</Text>
                  <Text className="flex-1 text-caption02 text-black" numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* 게시판 */}
        <View className="bg-white py-5">
          <View className="flex-row items-center justify-between">
            <Text className="ms-4 text-title03 text-black">게시판</Text>
            <TouchableOpacity onPress={() => onNavigate(2)} className="me-3.5">
              <ArrowRightIcon size={20} className="text-grey-60" />
            </TouchableOpacity>
          </View>
          <View className="mt-3">
            {POSTS_DUMMY_DATA.map((item) => (
              <Link key={item.postId} href={`/posts/${item.postId}`} asChild>
                <TouchableOpacity className="gap-2 px-4 pb-2 pt-3">
                  <View className="flex-row gap-1">
                    <Text className="text-body04 text-black">{item.category}</Text>
                    <Text className="flex-1 text-body05 text-black" numberOfLines={1}>
                      {item.title}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="flex-1 text-caption04 text-grey-30">{item.date}</Text>
                    <HeartIcon className="ms-3 text-blue-10" />
                    <Text className="ms-1 text-caption02 text-grey-40">{item.likes}</Text>
                    <ChatBubbleIcon className="ms-2 text-blue-10" />
                    <Text className="ms-1 text-caption02 text-grey-40">{item.comments}</Text>
                  </View>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        </View>

        {/* 명대신문 */}
        <View className="bg-white py-5">
          <View className="flex-row items-center justify-between">
            <Text className="ms-4 text-title03 text-black">명대신문</Text>
            <TouchableOpacity onPress={() => onNavigate(6)} className="me-3.5">
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
          <View className="relative mt-1.5 gap-2">
            {newspaper.map((item, index) => (
              <Link key={index} href={item.link as `https://${string}`} asChild>
                <TouchableOpacity className="flex-row items-center gap-4 px-4 py-3">
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={{ width: 110, height: 110 }}
                    className="rounded border border-grey-10 bg-white"
                  />
                  <View className="flex-1">
                    <Text className="text-body02 text-black" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="mt-0.5 text-body05 text-black" numberOfLines={2}>
                      {item.summary}
                    </Text>
                    <Text className="mt-0.5 text-caption01 text-grey-30" numberOfLines={1}>
                      {item.reporter}
                    </Text>
                    <Text className="text-caption04 text-grey-30" numberOfLines={1}>
                      {formatNoticeDate(item.date)}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Link>
            ))}
            {newspaperLoading && (
              <View className="absolute inset-0 items-center justify-center">
                <ActivityIndicator />
              </View>
            )}
          </View>
        </View>

        {/* 명대뉴스 */}
        <View className="bg-white py-5">
          <View className="flex-row items-center justify-between">
            <Text className="ms-4 text-title03 text-black">명대뉴스</Text>
            <TouchableOpacity onPress={() => onNavigate(7)} className="me-3.5">
              <ArrowRightIcon size={20} className="text-grey-60" />
            </TouchableOpacity>
          </View>
          <View className="relative mt-4 gap-4 px-5">
            {broadcasts.map((item, index) => {
              const videoId = new URL(item.url).searchParams.get('v') ?? '';
              return (
                <View key={index}>
                  <View className="flex-5 overflow-hidden rounded-t-xl">
                    <YoutubeEmbed videoId={videoId} height={192} />
                  </View>
                  <Link href={item.url as `https://${string}`} asChild>
                    <TouchableOpacity>
                      <View className="flex-2 gap-0.5 px-4 py-2">
                        <Text className="text-body02 text-black" numberOfLines={2}>
                          {item.title}
                        </Text>
                        <Text className="text-caption04 text-grey-30" numberOfLines={1}>
                          {formatNoticeDate(item.publishedAt)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </Link>
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
      <Footer withBottomInset />
    </ScrollView>
  );
}

const POSTS_DUMMY_DATA = [
  {
    postId: 1,
    category: '정보게시판',
    title: '2025학년도 1학기 수강편람 배포 안내',
    date: '2026.01.20',
    likes: 35,
    comments: 12,
  },
  {
    postId: 2,
    category: '자유게시판',
    title: '도서관 스터디룸 같이 쓸 사람 구합니다',
    date: '2026.01.21',
    likes: 8,
    comments: 5,
  },
  {
    postId: 3,
    category: '정보게시판',
    title: '교내 소프트웨어 무료 라이선스 신청 방법',
    date: '2026.01.22',
    likes: 54,
    comments: 20,
  },
  {
    postId: 4,
    category: '자유게시판',
    title: '오늘 학식 메뉴 진짜 너무 맛있었음',
    date: '2026.01.23',
    likes: 21,
    comments: 33,
  },
  {
    postId: 5,
    category: '정보게시판',
    title: '졸업 요건 확인 방법 및 신청 절차 총정리',
    date: '2026.01.24',
    likes: 77,
    comments: 41,
  },
];
