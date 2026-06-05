import { getNews, type NewsCategory, type NewsItem } from '@/api/news';
import { Footer } from '@/components/footer';
import { CategoryFilter } from '@/components/ui/category-filter';
import { Pagination } from '@/components/ui/pagination';
import { Text } from '@/components/ui/text';
import { parseUTCDate } from '@/lib/utils';
import { format } from 'date-fns';
import * as React from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';

const CATEGORIES: { label: string; value: NewsCategory }[] = [
  { label: '전체', value: null },
  { label: '보도', value: 'REPORT' },
  { label: '사회', value: 'SOCIETY' },
];

export default function NewspaperScreen() {
  const scrollRef = React.useRef<ScrollView>(null);
  const [selectedCategory, setSelectedCategory] = React.useState('전체');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [articles, setArticles] = React.useState<NewsItem[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

  // 페이지 변경 시 상단으로 스크롤
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [currentPage]);

  // 데이터 조회
  React.useEffect(() => {
    setLoading(true);
    getNews({
      category: CATEGORIES.find((c) => c.label === selectedCategory)?.value,
      page: currentPage - 1,
      size: 5,
    })
      .then((res) => {
        setArticles(res.content);
        setTotalPages(res.totalPages);
      })
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [selectedCategory, currentPage]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  return (
    <ScrollView
      ref={scrollRef}
      className="w-screen flex-1 bg-grey-02"
      contentContainerClassName="flex-grow"
    >
      <View className="pt-4">
        <CategoryFilter
          categories={CATEGORIES.map((c) => c.label)}
          selected={selectedCategory}
          onSelect={handleCategorySelect}
        />
      </View>
      <View className="relative flex-1 gap-2 px-4 pt-2.5">
        {articles.map((article, index) => (
          <TouchableOpacity key={index} onPress={() => Linking.openURL(article.link)}>
            <View className="flex-row gap-4 rounded-xl bg-white p-4">
              <Image
                source={
                  article.imageUrl
                    ? { uri: article.imageUrl }
                    : require('@/assets/news-default-thumbnail.jpg')
                }
                className="aspect-square w-[110px] rounded border border-grey-10 bg-white"
              />
              <View className="flex-1">
                <Text className="text-body02 text-black" numberOfLines={1}>
                  {article.title}
                </Text>
                <Text className="mt-0.5 flex-1 text-body05 text-black" numberOfLines={2}>
                  {article.summary}
                </Text>
                <Text className="mt-0.5 text-caption01 text-grey-30" numberOfLines={1}>
                  {article.reporter}
                </Text>
                <Text className="text-caption04 text-grey-30" numberOfLines={1}>
                  {format(parseUTCDate(article.date), 'yyyy.MM.dd')}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {!loading && articles.length === 0 && (
          <View className="items-center py-16">
            <Text className="text-body05 text-grey-30">등록된 기사가 없습니다.</Text>
          </View>
        )}
        {loading && (
          <View className="absolute inset-0 items-center justify-center">
            <ActivityIndicator />
          </View>
        )}
      </View>
      <View className="pb-14 pt-6">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </View>
      <Footer withBottomInset />
    </ScrollView>
  );
}
