import { getBoards, type Board, type CommunityCategory } from '@/api/posts';
import { Footer } from '@/components/footer';
import { ChatBubbleIcon, HeartIcon } from '@/components/icons';
import { Pagination } from '@/components/ui/pagination';
import { Text } from '@/components/ui/text';
import { cn, parseUTCDate } from '@/lib/utils';
import { format } from 'date-fns';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ClipboardPen } from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

type BoardCategoryTab = 'info' | 'free';

const BOARD_TABS: { key: BoardCategoryTab; label: string }[] = [
  { key: 'info', label: '정보 게시판' },
  { key: 'free', label: '자유 게시판' },
];

const CATEGORY_MAP: Record<BoardCategoryTab, Exclude<CommunityCategory, 'ALL'>> = {
  info: 'NOTICE',
  free: 'FREE',
};

const ITEMS_PER_PAGE = 10;

function BoardHotBadge() {
  return (
    <View className="h-[20px] w-[40px] items-center justify-center self-start rounded-full bg-blue-20 px-[8px]">
      <Text className="text-[11px] text-white text-caption04">HOT</Text>
    </View>
  );
}

function formatBoardDate(item: Board) {
  const date = item.publishedAt ?? item.createdAt;
  return format(parseUTCDate(date), 'yyyy.MM.dd');
}

function getBoardPreview(item: Board) {
  const preview = item.previewContent.trim();
  return preview.length > 0 ? preview : '등록된 본문 미리보기가 없습니다.';
}

type BoardCardProps = {
  item: Board;
  onPress?: () => void;
};

function BoardCard({ item, onPress }: BoardCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn('border-b border-grey-10 px-4 pb-2 pt-2', item.liked && 'bg-blue-05')}
    >
      <View className="gap-2">
        <View className="gap-1.5">
          <View className="flex-row items-center gap-1.5">
            {item.popular && <BoardHotBadge />}
            <Text className="flex-1 text-black text-body04" numberOfLines={1}>
              {item.title}
            </Text>
          </View>

          <Text className="pr-2 text-[14px] leading-[18px] text-black" numberOfLines={2}>
            {getBoardPreview(item)}
          </Text>
        </View>

        <View className="mt-0.5 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-0.5">
              <HeartIcon size={24} className="text-[#8BC7FF]" filled={item.liked} />
              <Text className="text-grey-40 text-caption02">{item.likeCount}</Text>
            </View>

            <View className="flex-row items-center gap-0.5">
              <ChatBubbleIcon size={24} className="text-[#8BC7FF]" />
              <Text className="text-grey-40 text-caption02">{item.commentCount}</Text>
            </View>
          </View>

          <Text className="text-grey-40 text-caption02">{formatBoardDate(item)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function WriteButton({ bottomOffset, onPress }: { bottomOffset: number; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="absolute right-4 h-[70px] w-[70px] items-center justify-center rounded-full bg-blue-35 p-[10px]"
      style={{
        bottom: bottomOffset,
        elevation: 8,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      }}
      hitSlop={4}
    >
      <View className="items-center justify-center">
        <ClipboardPen size={24} color="#E8F1FF" strokeWidth={2} />
        <Text className="text-blue-05 text-caption02">글남기기</Text>
      </View>
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View className="items-center justify-center px-6 py-20">
      <Text className="text-black text-body04">등록된 게시글이 없습니다.</Text>
      <Text className="mt-1 text-grey-40 text-body05">첫 번째 글을 작성해보세요.</Text>
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="items-center justify-center px-6 py-20">
      <Text className="text-black text-body04">게시글 목록을 불러오지 못했습니다.</Text>
      <Pressable onPress={onRetry} className="mt-4 rounded-full border border-blue-20 px-4 py-2">
        <Text className="text-blue-35 text-body05">다시 시도</Text>
      </Pressable>
    </View>
  );
}

function NoticeBoardScreen() {
  const router = useRouter();
  const { boardCategory, page } = useLocalSearchParams<{
    boardCategory?: string;
    page?: string;
  }>();

  const activeCategory: BoardCategoryTab = boardCategory === 'free' ? 'free' : 'info';
  const currentPage = Number(page ?? '1');

  const scrollRef = React.useRef<ScrollView>(null);
  const [boards, setBoards] = React.useState<Board[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalElements, setTotalElements] = React.useState(0);
  const loadedQueryKeyRef = React.useRef<string | null>(null);

  const loadBoards = React.useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
      }
      setError(false);

      try {
        const response = await getBoards({
          page: currentPage - 1,
          size: ITEMS_PER_PAGE,
          communityCategory: CATEGORY_MAP[activeCategory],
          sortBy: 'createdAt',
          direction: 'DESC',
        });

        setBoards(response.boards);
        setTotalPages(Math.max(1, response.totalPages));
        setTotalElements(response.totalElements);
      } catch {
        setBoards([]);
        setTotalPages(1);
        setTotalElements(0);
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [activeCategory, currentPage]
  );

  // 데이터 최초 로딩
  React.useEffect(() => {
    void loadBoards();
  }, [loadBoards]);

  // 화면이 다시 focus 될 때 데이터 갱신
  useFocusEffect(
    React.useCallback(() => {
      const queryKey = `${activeCategory}-${currentPage}`;

      if (loadedQueryKeyRef.current !== queryKey) {
        loadedQueryKeyRef.current = queryKey;
        return;
      }

      void loadBoards({ silent: true });
    }, [activeCategory, currentPage, loadBoards])
  );

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [activeCategory, currentPage]);

  const handleCategoryChange = (tab: BoardCategoryTab) => {
    router.setParams({ boardCategory: tab, page: '1' });
  };

  const handlePageChange = (p: number) => {
    router.setParams({ page: String(p) });
  };

  const showPagination = !loading && !error && totalElements > 0 && totalPages > 1;

  return (
    <View className="native:w-screen flex-1 bg-white web:w-full">
      <View className="bg-grey-02">
        <View className="mt-2 flex-row">
          {BOARD_TABS.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => handleCategoryChange(tab.key)}
              className={cn(
                'flex-1 border py-2',
                activeCategory === tab.key
                  ? 'rounded-t-sm border-grey-10 border-b-white bg-white'
                  : 'border-grey-02 border-b-grey-10'
              )}
            >
              <Text
                className={cn(
                  'text-center',
                  activeCategory === tab.key ? 'text-black text-body04' : 'text-grey-40 text-body05'
                )}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1 bg-white"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1 justify-between bg-white pt-5">
          <View>
            <View className="px-4 pb-3">
              <Text className="text-black text-title03">
                {BOARD_TABS.find((tab) => tab.key === activeCategory)?.label}
              </Text>
              <Text className="mt-1 text-grey-40 text-body05">총 {totalElements}개</Text>
            </View>

            {loading ? (
              <View className="items-center justify-center py-20">
                <ActivityIndicator />
              </View>
            ) : error ? (
              <ErrorState onRetry={() => void loadBoards()} />
            ) : boards.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <View className="bg-white">
                  {boards.map((item) => (
                    <BoardCard
                      key={item.uuid}
                      item={item}
                      onPress={() => router.push(`/posts/${item.uuid}`)}
                    />
                  ))}
                </View>

                {showPagination && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    className="mb-7 mt-6"
                  />
                )}
              </>
            )}
          </View>

          <Footer />
        </View>
      </ScrollView>

      <WriteButton bottomOffset={20} onPress={() => router.push('/posts/write')} />
    </View>
  );
}

export { NoticeBoardScreen };
export default NoticeBoardScreen;
