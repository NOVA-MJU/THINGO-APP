import { CategoryFilter } from '@/components/ui/category-filter';
import { Pagination } from '@/components/ui/pagination';
import { Text } from '@/components/ui/text';
import { openLink } from '@/lib/open-link';
import { parseUTCDate } from '@/lib/utils';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { Footer } from '@/components/footer';
import { getNotices, type Notice, type NoticeCategory } from '@/api/notices';

const CATEGORIES: { label: string; value: NoticeCategory }[] = [
  { label: '전체', value: 'all' },
  { label: '일반', value: 'general' },
  { label: '학사', value: 'academic' },
  { label: '장학', value: 'scholarship' },
  { label: '진로', value: 'career' },
  { label: '학생활동', value: 'activity' },
  { label: '학칙개정', value: 'rule' },
];

export default function NoticeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; page?: string }>();

  const categoryValue = (params.category as NoticeCategory) ?? 'all';
  const currentPage = Number(params.page ?? '1');
  const selectedCategory = CATEGORIES.find((c) => c.value === categoryValue)?.label ?? '전체';

  const scrollRef = React.useRef<ScrollView>(null);
  const [notices, setNotices] = React.useState<Notice[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

  // 페이지 변경 시 상단으로 스크롤
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [currentPage]);

  // 데이터 조회
  React.useEffect(() => {
    setLoading(true);
    getNotices({
      category: categoryValue,
      page: currentPage - 1,
      size: 10,
    })
      .then((res) => {
        setNotices(res.content);
        setTotalPages(res.totalPages);
      })
      .catch(() => setNotices([]))
      .finally(() => setLoading(false));
  }, [categoryValue, currentPage]);

  const handleCategorySelect = (label: string) => {
    const value = CATEGORIES.find((c) => c.label === label)?.value ?? 'all';
    router.setParams({ category: value, page: '1' });
  };

  const handlePageChange = (page: number) => {
    router.setParams({ page: String(page) });
  };

  return (
    <ScrollView
      ref={scrollRef}
      className="native:w-screen flex-1 web:w-full"
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View className="mt-4">
        <CategoryFilter
          categories={CATEGORIES.map((c) => c.label)}
          selected={selectedCategory}
          onSelect={handleCategorySelect}
          nestedScrollEnabled
        />
      </View>

      <View className="relative mt-2.5 flex-1 border-t border-grey-02">
        {notices.map((notice, index) => (
          <TouchableOpacity key={index} onPress={() => openLink(notice.link)}>
            <View className="flex w-full flex-col gap-1 border-b border-grey-02 px-4 py-2.5">
              <Text className="text-caption01 text-blue-15">
                {CATEGORIES.find((c) => c.value === notice.category)?.label ?? notice.category}
              </Text>
              <Text className="text-body05 text-black">{notice.title}</Text>
              <Text className="text-caption04 text-grey-30">
                {format(parseUTCDate(notice.date), 'yyyy.MM.dd')}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        {loading && (
          <View className="absolute inset-0 items-center justify-center">
            <ActivityIndicator />
          </View>
        )}
      </View>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        className="mt-6"
      />
      <Footer className="mt-9" />
    </ScrollView>
  );
}
