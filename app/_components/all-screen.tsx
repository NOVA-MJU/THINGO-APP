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

  return (
    <ScrollView className="w-screen flex-1">
      <View className="min-h-screen gap-2 bg-grey-02">
        {/* 식단 */}
        <View className="bg-white p-5">
          <TouchableOpacity onPress={() => onNavigate(1)}>
            <View className="gap-2 rounded-lg border border-grey-10 p-4">
              <View className="flex-row items-center gap-1">
                <DiningIcon className="text-grey-30" />
                <Text className="text-body02 text-black">1월 21일 (화) 점심</Text>
              </View>
              <Text className="text-body05 text-grey-80">등록된 식단 내용이 없습니다.</Text>
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
                <TouchableOpacity className="flex-row items-center px-5 py-3">
                  <Text className="flex-1 text-body05 text-black">{item.title}</Text>
                  <Text className="text-caption04 text-grey-30">{formatNoticeDate(item.date)}</Text>
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
            {SCHEDULE_DUMMY_DATA.date}
          </Text>
          <View className="mt-2">
            {SCHEDULE_DUMMY_DATA.items.map((item, index) => (
              <View key={index} className="flex-row items-start gap-2 px-5 py-2">
                <Text className="w-[75px] text-caption02 text-grey-40">{item.date}</Text>
                <Text className="flex-1 text-caption02 text-black" numberOfLines={2}>
                  <Text className="text-caption02 font-bold">{item.category}</Text> {item.title}
                </Text>
              </View>
            ))}
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

const SCHEDULE_DUMMY_DATA = {
  date: '01.21 (화)',
  items: [
    { date: '01.05', category: '[학부·대학원]', title: '학기 개시일, 2학기 개강' },
    { date: '01.05', category: '[학부·대학원]', title: '학기 개시일, 2학기 개강 학기 개시일' },
    {
      date: '01.05 - 01.09',
      category: '[학부·대학원]',
      title: '수강신청 변경 기간 수강신청 변경 기간수강신청 변경 기간수강신청 변경 기간',
    },
  ],
};

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
