import { getMyCommentedPosts, type MyCommentedPost } from '@/api/members';
import { Footer } from '@/components/footer';
import { ChatBubbleIcon } from '@/components/icons';
import { Pagination } from '@/components/ui/pagination';
import { Text } from '@/components/ui/text';
import { router } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';

const ITEMS_PER_PAGE = 10;

export default function MyCommentsScreen() {
  const scrollRef = React.useRef<ScrollView>(null);
  const [items, setItems] = React.useState<MyCommentedPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    getMyCommentedPosts()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  // 상단으로 스크롤
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentPage]);

  // 서버에서 페이지네이션 응답을 안줘서 직접 구현
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const pagedItems = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [items, currentPage]);

  return (
    <ScrollView ref={scrollRef} className="flex-1 bg-grey-02" contentContainerClassName="flex-grow">
      <View className="flex-1">
        <View className="px-4 py-5">
          <Text className="text-title01 text-black">내가 작성한 댓글</Text>
          <Text className="mt-1 text-body05 text-grey-40">총 {DUMMY.length}개</Text>
        </View>

        <View className="flex-1">
          {loading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator />
            </View>
          ) : pagedItems.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-body05 text-black">작성한 댓글이 없습니다.</Text>
            </View>
          ) : (
            <>
              <View className="gap-2 px-4">
                {pagedItems.map((item, index) => (
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
      <Footer withBottomInset />
    </ScrollView>
  );
}

const DUMMY: MyCommentedPost[] = Array.from({ length: 18 }, (_, i) => ({
  boardUuid: `board-${i + 1}`,
  boardTitle: [
    '도서관 스터디룸 같이 쓸 사람 구합니다',
    '오늘 학식 메뉴 진짜 너무 맛있었음',
    '교내 소프트웨어 무료 라이선스 신청 방법',
    '2025학년도 1학기 수강편람 배포 안내',
    '졸업 요건 확인 방법 및 신청 절차 총정리',
  ][i % 5],
  boardPreviewContent: [
    '같이 스터디룸 사용할 분 계신가요? 오전 10시~오후 1시 사이에 쓸 예정입니다.',
    '오늘 점심 돈까스 진짜 맛있었는데 혹시 다들 드셨나요? 내일도 나왔으면 좋겠다.',
    '학교 포털 로그인 후 소프트웨어 신청 메뉴에서 신청하시면 됩니다. 어도비 포함.',
    '수강편람이 학교 홈페이지에 올라왔습니다. 다들 확인해보세요.',
    '졸업 요건은 학과마다 다르니 반드시 학과 사무실에 문의하세요.',
  ][i % 5],
  commentUuid: `comment-${i + 1}`,
  commentPreviewContent: [
    '저도 같이 쓰고 싶어요! 연락 주세요.',
    '진짜 맛있었죠 ㅠㅠ 저도 줄 서서 먹었어요.',
    '신청했는데 바로 됐어요, 감사합니다!',
    '혹시 전공필수 수강편람도 올라왔나요?',
    '학과 사무실 전화 연결이 안 되던데 이메일로 문의해도 될까요?',
  ][i % 5],
}));
