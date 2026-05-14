import { Footer } from '@/components/footer';
import { CategoryFilter } from '@/components/ui/category-filter';
import { Pagination } from '@/components/ui/pagination';
import { Text } from '@/components/ui/text';
import * as React from 'react';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';

const CATEGORIES = ['전체', '보도', '사회'];

export default function NewspaperScreen() {
  const [selectedCategory, setSelectedCategory] = React.useState(CATEGORIES[0]);
  const [currentPage, setCurrentPage] = React.useState(1);

  return (
    <ScrollView className="w-screen flex-1 bg-grey-02" contentContainerClassName="flex-grow">
      <View className="flex-1">
        <View className="mt-4">
          <CategoryFilter
            categories={CATEGORIES}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </View>

        <View className="mt-2.5 gap-2 px-4">
          {DUMMY_ARTICLES.map((article) => (
            <TouchableOpacity key={article.id}>
              <View className="flex-row gap-4 rounded-xl bg-white p-4 transition hover:bg-blue-05 hover:transition-none">
                <Image
                  source={require('@/assets/news-default-thumbnail.jpg')}
                  className="aspect-square w-[110px] rounded border border-grey-10 bg-white"
                />
                <View className="flex-1">
                  <Text className="text-body02 text-black" numberOfLines={1}>
                    {article.title}
                  </Text>
                  <Text className="mt-0.5 flex-1 text-body05 text-black" numberOfLines={2}>
                    {article.preview}
                  </Text>
                  <Text className="mt-0.5 text-caption01 text-grey-30" numberOfLines={1}>
                    {article.author}
                  </Text>
                  <Text className="text-caption04 text-grey-30" numberOfLines={1}>
                    {article.date}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View className="mt-6 pb-14">
          <Pagination currentPage={currentPage} totalPages={8} onPageChange={setCurrentPage} />
        </View>
      </View>

      <Footer withBottomInset />
    </ScrollView>
  );
}

const DUMMY_ARTICLES = [
  {
    id: 1,
    title: '명지대학교 2025 봄 축제 개최 소식',
    preview:
      '명지대학교에서 오는 5월 중순 봄 축제를 개최한다. 다양한 공연과 부스 행사가 예정되어 있다.',
    author: '홍길동 기자',
    date: '2025.05.07',
    category: '보도',
    url: 'https://news.mju.ac.kr/article/1',
  },
  {
    id: 2,
    title: '학생회관 리모델링 공사 일정 안내',
    preview:
      '학생회관 1층 편의시설 리모델링 공사가 5월 중 진행될 예정이며, 해당 기간 동안 이용이 제한된다.',
    author: '김철수 기자',
    date: '2025.05.06',
    category: '사회',
    url: 'https://news.mju.ac.kr/article/2',
  },
  {
    id: 3,
    title: '도서관 심야 열람실 운영 시간 연장',
    preview:
      '중간고사 기간을 맞아 도서관 심야 열람실 운영 시간이 오전 2시까지 연장된다고 학교 측이 밝혔다.',
    author: '이영희 기자',
    date: '2025.05.05',
    category: '보도',
    url: 'https://news.mju.ac.kr/article/3',
  },
  {
    id: 4,
    title: '총학생회 복지 정책 개선안 발표',
    preview:
      '총학생회가 학생 복지 향상을 위한 새로운 정책 개선안을 발표하며 학생들의 큰 관심을 받고 있다.',
    author: '박민준 기자',
    date: '2025.05.04',
    category: '사회',
    url: 'https://news.mju.ac.kr/article/4',
  },
  {
    id: 5,
    title: '명지대 스타트업 경진대회 수상팀 소개',
    preview: '이번 스타트업 경진대회에서 1등을 차지한 팀의 아이디어와 창업 계획을 심층 취재했다.',
    author: '최수진 기자',
    date: '2025.05.03',
    category: '보도',
    url: 'https://news.mju.ac.kr/article/5',
  },
];
