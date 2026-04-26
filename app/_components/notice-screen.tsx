import { CategoryFilter } from '@/components/ui/category-filter';
import { Pagination } from '@/components/ui/pagination';
import { Text } from '@/components/ui/text';
import * as React from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Footer } from './footer';

export default function NoticeScreen() {
  const categories = ['전체', '일반', '학사', '장학', '진로', '학생활동', '학칙개정'];
  const [selectedCategory, setSelectedCategory] = React.useState('전체');
  const [currentPage, setCurrentPage] = React.useState(1);
  const { bottom } = useSafeAreaInsets();

  return (
    <ScrollView className="w-screen flex-1" contentContainerStyle={{ paddingBottom: bottom }}>
      <View className="mt-4">
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </View>

      {/* 본문 */}
      <View className="mt-2.5 flex-1 border-t border-grey-02">
        {NOTICES.map((notice) => (
          <Pressable key={notice.id} onPress={() => Linking.openURL(notice.url)}>
            <View className="flex w-full flex-col gap-1 border-b border-grey-02 px-4 py-2.5">
              <Text className="text-caption01 text-blue-15">{notice.category}</Text>
              <Text className="text-body05 text-black">{notice.title}</Text>
              <Text className="text-caption04 text-grey-30">{notice.date}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <Pagination
        currentPage={currentPage}
        totalPages={TOTAL_PAGES}
        onPageChange={setCurrentPage}
        className="mt-6"
      />
      <Footer className="mt-9" />
    </ScrollView>
  );
}

// dummy
const TOTAL_PAGES = 8;
const NOTICES = [
  {
    id: 1,
    category: '장학',
    title: '경기공사 관광-2025 컬처패스(경기도 문화소비쿠폰) 에이스 사업 안내',
    date: '2025.08.25',
    url: 'https://www.mju.ac.kr/mjukr/285/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGbWp1a3IlMkYxNiUyRjQ5OTMyJTJGYXJ0Y2xWaWV3LmRvJTNG',
  },
  {
    id: 2,
    category: '일반',
    title: '2025학년도 2학기 수강신청 안내',
    date: '2025.08.20',
    url: 'https://www.mju.ac.kr/mjukr/285/subview.do',
  },
  {
    id: 3,
    category: '학사',
    title: '2025학년도 2학기 학사일정 안내',
    date: '2025.08.18',
    url: 'https://www.mju.ac.kr/mjukr/285/subview.do',
  },
  {
    id: 4,
    category: '진로',
    title: '2025 하반기 취업박람회 참가 안내',
    date: '2025.08.15',
    url: 'https://www.mju.ac.kr/mjukr/285/subview.do',
  },
  {
    id: 5,
    category: '학생활동',
    title: '2025학년도 2학기 동아리 등록 안내',
    date: '2025.08.12',
    url: 'https://www.mju.ac.kr/mjukr/285/subview.do',
  },
  {
    id: 6,
    category: '학칙개정',
    title: '학칙 일부 개정 안내 (제2025-3호)',
    date: '2025.08.10',
    url: 'https://www.mju.ac.kr/mjukr/285/subview.do',
  },
  {
    id: 7,
    category: '장학',
    title: '국가장학금 2차 신청 안내 (2025년 2학기)',
    date: '2025.08.07',
    url: 'https://www.mju.ac.kr/mjukr/285/subview.do',
  },
  {
    id: 8,
    category: '일반',
    title: '2025학년도 2학기 기숙사 입사 안내',
    date: '2025.08.05',
    url: 'https://www.mju.ac.kr/mjukr/285/subview.do',
  },
  {
    id: 9,
    category: '학사',
    title: '졸업예정자 졸업요건 확인 안내',
    date: '2025.08.02',
    url: 'https://www.mju.ac.kr/mjukr/285/subview.do',
  },
  {
    id: 10,
    category: '진로',
    title: '산학협력 인턴십 프로그램 참가자 모집',
    date: '2025.07.30',
    url: 'https://www.mju.ac.kr/mjukr/285/subview.do',
  },
];
