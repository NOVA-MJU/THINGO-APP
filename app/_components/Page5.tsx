import { Pagination } from '@/components/ui/pagination';
import { Text } from '@/components/ui/text';
import clsx from 'clsx';
import * as React from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function Page5() {
  const categories = ['전체', '일반', '학사', '장학', '진로', '학생활동', '학칙개정'];
  const [selectedCategory, setSelectedCategory] = React.useState('전체');
  const [currentPage, setCurrentPage] = React.useState(1);
  const { bottom } = useSafeAreaInsets();

  return (
    <ScrollView className="w-screen flex-1" contentContainerStyle={{ paddingBottom: bottom }}>
      {/* 카테고리 필터 */}
      <View className="mt-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}>
          {categories.map((label) => (
            <Pressable key={label} onPress={() => setSelectedCategory(label)} className="p-1">
              <View
                className={clsx(
                  'rounded-full px-3 py-1.5',
                  selectedCategory === label ? 'bg-mju-primary' : 'border-grey-10 border bg-white'
                )}>
                <Text
                  className={clsx(
                    selectedCategory === label
                      ? 'text-body04 text-white'
                      : 'text-body05 text-grey-40'
                  )}>
                  {label}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* 본문 */}
      <View className="border-grey-02 mt-2.5 flex-1 border-t">
        {NOTICES.map((notice) => (
          <Pressable key={notice.id} onPress={() => Linking.openURL(notice.url)}>
            <View className="border-grey-02 flex w-full flex-col gap-1 border-b px-4 py-2.5">
              <Text className="text-blue-15 text-caption01">{notice.category}</Text>
              <Text className="text-body05 text-black">{notice.title}</Text>
              <Text className="text-grey-30 text-caption04">{notice.date}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* 페이지네이션 */}
      <View className="mt-6 w-full items-center">
        <Pagination
          currentPage={currentPage}
          totalPages={TOTAL_PAGES}
          onPageChange={setCurrentPage}
        />
      </View>

      {/* footer 작성 전 */}
      <View className="bg-blue-05 mt-9 h-20 w-full"></View>
    </ScrollView>
  );
}

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
