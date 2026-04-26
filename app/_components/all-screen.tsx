import { Text } from '@/components/ui/text';
import * as React from 'react';
import { Link } from 'expo-router';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YoutubeEmbed } from '@/components/youtube-embed';
import { Footer } from './footer';
import { ArrowRightIcon, ChatBubbleIcon, DiningIcon, HeartIcon } from '@/components/icons';
import { CategoryFilter } from '@/components/ui/category-filter';

type Props = {
  onNavigate: (tabIndex: number) => void;
};

const NOTICE_CATEGORIES = ['전체', '일반', '장학', '진로', '학생활동', '학칙개정'];
const NEWSPAPER_CATEGORIES = ['전체', '보도', '사회'];

export default function AllScreen({ onNavigate }: Props) {
  const insets = useSafeAreaInsets();
  const [selectedNoticeCategory, setSelectedNoticeCategory] = React.useState('전체');
  const [selectedNewspaperCategory, setSelectedNewspaperCategory] = React.useState('전체');

  return (
    <ScrollView
      className="w-screen flex-1"
      contentContainerStyle={{ paddingBottom: insets.bottom }}>
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
              categories={NOTICE_CATEGORIES}
              selected={selectedNoticeCategory}
              onSelect={setSelectedNoticeCategory}
              paddingHorizontal={16}
            />
          </View>
          <View className="mt-2">
            {NOTICE_DUMMY_DATA.map((item, index) => (
              <Link key={index} href={item.href as `https://${string}`} asChild>
                <TouchableOpacity className="flex-row items-center px-5 py-3">
                  <Text className="flex-1 text-body05 text-black">{item.title}</Text>
                  <Text className="text-caption04 text-grey-30">{item.time}</Text>
                </TouchableOpacity>
              </Link>
            ))}
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
              categories={NEWSPAPER_CATEGORIES}
              selected={selectedNewspaperCategory}
              onSelect={setSelectedNewspaperCategory}
              paddingHorizontal={16}
            />
          </View>
          <View className="mt-1.5 gap-2">
            {MJU_NEWSPAPER_DUMMY_DATA.map((item, index) => (
              <Link key={index} href={item.href as `https://${string}`} asChild>
                <TouchableOpacity className="flex-row items-center gap-4 px-4 py-3">
                  <Image
                    source={require('@/assets/news-default-thumbnail.jpg')}
                    className="w-25 aspect-square rounded-sm border border-grey-10"
                  />
                  <View className="flex-1">
                    <Text className="text-body02 text-black" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="mt-0.5 text-body05 text-black" numberOfLines={2}>
                      {item.preview}
                    </Text>
                    <Text className="mt-0.5 text-caption01 text-grey-30" numberOfLines={1}>
                      {item.author}
                    </Text>
                    <Text className="text-caption04 text-grey-30" numberOfLines={1}>
                      {item.date}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Link>
            ))}
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
          <View className="mt-4 gap-4 px-5">
            {MJU_NEWS_DUMMY_DATA.map((item, index) => (
              <View key={index}>
                <View className="flex-5 overflow-hidden rounded-t-xl">
                  <YoutubeEmbed videoId={item.videoId} height={192} />
                </View>
                <Link
                  href={`https://www.youtube.com/watch?v=${item.videoId}` as `https://${string}`}
                  asChild>
                  <TouchableOpacity>
                    <View className="flex-2 gap-0.5 px-4 py-2">
                      <Text className="text-body02 text-black" numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text className="text-caption04 text-grey-30" numberOfLines={1}>
                        {item.date}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Link>
              </View>
            ))}
          </View>
        </View>
      </View>
      <Footer />
    </ScrollView>
  );
}

const NOTICE_DUMMY_DATA = [
  { href: 'https://www.mju.ac.kr', title: '2025학년도 명지대학교 청소년 홍보기자', time: '5분전' },
  {
    href: 'https://www.mju.ac.kr',
    title: '[공지] 2025학년도 1학기 수강신청 안내',
    time: '1시간전',
  },
  { href: 'https://www.mju.ac.kr', title: '2025학년도 학생증 발급 신청 안내', time: '3시간전' },
  { href: 'https://www.mju.ac.kr', title: '[긴급] 도서관 시스템 점검 안내', time: '어제' },
  { href: 'https://www.mju.ac.kr', title: '2025학년도 장학금 신청 일정 안내', time: '2일전' },
];

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

const MJU_NEWS_DUMMY_DATA = [
  { videoId: 'jNQXAC9IVRw', title: '명지대학교 2025 봄 축제 현장 스케치', date: '2026.01.24' },
  { videoId: 'dQw4w9WgXcQ', title: '총장 신년사 및 2025학년도 주요 계획 발표', date: '2026.01.20' },
  { videoId: '9bZkp7q19f0', title: '명지대 글로벌 교류 프로그램 소개', date: '2026.01.15' },
  { videoId: 'kJQP7kiw5Fk', title: '2025 명지대 입학식 하이라이트', date: '2026.01.10' },
  { videoId: 'OPf0YbXqDm0', title: '명지대 스포츠 클럽 활동 소개', date: '2026.01.05' },
];

const MJU_NEWSPAPER_DUMMY_DATA = [
  {
    href: 'https://www.mju.ac.kr',
    title: '2025 명지대 봄 축제 "봄봄" 성황리에 마무리',
    preview:
      '지난 23일부터 이틀간 진행된 봄 축제가 재학생 3천여 명이 참가한 가운데 성황리에 막을 내렸다.',
    author: '홍길동 기자',
    date: '2026.01.24',
  },
  {
    href: 'https://www.mju.ac.kr',
    title: '도서관 24시간 열람실, 2학기부터 운영 확대',
    preview:
      '학생 수요 증가에 따라 인문관 열람실을 포함한 2개 구역이 24시간 운영 체제로 전환될 예정이다.',
    author: '김민지 기자',
    date: '2026.01.21',
  },
  {
    href: 'https://www.mju.ac.kr',
    title: '총학생회, 등록금 동결 요구 성명 발표',
    preview:
      '총학생회는 물가 상승에 따른 학생 부담 완화를 위해 다음 학년도 등록금 동결을 학교 측에 공식 요청했다.',
    author: '이준혁 기자',
    date: '2026.01.18',
  },
];
