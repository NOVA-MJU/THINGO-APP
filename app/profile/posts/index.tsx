import { getMyPosts, type MyPost } from '@/api/members';
import { Footer } from '@/components/footer';
import { ChatBubbleIcon, HeartIcon } from '@/components/icons';
import { Pagination } from '@/components/ui/pagination';
import { Text } from '@/components/ui/text';
import { router } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

export default function MyPostsScreen() {
  const scrollRef = React.useRef<ScrollView>(null);
  const [posts, setPosts] = React.useState<MyPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalElements, setTotalElements] = React.useState(0);

  React.useEffect(() => {
    setLoading(true);
    getMyPosts(currentPage - 1)
      .then(({ posts, totalPages, totalElements }) => {
        setPosts(posts);
        setTotalPages(Math.max(1, totalPages));
        setTotalElements(totalElements);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [currentPage]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentPage]);

  return (
    <ScrollView ref={scrollRef} className="flex-1 bg-grey-02" contentContainerClassName="flex-grow">
      <View className="flex-1">
        <View className="px-4 py-5">
          <Text className="text-title01 text-black">내가 작성한 게시물</Text>
          <Text className="mt-1 text-body05 text-grey-40">총 {totalElements}개</Text>
        </View>

        <View className="relative flex-1">
          {loading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator />
            </View>
          ) : posts.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-body05 text-black">작성한 게시물이 없습니다.</Text>
            </View>
          ) : (
            <>
              <View className="gap-2 px-4">
                {posts.map((item) => (
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
                      <HeartIcon className="ms-3 text-blue-10" />
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
