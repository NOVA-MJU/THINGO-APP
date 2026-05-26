import { Text } from '@/components/ui/text';
import * as React from 'react';
import { Link } from 'expo-router';
import { ActivityIndicator, Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { YoutubeEmbed } from '@/components/youtube-embed';
import { CategoryFilter } from '@/components/ui/category-filter';
import { Footer } from '@/components/footer';
import { getNotices, type Notice, type NoticeCategory } from '@/api/notices';
import { getNews, type NewsItem, type NewsCategory } from '@/api/news';
import { getBroadcasts, type BroadcastItem } from '@/api/broadcast';
import { getMenus, type DailyMenu } from '@/api/menus';
import { getCalendar, type CalendarEvent } from '@/api/calendar';
import { formatTimeAgo } from '@/lib/utils';
import { MyeongjiMapIcon } from './icons/MyeongjiMapIcon';
import { DiningIcon } from './icons/DiningIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { ChatIcon } from './icons/ChatIcon';
import { FireIcon } from './icons/FireIcon';
import { StarIcon } from './icons/StarIcon';
import { ArrowRightIcon, ChatBubbleIcon, HeartIcon } from '@/components/icons';

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
    getNotices({ category: CATEGORY_MAP[selectedNoticeCategory], size: 6 })
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

  return (
    <ScrollView className="w-screen flex-1">
      <View className="min-h-screen bg-grey-02">
        <View className="bg-white py-5">
          <View className="items-center">
            {/* 배너 */}
            <View className="h-52 w-full rounded-2xl bg-blue-10"></View>
            {/* 배너 인디케이터 */}
            <View className="mt-2 flex-row items-center gap-2">
              <View className="h-1 w-1 bg-blue-20" />
              <View className="h-1 w-1 bg-grey-20" />
              <View className="h-1 w-1 bg-grey-20" />
            </View>
          </View>

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
              <View className="flex-1 gap-1">
                <Text className="text-caption03 text-blue-15">D-00</Text>
                <Text className="text-caption01 text-grey-80">중간고사 강의 평가기간</Text>
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-caption03 text-blue-15">D-00</Text>
                <Text className="text-caption02 text-grey-80">2학기 개강 학기 개시일</Text>
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-caption03 text-blue-15">D-00</Text>
                <Text className="text-caption02 text-grey-80">2학기 개강 학기 개시일</Text>
              </View>
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
        <Text className="px-4 text-caption02 text-grey-60">한달동안 가장 많은 조회 수</Text>
        <View className="mx-4 mt-3 rounded-xl bg-white py-1">
          {[
            { category: 'general', title: '2025학년도 1학기 기말고사 일정 안내', date: '3일 전' },
            {
              category: 'scholarship',
              title: '국가장학금 2차 신청 기간 안내 (6/1~6/15)',
              date: '5일 전',
            },
            {
              category: 'career',
              title: '삼성전자 하계 인턴십 채용 설명회 개최 안내',
              date: '1주 전',
            },
            {
              category: 'activity',
              title: '제29대 총학생회 정기 대의원회의 결과 공고',
              date: '1주 전',
            },
            { category: 'academic', title: '2025-1학기 성적 이의신청 기간 안내', date: '2주 전' },
            { category: 'rule', title: '학칙 일부 개정 예고 (학사운영 관련)', date: '2주 전' },
          ].map((item, index) => (
            <TouchableOpacity key={index} className="flex-row items-center gap-1 px-4 py-3">
              <Text className="text-body04 text-black" numberOfLines={1}>
                {NOTICE_CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category}
              </Text>
              <Text className="flex-1 text-body05 text-black" numberOfLines={1}>
                {item.title}
              </Text>
              <Text className="text-caption04 text-grey-30">{item.date}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* HOT 게시판 */}
        <View className="mt-8 flex-row items-center gap-1 px-4">
          <StarIcon />
          <Text className="text-title03 text-black">HOT 게시판</Text>
        </View>
        <Text className="px-4 text-caption02 text-grey-60">모두가 가장 보고 싶은 글</Text>
        <View className="mx-4 mt-3 rounded-xl bg-white py-1">
          {[
            {
              board: '정보게시판',
              title: '중간고사 족보 공유합니다 전공 필수 과목 위주로',
              date: '2025.05.20',
              likes: 142,
              comments: 38,
            },
            {
              board: '자유게시판',
              title: '학식 오늘 뭐 나왔나요? 맛있는 거 있으면 알려주세요',
              date: '2025.05.21',
              likes: 87,
              comments: 24,
            },
            {
              board: '취업게시판',
              title: 'SW 개발 인턴 후기 공유 (대기업 계열사 3개월 경험)',
              date: '2025.05.22',
              likes: 203,
              comments: 61,
            },
          ].map((item, index) => (
            <TouchableOpacity key={index} className="gap-2 px-4 pb-2 pt-3">
              <View className="flex-row gap-1">
                <Text className="text-body04 text-black" numberOfLines={1}>
                  {item.board}
                </Text>
                <Text className="flex-1 text-body05 text-black" numberOfLines={1}>
                  {item.title}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="flex-1 text-caption04 text-grey-30">{item.date}</Text>
                <HeartIcon className="text-blue-10" />
                <Text className="ms-1 text-caption02 text-grey-40">{item.likes}</Text>
                <ChatBubbleIcon className="ms-2 text-blue-10" />
                <Text className="ms-1 text-caption02 text-grey-40">{item.comments}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 공지사항 */}
        <View className="mt-8">
          <View className="flex-row items-center justify-between">
            <Text className="ms-4 text-title03 text-black">공지사항</Text>
            <TouchableOpacity onPress={() => onNavigate(3)} className="me-3.5">
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
              <Link key={index} href={item.link as `https://${string}`} asChild>
                <TouchableOpacity className="flex-row items-center gap-1 px-4 py-3">
                  <Text className="text-body04 text-black" numberOfLines={1}>
                    {NOTICE_CATEGORIES.find((c) => c.value === item.category)?.label ??
                      item.category}
                  </Text>
                  <Text className="flex-1 text-body05 text-black" numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text className="text-caption04 text-grey-30" numberOfLines={1}>
                    {formatTimeAgo(item.date)}
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
        <View className="mt-8">
          <View className="flex-row items-center justify-between">
            <Text className="ms-4 text-title03 text-black">학사일정</Text>
            <TouchableOpacity onPress={() => onNavigate(4)} className="me-3.5">
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
            <TouchableOpacity onPress={() => onNavigate(2)} className="me-3.5">
              <ArrowRightIcon size={20} className="text-grey-60" />
            </TouchableOpacity>
          </View>
          <View className="mx-4 mt-3 rounded-xl bg-white py-1">
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
        <View className="mt-8">
          <View className="flex-row items-center justify-between">
            <Text className="ms-4 text-title03 text-black">명대신문</Text>
            <TouchableOpacity onPress={() => onNavigate(5)} className="me-3.5">
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
              <Link key={index} href={item.link as `https://${string}`} asChild>
                <TouchableOpacity className="flex-row items-center gap-4 rounded-xl bg-white p-4">
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
                      {formatTimeAgo(item.date)}
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
        <View className="mb-9 mt-8">
          <View className="flex-row items-center justify-between">
            <Text className="ms-4 text-title03 text-black">명대뉴스</Text>
            <TouchableOpacity onPress={() => onNavigate(6)} className="me-3.5">
              <ArrowRightIcon size={20} className="text-grey-60" />
            </TouchableOpacity>
          </View>
          <View className="relative mx-4 mt-4 gap-4">
            {broadcasts.map((item, index) => {
              const videoId = new URL(item.url).searchParams.get('v') ?? '';
              return (
                <View key={index}>
                  <View className="overflow-hidden rounded-t-xl">
                    <YoutubeEmbed videoId={videoId} height={192} />
                  </View>
                  <Link href={item.url as `https://${string}`} asChild>
                    <TouchableOpacity>
                      <View className="h-24 gap-0.5 rounded-b-xl bg-white px-4 py-2">
                        <Text className="flex-1 text-body02 text-black" numberOfLines={2}>
                          {item.title}
                        </Text>
                        <Text className="text-caption04 text-grey-30" numberOfLines={1}>
                          {formatTimeAgo(item.publishedAt)}
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
