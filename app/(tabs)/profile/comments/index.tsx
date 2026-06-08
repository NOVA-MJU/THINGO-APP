import { getMyCommentedPosts, type MyCommentedPost } from '@/api/members';
import { AppHeader } from '@/components/app-header';
import { Footer } from '@/components/footer';
import { ChatBubbleIcon } from '@/components/icons';
import { Pagination } from '@/components/ui/pagination';
import { Text } from '@/components/ui/text';
import { router } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MyCommentsScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = React.useRef<ScrollView>(null);
  const [items, setItems] = React.useState<MyCommentedPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalElements, setTotalElements] = React.useState(0);

  React.useEffect(() => {
    setLoading(true);
    getMyCommentedPosts(currentPage - 1)
      .then(({ items, totalPages, totalElements }) => {
        setItems(items);
        setTotalPages(Math.max(1, totalPages));
        setTotalElements(totalElements);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [currentPage]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentPage]);

  return (
    <View className="flex-1">
      <View style={{ paddingTop: insets.top }} className="bg-white">
        <AppHeader title="내가 작성한 댓글" />
      </View>
      <ScrollView
        ref={scrollRef}
        className="flex-1 bg-grey-02"
        contentContainerClassName="flex-grow"
      >
        <View className="flex-1">
          <View className="px-4 py-5">
            <Text className="text-title01 text-black">내가 작성한 댓글</Text>
            <Text className="mt-1 text-body05 text-grey-40">총 {totalElements}개</Text>
          </View>

          <View className="flex-1">
            {loading ? (
              <View className="flex-1 items-center justify-center py-20">
                <ActivityIndicator />
              </View>
            ) : items.length === 0 ? (
              <View className="flex-1 items-center justify-center py-20">
                <Text className="text-body05 text-black">작성한 댓글이 없습니다.</Text>
              </View>
            ) : (
              <>
                <View className="gap-2 px-4">
                  {items.map((item) => (
                    <TouchableOpacity
                      key={item.commentUuid}
                      className="rounded-xl bg-white px-4 pb-3 pt-4"
                      onPress={() => router.push(`/posts/${item.boardUuid}`)}
                    >
                      <Text className="text-body04 text-black" numberOfLines={1}>
                        {item.boardTitle}
                      </Text>
                      <Text className="mt-1 text-body05 text-grey-60" numberOfLines={2}>
                        {item.boardPreviewContent}
                      </Text>
                      <View className="mt-3 flex-row items-start gap-2 rounded-lg bg-grey-02 px-3 py-2">
                        <ChatBubbleIcon size={18} className="mt-0.5 shrink-0 text-grey-40" />
                        <Text className="flex-1 text-body05 text-grey-60" numberOfLines={2}>
                          {item.commentPreviewContent}
                        </Text>
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
        <Footer />
      </ScrollView>
    </View>
  );
}
