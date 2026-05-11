import { getMyLikedPosts, type MyPost } from '@/api/members';
import { Footer } from '@/components/footer';
import { ChatBubbleIcon, HeartIcon } from '@/components/icons';
import { Pagination } from '@/components/ui/pagination';
import { Text } from '@/components/ui/text';
import { router } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';

const ITEMS_PER_PAGE = 10;

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

export default function LikedPostsScreen() {
  const scrollRef = React.useRef<ScrollView>(null);
  const [posts, setPosts] = React.useState<MyPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    getMyLikedPosts()
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  // 상단으로 스크롤
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentPage]);

  // 서버에서 페이지네이션 응답을 안줘서 직접 구현
  const totalPages = Math.max(1, Math.ceil(posts.length / ITEMS_PER_PAGE));
  const pagedPosts = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return posts.slice(start, start + ITEMS_PER_PAGE);
  }, [posts, currentPage]);

  return (
    <ScrollView ref={scrollRef} className="flex-1 bg-grey-02" contentContainerClassName="flex-grow">
      <View className="flex-1">
        <View className="px-4 py-5">
          <Text className="text-title01 text-black">찜한 글</Text>
          <Text className="mt-1 text-body05 text-grey-40">총 {posts.length}개</Text>
        </View>

        <View className="relative flex-1">
          {loading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator />
            </View>
          ) : pagedPosts.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-body05 text-black">찜한 글이 없습니다.</Text>
            </View>
          ) : (
            <>
              <View className="gap-2 px-4">
                {pagedPosts.map((item) => (
                  <TouchableOpacity
                    key={item.uuid}
                    className="gap-2 rounded-xl bg-white px-4 pb-2 pt-3"
                    onPress={() => router.push(`/posts/${item.uuid}`)}
                  >
                    <Text className="text-body04 text-black" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="text-body05 text-grey-60" numberOfLines={2}>
                      {item.previewContent}
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="flex-1 text-caption04 text-grey-30">
                        {formatDate(item.publishedAt)}
                      </Text>
                      <HeartIcon filled className="ms-3 text-blue-10" />
                      <Text className="ms-1 text-caption02 text-grey-40">{item.likeCount}</Text>
                      <ChatBubbleIcon className="ms-2 text-blue-10" />
                      <Text className="ms-1 text-caption02 text-grey-40">{item.commentCount}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                className="mb-7 mt-6"
              />
            </>
          )}
        </View>
      </View>
      <Footer withBottomInset />
    </ScrollView>
  );
}
