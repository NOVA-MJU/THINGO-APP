import {
  createBoardComment,
  createCommentReply,
  deleteBoard,
  deleteBoardComment,
  getBoardComments,
  getBoardDetail,
  toggleBoardLike,
  toggleCommentLike,
  type Board,
  type Comment,
} from '@/api/posts';
import { blockMember } from '@/api/members';
import { reportBoard, type ReportReason } from '@/api/reports';
import { Footer } from '@/components/footer';
import {
  ArrowLeftIcon,
  ChatBubbleIcon,
  CloseIcon,
  HeartIcon,
  MoreVerticalIcon,
  RadioIcon,
  XThinIcon,
} from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { PostContent } from '@/components/post-content';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/auth-context';
import { showAlert, showConfirm } from '@/lib/alert';
import { parseUTCDate } from '@/lib/utils';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { format } from 'date-fns';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { Keyboard, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path } from 'react-native-svg';

const COMMENT_MAX_LENGTH = 300;
const REPORT_ETC_MAX_LENGTH = 400;

export default function BoardDetailScreen() {
  const insets = useSafeAreaInsets();
  const { postId, boardCategory } = useLocalSearchParams<{
    postId?: string | string[];
    boardCategory?: string | string[];
  }>();

  const boardUUID = Array.isArray(postId) ? postId[0] : postId;
  const previousBoardCategory = Array.isArray(boardCategory) ? boardCategory[0] : boardCategory;
  const { user, isInitializing } = useAuth();
  const [board, setBoard] = React.useState<Board | null>(null);
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [commentText, setCommentText] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isBoardLoading, setIsBoardLoading] = React.useState(true);
  const [isCommentsLoading, setIsCommentsLoading] = React.useState(true);
  const [isLikePending, setIsLikePending] = React.useState(false);
  const [isCommentSubmitting, setIsCommentSubmitting] = React.useState(false);
  const [isBoardDeleting, setIsBoardDeleting] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = React.useState(false);
  const reportBottomSheetRef = React.useRef<BottomSheetModal>(null);
  const [selectedReportReasonId, setSelectedReportReasonId] = React.useState<ReportReason | null>(
    null
  );
  const [reportEtcText, setReportEtcText] = React.useState('');
  const [isReportSubmitting, setIsReportSubmitting] = React.useState(false);
  const [isBoardBlocking, setIsBoardBlocking] = React.useState(false);
  const [pendingCommentLikeUUIDs, setPendingCommentLikeUUIDs] = React.useState<string[]>([]);
  const [deletingCommentUUID, setDeletingCommentUUID] = React.useState<string | null>(null);
  const [activeReplyParentUUID, setActiveReplyParentUUID] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState('');
  const [replySubmittingParentUUID, setReplySubmittingParentUUID] = React.useState<string | null>(
    null
  );
  const loadBoard = React.useCallback(async () => {
    if (!boardUUID) {
      setErrorMessage('잘못된 게시글 주소입니다.');
      setIsBoardLoading(false);
      return;
    }

    setIsBoardLoading(true);
    setErrorMessage(null);

    try {
      const nextBoard = await getBoardDetail(boardUUID);
      setBoard(nextBoard);
    } catch {
      setErrorMessage('게시글을 불러오지 못했습니다.');
      setBoard(null);
    } finally {
      setIsBoardLoading(false);
    }
  }, [boardUUID]);

  const loadComments = React.useCallback(async () => {
    if (!boardUUID) return;

    setIsCommentsLoading(true);

    try {
      const nextComments = await getBoardComments(boardUUID);
      setComments(nextComments);
    } catch {
      setComments([]);
    } finally {
      setIsCommentsLoading(false);
    }
  }, [boardUUID]);

  useFocusEffect(
    React.useCallback(() => {
      if (isInitializing) return;
      void loadBoard();
      void loadComments();
    }, [isInitializing, loadBoard, loadComments])
  );

  const handlePostLikeClick = React.useCallback(async () => {
    if (!boardUUID || !board || isLikePending) return;

    if (!user) {
      router.push('/login');
      return;
    }

    const previousBoard = board;
    const nextLiked = !board.liked;

    setBoard({
      ...board,
      liked: nextLiked,
      likeCount: Math.max(0, board.likeCount + (nextLiked ? 1 : -1)),
    });
    setIsLikePending(true);

    try {
      await toggleBoardLike(boardUUID);
    } catch {
      setBoard(previousBoard);
      showAlert('좋아요 처리 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setIsLikePending(false);
    }
  }, [board, boardUUID, isLikePending, user]);

  const handleCommentSubmitClick = React.useCallback(async () => {
    if (!boardUUID) return;

    if (!user) {
      router.push('/login');
      return;
    }

    const nextComment = commentText.trim();
    if (!nextComment) {
      showAlert('댓글을 입력해주세요.');
      return;
    }

    setIsCommentSubmitting(true);

    try {
      const createdComment = await createBoardComment(boardUUID, { content: nextComment });

      setCommentText('');
      setComments((previousComments) => [...previousComments, createdComment]);
      setBoard((previousBoard) =>
        previousBoard
          ? {
              ...previousBoard,
              commentCount: previousBoard.commentCount + 1,
            }
          : previousBoard
      );
      Keyboard.dismiss();
    } catch {
      showAlert('댓글 작성 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setIsCommentSubmitting(false);
    }
  }, [boardUUID, commentText, user]);

  // 페이지 뒤로가기 버튼 동작
  // 새로고침, 직접 URL 접근 등으로 히스토리 스택이 없는 경우 GO_BACK 경고가 발생하므로
  // canGoBack()으로 확인 후 없으면 게시판 목록으로 이동
  function handleBackPress() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    if (Platform.OS === 'web') {
      router.replace({
        pathname: '/posts',
        params: {
          boardCategory: previousBoardCategory === 'free' ? 'free' : 'info',
        },
      });
    } else {
      router.replace({
        pathname: '/',
        params: {
          tab: 'board',
          boardCategory: previousBoardCategory === 'free' ? 'free' : 'info',
        },
      });
    }
  }

  // 수정 버튼 클릭 동작
  const handleEditPress = React.useCallback(() => {
    if (!boardUUID || !board?.canEdit) return;
    router.push(`/posts/edit/${boardUUID}`);
  }, [board?.canEdit, boardUUID]);

  // 게시글 신고 버튼 클릭
  function handleReportPress() {
    if (!user) {
      showConfirm(
        '로그인이 필요한 서비스입니다.',
        undefined,
        () => router.push('/login'),
        undefined,
        { confirmText: '로그인' }
      );
      return;
    }

    setSelectedReportReasonId(null);
    setReportEtcText('');
    reportBottomSheetRef.current?.present();
  }

  // 신고 바텀시트 닫기 버튼 클릭
  function handleReportSheetClose() {
    reportBottomSheetRef.current?.dismiss();
  }

  // 신고하기 버튼 클릭
  const handleReportSubmit = React.useCallback(async () => {
    const canSubmitReport =
      selectedReportReasonId === 'ETC'
        ? reportEtcText.trim().length > 0
        : selectedReportReasonId !== null;
    if (!boardUUID || !selectedReportReasonId || !canSubmitReport || isReportSubmitting) return;

    setIsReportSubmitting(true);

    try {
      await reportBoard(boardUUID, selectedReportReasonId, reportEtcText.trim());
      reportBottomSheetRef.current?.dismiss();
      showAlert('신고가 접수되었습니다.');
    } catch {
      showAlert('신고 접수 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setIsReportSubmitting(false);
    }
  }, [boardUUID, isReportSubmitting, reportEtcText, selectedReportReasonId]);

  // 사용자 차단 버튼 클릭
  function handleBlockPress() {
    if (!user) {
      showConfirm(
        '로그인이 필요한 서비스입니다.',
        undefined,
        () => router.push('/login'),
        undefined,
        { confirmText: '로그인' }
      );
      return;
    }

    setBlockDialogOpen(true);
  }

  // 차단 dialog 차단 확인 버튼 클릭
  const handleBlockConfirm = React.useCallback(async () => {
    if (!board?.authorUuid || isBoardBlocking) return;

    setIsBoardBlocking(true);

    try {
      await blockMember(board.authorUuid);
      setBlockDialogOpen(false);

      if (router.canGoBack()) {
        router.back();
      } else if (Platform.OS === 'web') {
        router.replace({
          pathname: '/posts',
          params: {
            boardCategory: previousBoardCategory === 'free' ? 'free' : 'info',
          },
        });
      } else {
        router.replace({
          pathname: '/',
          params: {
            tab: 'board',
            boardCategory: previousBoardCategory === 'free' ? 'free' : 'info',
          },
        });
      }
    } catch {
      showAlert('사용자 차단 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setIsBoardBlocking(false);
    }
  }, [board?.authorUuid, isBoardBlocking, previousBoardCategory]);

  // 게시글 삭제 버튼 클릭
  const handleBoardDeleteConfirm = React.useCallback(async () => {
    if (!boardUUID || !board?.canDelete || isBoardDeleting) return;

    setIsBoardDeleting(true);

    try {
      const nextBoardCategory = board.communityCategory === 'FREE' ? 'free' : 'info';

      await deleteBoard(boardUUID);
      setDeleteDialogOpen(false);

      if (Platform.OS === 'web') {
        router.dismissTo({
          pathname: '/posts',
          params: {
            boardCategory: previousBoardCategory === 'free' ? 'free' : nextBoardCategory,
            refreshBoards: String(Date.now()),
          },
        });
      } else {
        router.dismissTo({
          pathname: '/',
          params: {
            tab: 'board',
            boardCategory: previousBoardCategory === 'free' ? 'free' : nextBoardCategory,
            refreshBoards: String(Date.now()),
          },
        });
      }
    } catch {
      showAlert('게시글 삭제 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setIsBoardDeleting(false);
    }
  }, [
    board?.canDelete,
    board?.communityCategory,
    boardUUID,
    isBoardDeleting,
    previousBoardCategory,
  ]);

  // 댓글 좋아요 버튼 클릭
  const handleCommentLikeClick = React.useCallback(
    async (commentUUID: string) => {
      if (!boardUUID) return;

      if (!user) {
        router.push('/login');
        return;
      }

      if (pendingCommentLikeUUIDs.includes(commentUUID)) return;

      const previousComments = comments;

      setComments(
        updateCommentInTree(comments, commentUUID, (comment) => {
          const nextLiked = !comment.liked;

          return {
            ...comment,
            liked: nextLiked,
            likeCount: Math.max(0, comment.likeCount + (nextLiked ? 1 : -1)),
          };
        })
      );
      setPendingCommentLikeUUIDs((previousUUIDs) => [...previousUUIDs, commentUUID]);

      try {
        await toggleCommentLike(boardUUID, commentUUID);
      } catch {
        setComments(previousComments);
        showAlert('댓글 좋아요 처리 실패', '잠시 후 다시 시도해주세요.');
      } finally {
        setPendingCommentLikeUUIDs((previousUUIDs) =>
          previousUUIDs.filter((uuid) => uuid !== commentUUID)
        );
      }
    },
    [boardUUID, comments, pendingCommentLikeUUIDs, user]
  );

  const handleReplyToggleClick = React.useCallback(
    (commentUUID: string) => {
      if (!user) {
        router.push('/login');
        return;
      }

      setActiveReplyParentUUID((previousUUID) => {
        if (previousUUID === commentUUID) {
          setReplyText('');
          return null;
        }

        setReplyText('');
        return commentUUID;
      });
    },
    [user]
  );

  const handleReplySubmitClick = React.useCallback(async () => {
    if (!boardUUID || !user || !activeReplyParentUUID || replySubmittingParentUUID) return;

    const nextReply = replyText.trim();
    if (!nextReply) {
      showAlert('대댓글을 입력해주세요.');
      return;
    }

    setReplySubmittingParentUUID(activeReplyParentUUID);

    try {
      await createCommentReply(boardUUID, activeReplyParentUUID, { content: nextReply });

      const [nextBoard, nextComments] = await Promise.all([
        getBoardDetail(boardUUID),
        getBoardComments(boardUUID),
      ]);

      setBoard(nextBoard);
      setComments(nextComments);
      setReplyText('');
      setActiveReplyParentUUID(null);
      Keyboard.dismiss();
    } catch {
      showAlert('대댓글 작성 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setReplySubmittingParentUUID(null);
    }
  }, [activeReplyParentUUID, boardUUID, replySubmittingParentUUID, replyText, user]);

  const handleCommentDeleteClick = React.useCallback(
    async (commentUUID: string) => {
      if (!boardUUID || !user || deletingCommentUUID) return;

      setDeletingCommentUUID(commentUUID);

      try {
        await deleteBoardComment(commentUUID);

        const [nextBoard, nextComments] = await Promise.all([
          getBoardDetail(boardUUID),
          getBoardComments(boardUUID),
        ]);

        setBoard(nextBoard);
        setComments(nextComments);
      } catch {
        showAlert('댓글 삭제 실패', '잠시 후 다시 시도해주세요.');
      } finally {
        setDeletingCommentUUID(null);
      }
    },
    [boardUUID, deletingCommentUUID, user]
  );

  if (!board && !isBoardLoading) {
    return (
      <ErrorState
        topInset={insets.top}
        bottomInset={insets.bottom}
        message={errorMessage ?? '게시글을 불러오지 못했습니다.'}
        onRetry={() => {
          void loadBoard();
          void loadComments();
        }}
      />
    );
  }

  return (
    <>
      <ScrollView
        className="bg-white"
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top }}
      >
        <View className="flex-1 justify-between bg-white">
          <View>
            <View className="h-[60px] flex-row items-center justify-between border-b border-grey-02 px-4">
              {/* 뒤로가기 버튼 */}
              <TouchableOpacity
                onPress={handleBackPress}
                className="flex-row items-center gap-1"
                hitSlop={4}
              >
                <ArrowLeftIcon className="text-black" size={20} />
                <Text className="text-black text-body03">이전</Text>
              </TouchableOpacity>

              {/* 신고, 차단 더보기 버튼 (내가 작성한 게시글은 표시하지 않음) */}
              {board?.authorUuid !== user?.uuid ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <TouchableOpacity hitSlop={4}>
                      <MoreVerticalIcon size={20} className="text-grey-30" />
                    </TouchableOpacity>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onPress={handleReportPress}>
                      <Text className="px-2 py-1 text-grey-30 text-caption02">신고</Text>
                    </DropdownMenuItem>
                    <DropdownMenuItem onPress={handleBlockPress}>
                      <Text className="px-2 py-1 text-grey-30 text-caption02">차단</Text>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </View>

            {/* 본문 */}
            {isBoardLoading || !board ? (
              <View className="py-5">
                <View className="gap-2 px-4">
                  <Skeleton className="h-5 w-3/4 rounded" />
                  <View className="flex-row items-center gap-3">
                    <Skeleton className="h-4 w-20 rounded" />
                    <Skeleton className="h-4 w-16 rounded" />
                  </View>
                </View>
                <View className="mt-4 gap-2 px-4">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-5/6 rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-2/3 rounded" />
                </View>
              </View>
            ) : (
              <View className="pt-5">
                <View className="gap-1 px-4">
                  {/* 컨텐츠 제목 */}
                  <Text className="text-black text-body02">{board.title}</Text>

                  <View className="flex-row items-center justify-between gap-4">
                    <View className="flex-row items-center gap-3">
                      <Text className="text-grey-40 text-body05">{formatBoardDate(board)}</Text>
                      <Svg width="1" height="16" viewBox="0 0 1 16" fill="none">
                        <Line x1="0.5" x2="0.5" y2="16" stroke="#AEB2B6" />
                      </Svg>
                      <Text className="text-grey-40 text-body05">{board.author}</Text>
                    </View>

                    <View className="flex-row items-center">
                      <HeartIcon size={24} filled={board.liked} className="text-blue-20" />
                      <Text className="text-grey-40 text-body05">{board.likeCount}</Text>
                      <Svg width="1" height="16" viewBox="0 0 1 16" fill="none" className="ms-2">
                        <Line x1="0.5" x2="0.5" y2="16" stroke="#AEB2B6" />
                      </Svg>
                      <ChatBubbleIcon size={24} className="ms-1.5 text-blue-20" />
                      <Text className="text-grey-40 text-body05">{board.commentCount}</Text>
                    </View>
                  </View>
                </View>

                {/* 컨텐츠 본문 */}
                <View className="px-4 pt-5">
                  <PostContent content={board.content || board.previewContent} />
                </View>

                {/* 좋아요 버튼 */}
                <View className="flex-row items-center justify-between p-5">
                  <TouchableOpacity
                    onPress={() => void handlePostLikeClick()}
                    className="flex-row items-center self-start"
                    disabled={isLikePending}
                  >
                    <Text className="text-grey-40 text-body04">
                      {isLikePending ? '처리 중...' : '좋아요'}
                    </Text>
                    <HeartIcon
                      filled={board.liked}
                      className={
                        board.liked ? 'text-blue-20' : user ? 'text-blue-10' : 'text-grey-20'
                      }
                    />
                  </TouchableOpacity>

                  {board.canEdit || board.canDelete ? (
                    <View className="flex-row items-center gap-5">
                      {board.canEdit ? (
                        <TouchableOpacity onPress={handleEditPress}>
                          <Text className="text-grey-40 text-body05">수정</Text>
                        </TouchableOpacity>
                      ) : null}
                      {board.canDelete ? (
                        <TouchableOpacity onPress={() => setDeleteDialogOpen(true)}>
                          <Text className="text-grey-40 text-body05">삭제</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>
            )}

            <View className="h-[1px] bg-grey-02" />

            {/* 댓글 */}
            <View className="px-4 pt-5">
              <Text className="mb-2 text-black text-body02">댓글</Text>

              {isCommentsLoading ? (
                <View className="mt-2 gap-5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <View key={i} className="gap-[10px]">
                      <View className="flex-row items-start gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <View className="flex-1 gap-0.5 pt-1">
                          <Skeleton className="h-4 w-24 rounded" />
                          <Skeleton className="h-3 w-16 rounded" />
                        </View>
                      </View>
                      <Skeleton className="h-4 w-full rounded" />
                      <Skeleton className="h-4 w-3/4 rounded" />
                    </View>
                  ))}
                </View>
              ) : user ? (
                <>
                  <CommentComposer
                    value={commentText}
                    isSubmitting={isCommentSubmitting}
                    onChange={setCommentText}
                    onSubmit={() => void handleCommentSubmitClick()}
                  />

                  {comments.length > 0 ? (
                    <View className="mt-4 gap-5">
                      {comments.map((comment) => (
                        <CommentThread
                          key={comment.commentUUID}
                          comment={comment}
                          currentUserNickname={user.nickname}
                          deletingCommentUUID={deletingCommentUUID}
                          activeReplyParentUUID={activeReplyParentUUID}
                          pendingCommentLikeUUIDs={pendingCommentLikeUUIDs}
                          replyText={replyText}
                          replySubmittingParentUUID={replySubmittingParentUUID}
                          onCommentLikeToggle={handleCommentLikeClick}
                          onDelete={handleCommentDeleteClick}
                          onReplyToggle={handleReplyToggleClick}
                          onReplyTextChange={setReplyText}
                          onReplySubmit={() => void handleReplySubmitClick()}
                        />
                      ))}
                    </View>
                  ) : null}
                </>
              ) : (
                <View className="gap-[14px]">
                  <View className="h-[129px] items-center justify-center rounded-[4px] border border-grey-10 bg-white px-4">
                    <Text className="text-center text-grey-30 text-body05">
                      로그인 후 이용 가능합니다.
                    </Text>
                  </View>
                  <Button
                    onPress={() => router.push('/login')}
                    className="h-[48px] rounded-[8px] bg-blue-35"
                  >
                    <Text className="text-white">Thingo 로그인하기</Text>
                  </Button>
                </View>
              )}
            </View>
          </View>

          <Footer withBottomInset className="mt-7" />
        </View>

        {/* 게시글 삭제 확인 창 */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="mx-6 w-[320px] max-w-[320px] gap-4 rounded-xl border-none py-[24px]">
            <DialogHeader className="gap-1">
              <DialogTitle className="text-center text-black text-body03">
                게시글을 삭제하시겠습니까?
              </DialogTitle>
              <DialogDescription className="text-center text-grey-80 text-body06">
                삭제한 게시글과 댓글은 복구할 수 없습니다.
              </DialogDescription>
            </DialogHeader>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setDeleteDialogOpen(false)}
                className="h-[36px] flex-1 items-center justify-center rounded-xl bg-grey-10"
                disabled={isBoardDeleting}
              >
                <Text className="text-black text-body06">취소</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => void handleBoardDeleteConfirm()}
                className="h-[36px] flex-1 items-center justify-center rounded-xl bg-error"
                disabled={isBoardDeleting}
              >
                <Text className="text-white text-body06">
                  {isBoardDeleting ? '삭제 중...' : '삭제'}
                </Text>
              </TouchableOpacity>
            </View>
          </DialogContent>
        </Dialog>

        {/* 사용자 차단 확인 창 */}
        <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
          <DialogContent showCloseButton={false} className="min-w-80 p-5">
            <View className="gap-4">
              <View>
                <DialogTitle className="text-center leading-normal text-grey-80 text-body04">
                  {`'${board?.author}' 차단하시겠어요?`}
                </DialogTitle>
                <Text className="text-center text-grey-80 text-caption02">
                  {
                    '차단하면 이 사용자가 작성한 모든 게시판 글과\n댓글, 명지도 리뷰가 즉시 숨겨집니다.'
                  }
                </Text>
                <Text className="text-center text-grey-40 text-caption04">
                  (상대방에게는 차단 사실을 알리지 않아요.)
                </Text>
              </View>
              <View className="flex-row gap-2">
                <Button
                  className="h-9 flex-1 py-0"
                  variant="outline"
                  onPress={() => setBlockDialogOpen(false)}
                  disabled={isBoardBlocking}
                >
                  <Text>취소</Text>
                </Button>
                <Button
                  className="h-9 flex-1 py-0"
                  onPress={handleBlockConfirm}
                  disabled={isBoardBlocking}
                >
                  <Text>{isBoardBlocking ? '차단 중...' : '차단'}</Text>
                </Button>
              </View>
            </View>
          </DialogContent>
        </Dialog>
      </ScrollView>

      {/* 게시글 신고 바텀시트 */}
      <BottomSheetModal
        ref={reportBottomSheetRef}
        snapPoints={['70%']}
        enableDynamicSizing={false}
        backdropComponent={ReportBottomSheetBackdrop}
        enableContentPanningGesture={false}
      >
        <BottomSheetScrollView contentContainerClassName="pb-4">
          <View className="items-end px-4">
            <TouchableOpacity onPress={handleReportSheetClose} hitSlop={4}>
              <XThinIcon size={24} className="text-grey-30" />
            </TouchableOpacity>
          </View>
          <View className="mt-[18px] flex-row items-center gap-1 px-4">
            <Text className="text-grey-80 text-body02">신고 사유를 알려주세요.</Text>
            <Text className="text-error text-body02">*</Text>
          </View>

          <TouchableOpacity
            className="mt-[18px] flex-row items-start gap-1.5 px-4"
            onPress={() => setSelectedReportReasonId('COMMERCIAL_AD')}
          >
            <RadioIcon size={20} checked={selectedReportReasonId === 'COMMERCIAL_AD'} />
            <View className="flex-1 gap-1">
              <Text className="text-grey-60 text-body05">상업적 광고 및 홍보성</Text>
              <Text className="text-grey-40 text-caption02">
                영리 목적의 홍보·판매, 타 서비스나 사이트 가입 유도
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-[18px] flex-row items-start gap-1.5 px-4"
            onPress={() => setSelectedReportReasonId('INAPPROPRIATE')}
          >
            <RadioIcon size={20} checked={selectedReportReasonId === 'INAPPROPRIATE'} />
            <View className="flex-1 gap-1">
              <Text className="text-grey-60 text-body05">주제 및 서비스 성격에 부적절함</Text>
              <Text className="text-grey-40 text-caption02">
                게시판 주제나 장소와 무관한 내용, 무의미한 초성·도배·낚시
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-[18px] flex-row items-start gap-1.5 px-4"
            onPress={() => setSelectedReportReasonId('ABUSE')}
          >
            <RadioIcon size={20} checked={selectedReportReasonId === 'ABUSE'} />
            <View className="flex-1 gap-1">
              <Text className="text-grey-60 text-body05">욕설/비하/인신공격</Text>
              <Text className="text-grey-40 text-caption02">
                특정인이나 단체에 대한 비방, 명예훼손, 학우 간 분란 조장
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-[18px] flex-row items-start gap-1.5 px-4"
            onPress={() => setSelectedReportReasonId('OBSCENE')}
          >
            <RadioIcon size={20} checked={selectedReportReasonId === 'OBSCENE'} />
            <View className="flex-1 gap-1">
              <Text className="text-grey-60 text-body05">음란성/불건전한 내용</Text>
              <Text className="text-grey-40 text-caption02">
                선정적인 내용, 불건전한 만남 유도, 불법촬영물 등 유통
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-[18px] flex-row items-start gap-1.5 px-4"
            onPress={() => setSelectedReportReasonId('PRIVACY_SCAM')}
          >
            <RadioIcon size={20} checked={selectedReportReasonId === 'PRIVACY_SCAM'} />
            <View className="flex-1 gap-1">
              <Text className="text-grey-60 text-body05">개인정보 노출 및 사칭/사기</Text>
              <Text className="text-grey-40 text-caption02">
                개인 실명·연락처·SNS ID 노출, 관리자 사칭, 사기 의심
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-[18px] flex-row items-start gap-1.5 px-4"
            onPress={() => setSelectedReportReasonId('ETC')}
          >
            <RadioIcon size={20} checked={selectedReportReasonId === 'ETC'} />
            <View className="flex-1 gap-1">
              <Text className="text-grey-60 text-body05">기타</Text>
            </View>
          </TouchableOpacity>

          <View className="mt-2 px-4">
            <View className="rounded-[8px] border border-grey-10 px-3 py-2.5">
              <TextInput
                multiline
                textAlignVertical="top"
                className="h-[96px] py-0 font-pretendard text-black text-body05"
                value={reportEtcText}
                onChangeText={setReportEtcText}
                placeholder="신고 사유를 입력해주세요."
                placeholderTextColor="#909499"
                maxLength={REPORT_ETC_MAX_LENGTH}
              />
              <Text className="text-right text-grey-40 text-caption02">
                {reportEtcText.length}/{REPORT_ETC_MAX_LENGTH}
              </Text>
            </View>
          </View>
        </BottomSheetScrollView>

        <View className="mt-4 px-4" style={{ paddingBottom: insets.bottom }}>
          <Button
            onPress={() => void handleReportSubmit()}
            disabled={
              isReportSubmitting ||
              (selectedReportReasonId === 'ETC'
                ? reportEtcText.trim().length === 0
                : selectedReportReasonId === null)
            }
          >
            <Text className="text-white">{isReportSubmitting ? '신고 중...' : '신고하기'}</Text>
          </Button>
        </View>
      </BottomSheetModal>
    </>
  );
}

function ReportBottomSheetBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      pressBehavior="close"
    />
  );
}

function ErrorState({
  topInset,
  bottomInset,
  message,
  onRetry,
}: {
  topInset: number;
  bottomInset: number;
  message: string;
  onRetry: () => void;
}) {
  return (
    <View className="flex-1 bg-white" style={{ paddingTop: topInset }}>
      <View className="flex-1 items-center justify-center gap-4 px-4">
        <Text className="text-center text-black text-body04">{message}</Text>
        <Button onPress={onRetry} className="rounded-xl px-5">
          <Text>다시 시도</Text>
        </Button>
      </View>
    </View>
  );
}

function CommentComposer({
  value,
  isSubmitting,
  onChange,
  onSubmit,
  placeholder = '댓글을 작성해주세요.',
}: {
  value: string;
  isSubmitting: boolean;
  onChange: (nextValue: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}) {
  const trimmedValue = value.trim();

  return (
    <View className="gap-2">
      <View className="relative rounded-[8px] bg-grey-02 px-3 py-2.5">
        <TextInput
          multiline
          textAlignVertical="center"
          className="max-h-[84px] min-h-[21px] py-0 pe-10 font-pretendard text-black text-body05"
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#909499"
          maxLength={COMMENT_MAX_LENGTH}
        />

        <TouchableOpacity
          onPress={onSubmit}
          className="absolute right-3 top-[8px]"
          disabled={!trimmedValue || isSubmitting}
        >
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Circle
              cx="12"
              cy="12"
              r="12"
              fill={trimmedValue && !isSubmitting ? '#8BC7FF' : '#CDD0D4'}
            />
            <Path
              d="M17.993 11.0312C18.2782 11.3198 18.2782 11.7877 17.993 12.0764C17.7079 12.365 17.2456 12.365 16.9604 12.0764L12.7302 7.79445V18.2946C12.7302 18.7029 12.4033 19.0338 12 19.0338C11.5967 19.0338 11.2698 18.7029 11.2698 18.2946V7.79445L7.03956 12.0764C6.7544 12.365 6.29215 12.365 6.00697 12.0764C5.7218 11.7877 5.7218 11.3198 6.00697 11.0312L12 4.96484L17.993 11.0312Z"
              fill="white"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      <Text className="text-right text-grey-40 text-caption02">
        {value.length}/{COMMENT_MAX_LENGTH}
      </Text>
    </View>
  );
}

function CommentThread({
  comment,
  depth = 0,
  isInReplyLane = false,
  currentUserNickname,
  deletingCommentUUID,
  activeReplyParentUUID,
  pendingCommentLikeUUIDs,
  replyText,
  replySubmittingParentUUID,
  onCommentLikeToggle,
  onDelete,
  onReplyToggle,
  onReplyTextChange,
  onReplySubmit,
}: {
  comment: Comment;
  depth?: number;
  isInReplyLane?: boolean;
  currentUserNickname?: string;
  deletingCommentUUID: string | null;
  activeReplyParentUUID: string | null;
  pendingCommentLikeUUIDs: string[];
  replyText: string;
  replySubmittingParentUUID: string | null;
  onCommentLikeToggle: (commentUUID: string) => void;
  onDelete: (commentUUID: string) => void;
  onReplyToggle: (commentUUID: string) => void;
  onReplyTextChange: (nextValue: string) => void;
  onReplySubmit: () => void;
}) {
  const hasReplies = comment.replies.length > 0;
  const canDelete = currentUserNickname === comment.nickname;
  const isDeleting = deletingCommentUUID === comment.commentUUID;
  const isReplyComposerOpen = activeReplyParentUUID === comment.commentUUID;
  const isReplySubmitting = replySubmittingParentUUID === comment.commentUUID;
  const isCommentLikePending = pendingCommentLikeUUIDs.includes(comment.commentUUID);
  const shouldRenderInlineReplyComposer = isInReplyLane && isReplyComposerOpen && !hasReplies;
  const shouldRenderReplyLane =
    hasReplies || (isReplyComposerOpen && !shouldRenderInlineReplyComposer);

  return (
    <View className="gap-4">
      <View className="gap-[10px]">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 flex-row items-start gap-3">
            <CommentAvatar nickname={comment.nickname} />

            <View className="flex-1 gap-0.5 pt-1">
              <Text className="text-black text-body04">{comment.nickname}</Text>
              <Text className="text-grey-30 text-caption02">
                {formatCommentDate(comment.createdAt)}
              </Text>
            </View>
          </View>

          {canDelete ? (
            <TouchableOpacity
              onPress={() => onDelete(comment.commentUUID)}
              className="pt-1"
              disabled={isDeleting}
            >
              <CloseIcon size={24} className={isDeleting ? 'text-grey-20' : 'text-[#CDD0D4]'} />
            </TouchableOpacity>
          ) : null}
        </View>

        <Text className="leading-[21px] text-black text-body05">{comment.content}</Text>

        <View className="flex-row items-center gap-1">
          <TouchableOpacity
            onPress={() => onCommentLikeToggle(comment.commentUUID)}
            className="flex-row items-center gap-1"
            disabled={isCommentLikePending}
          >
            <HeartIcon
              size={20}
              filled={comment.liked}
              className={comment.liked ? 'text-blue-20' : 'text-blue-15'}
            />
            <Text
              className={
                isCommentLikePending
                  ? 'min-w-[14px] text-grey-30 text-caption02'
                  : 'min-w-[14px] text-grey-40 text-caption02'
              }
            >
              {comment.likeCount}
            </Text>
          </TouchableOpacity>
          <Svg width="1" height="16" viewBox="0 0 1 16" fill="none" className="mx-1">
            <Line x1="0.5" y1="0" x2="0.5" y2="16" stroke="#AEB2B6" />
          </Svg>
          <TouchableOpacity
            onPress={() => onReplyToggle(comment.commentUUID)}
            className="flex-row items-center gap-1"
          >
            <ChatBubbleIcon
              size={20}
              className={isReplyComposerOpen ? 'text-blue-20' : 'text-blue-15'}
            />
            <Text
              className={
                isReplyComposerOpen
                  ? 'min-w-[14px] text-blue-20 text-caption02'
                  : 'min-w-[14px] text-grey-40 text-caption02'
              }
            >
              {comment.replies.length}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {shouldRenderInlineReplyComposer ? (
        <CommentComposer
          value={replyText}
          isSubmitting={isReplySubmitting}
          onChange={onReplyTextChange}
          onSubmit={onReplySubmit}
          placeholder="답글을 작성해주세요."
        />
      ) : null}

      {shouldRenderReplyLane ? (
        <View className="border-l-2 border-blue-20 pl-[10px]">
          <View className="gap-4">
            {hasReplies
              ? comment.replies.map((reply) => (
                  <CommentThread
                    key={reply.commentUUID}
                    comment={reply}
                    depth={depth + 1}
                    isInReplyLane
                    currentUserNickname={currentUserNickname}
                    deletingCommentUUID={deletingCommentUUID}
                    activeReplyParentUUID={activeReplyParentUUID}
                    pendingCommentLikeUUIDs={pendingCommentLikeUUIDs}
                    replyText={replyText}
                    replySubmittingParentUUID={replySubmittingParentUUID}
                    onCommentLikeToggle={onCommentLikeToggle}
                    onDelete={onDelete}
                    onReplyToggle={onReplyToggle}
                    onReplyTextChange={onReplyTextChange}
                    onReplySubmit={onReplySubmit}
                  />
                ))
              : null}

            {isReplyComposerOpen ? (
              <CommentComposer
                value={replyText}
                isSubmitting={isReplySubmitting}
                onChange={onReplyTextChange}
                onSubmit={onReplySubmit}
                placeholder="답글을 작성해주세요."
              />
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function CommentAvatar({ nickname }: { nickname: string }) {
  return (
    <View className="h-10 w-10 rounded-full bg-grey-20" accessibilityLabel={`${nickname} 프로필`} />
  );
}

function updateCommentInTree(
  comments: Comment[],
  targetCommentUUID: string,
  updater: (comment: Comment) => Comment
): Comment[] {
  return comments.map((comment) => {
    if (comment.commentUUID === targetCommentUUID) {
      return updater(comment);
    }

    if (comment.replies.length === 0) {
      return comment;
    }

    return {
      ...comment,
      replies: updateCommentInTree(comment.replies, targetCommentUUID, updater),
    };
  });
}

function formatBoardDate(board: Board) {
  const baseDate = board.publishedAt ?? board.createdAt;
  return format(parseUTCDate(baseDate), 'yyyy.MM.dd HH:mm');
}

function formatCommentDate(createdAt: string) {
  return format(parseUTCDate(createdAt), 'yyyy.MM.dd HH:mm');
}
