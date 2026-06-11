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
import { Footer } from '@/components/footer';
import { ArrowLeftIcon, ChatBubbleIcon, CloseIcon, HeartIcon } from '@/components/icons';
import { PostContent } from '@/components/post-content';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/auth-context';
import { showAlert } from '@/lib/alert';
import { parseUTCDate } from '@/lib/utils';
import { format } from 'date-fns';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path } from 'react-native-svg';

const COMMENT_MAX_LENGTH = 300;

export default function BoardDetailScreen() {
  const insets = useSafeAreaInsets();
  const { postId, fromEdit, fromCreate, boardCategory } = useLocalSearchParams<{
    postId?: string | string[];
    fromEdit?: string | string[];
    fromCreate?: string | string[];
    boardCategory?: string | string[];
  }>();

  const boardUUID = Array.isArray(postId) ? postId[0] : postId;
  const isFromEdit = (Array.isArray(fromEdit) ? fromEdit[0] : fromEdit) === 'true';
  const isFromCreate = (Array.isArray(fromCreate) ? fromCreate[0] : fromCreate) === 'true';
  const previousBoardCategory = Array.isArray(boardCategory) ? boardCategory[0] : boardCategory;
  const { user, isInitializing } = useAuth();
  const [board, setBoard] = React.useState<Board | null>(null);
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [commentText, setCommentText] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLikePending, setIsLikePending] = React.useState(false);
  const [isCommentSubmitting, setIsCommentSubmitting] = React.useState(false);
  const [isBoardDeleting, setIsBoardDeleting] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [pendingCommentLikeUUIDs, setPendingCommentLikeUUIDs] = React.useState<string[]>([]);
  const [deletingCommentUUID, setDeletingCommentUUID] = React.useState<string | null>(null);
  const [activeReplyParentUUID, setActiveReplyParentUUID] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState('');
  const [replySubmittingParentUUID, setReplySubmittingParentUUID] = React.useState<string | null>(
    null
  );

  const loadBoardData = React.useCallback(async () => {
    if (!boardUUID) {
      setErrorMessage('잘못된 게시글 주소입니다.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [nextBoard, nextComments] = await Promise.all([
        getBoardDetail(boardUUID),
        getBoardComments(boardUUID),
      ]);

      setBoard(nextBoard);
      setComments(nextComments);
    } catch {
      setErrorMessage('게시글을 불러오지 못했습니다.');
      setBoard(null);
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  }, [boardUUID]);

  useFocusEffect(
    React.useCallback(() => {
      if (isInitializing) return;
      void loadBoardData();
    }, [isInitializing, loadBoardData])
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

  const handleLoginPress = React.useCallback(() => {
    router.push('/login');
  }, []);

  const handleBackPress = React.useCallback(() => {
    if (isFromEdit || isFromCreate) {
      router.replace({
        pathname: '/',
        params: {
          tab: 'board',
          boardCategory: previousBoardCategory === 'free' ? 'free' : 'info',
          refreshBoards: String(Date.now()),
        },
      });
      return;
    }

    router.back();
  }, [isFromCreate, isFromEdit, previousBoardCategory]);

  const handleEditPress = React.useCallback(() => {
    if (!boardUUID || !board?.canEdit) return;
    router.push(`/posts/edit/${boardUUID}`);
  }, [board?.canEdit, boardUUID]);

  const handleBoardDeleteConfirm = React.useCallback(async () => {
    if (!boardUUID || !board?.canDelete || isBoardDeleting) return;

    setIsBoardDeleting(true);

    try {
      const nextBoardCategory = board.communityCategory === 'FREE' ? 'free' : 'info';

      await deleteBoard(boardUUID);
      setDeleteDialogOpen(false);

      router.replace({
        pathname: '/',
        params: {
          tab: 'board',
          boardCategory: previousBoardCategory === 'free' ? 'free' : nextBoardCategory,
          refreshBoards: String(Date.now()),
        },
      });
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

  if (isInitializing || (isLoading && !board)) {
    return <LoadingState topInset={insets.top} bottomInset={insets.bottom} />;
  }

  if (!board || errorMessage) {
    return (
      <ErrorState
        topInset={insets.top}
        bottomInset={insets.bottom}
        message={errorMessage ?? '게시글을 불러오지 못했습니다.'}
        onRetry={() => void loadBoardData()}
      />
    );
  }

  return (
    <ScrollView
      className="bg-white"
      contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top }}
    >
      <View className="flex-1 justify-between bg-white">
        <View>
          <View className="border-b border-grey-02 px-4 pb-4 pt-5">
            <TouchableOpacity
              onPress={handleBackPress}
              className="flex-row items-center gap-1 self-start"
            >
              <ArrowLeftIcon className="text-black" />
              <Text className="text-body03 text-black">이전</Text>
            </TouchableOpacity>
          </View>

          <View className="py-5">
            <View className="gap-1 px-4">
              <Text className="text-body02 text-black">{board.title}</Text>

              <View className="flex-row items-center justify-between gap-4">
                <View className="flex-row items-center gap-3">
                  <Text className="text-body05 text-grey-40">{formatBoardDate(board)}</Text>
                  <Svg width="1" height="16" viewBox="0 0 1 16" fill="none">
                    <Line x1="0.5" x2="0.5" y2="16" stroke="#AEB2B6" />
                  </Svg>
                  <Text className="text-body05 text-grey-40">{board.author}</Text>
                </View>

                <View className="flex-row items-center">
                  <HeartIcon size={24} filled={board.liked} className="text-blue-20" />
                  <Text className="text-body05 text-grey-40">{board.likeCount}</Text>
                  <Svg width="1" height="16" viewBox="0 0 1 16" fill="none" className="ms-2">
                    <Line x1="0.5" x2="0.5" y2="16" stroke="#AEB2B6" />
                  </Svg>
                  <ChatBubbleIcon size={24} className="ms-1.5 text-blue-20" />
                  <Text className="text-body05 text-grey-40">{board.commentCount}</Text>
                </View>
              </View>
            </View>

            <View className="px-4 pt-4">
              <PostContent content={board.content || board.previewContent} />
            </View>

            <View className="flex-row items-center justify-between px-5 pt-5">
              <TouchableOpacity
                onPress={() => void handlePostLikeClick()}
                className="flex-row items-center self-start"
                disabled={isLikePending}
              >
                <Text className="text-body04 text-grey-40">
                  {isLikePending ? '처리 중...' : '좋아요'}
                </Text>
                <HeartIcon
                  filled={board.liked}
                  className={board.liked ? 'text-blue-20' : 'text-grey-20'}
                />
              </TouchableOpacity>

              {board.canEdit || board.canDelete ? (
                <View className="flex-row items-center gap-5">
                  {board.canEdit ? (
                    <TouchableOpacity onPress={handleEditPress}>
                      <Text className="text-body05 text-grey-40">수정</Text>
                    </TouchableOpacity>
                  ) : null}
                  {board.canDelete ? (
                    <TouchableOpacity onPress={() => setDeleteDialogOpen(true)}>
                      <Text className="text-body05 text-grey-40">삭제</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}
            </View>

            <View className="mt-5 border-b border-grey-02" />

            <View className="px-4 pt-5">
              <Text className="mb-2 text-body02 text-black">댓글</Text>

              {user ? (
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
                <LoggedOutCommentView onLoginPress={handleLoginPress} />
              )}
            </View>
          </View>
        </View>

        <Footer withBottomInset />
      </View>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="mx-6 w-[320px] max-w-[320px] gap-4 rounded-xl border-none py-[24px]">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-center text-body03 text-black">
              게시글을 삭제하시겠습니까?
            </DialogTitle>
            <DialogDescription className="text-center text-body06 text-grey-80">
              삭제한 게시글과 댓글은 복구할 수 없습니다.
            </DialogDescription>
          </DialogHeader>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setDeleteDialogOpen(false)}
              className="h-[36px] flex-1 items-center justify-center rounded-xl bg-grey-10"
              disabled={isBoardDeleting}
            >
              <Text className="text-body06 text-black">취소</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => void handleBoardDeleteConfirm()}
              className="h-[36px] flex-1 items-center justify-center rounded-xl bg-error"
              disabled={isBoardDeleting}
            >
              <Text className="text-body06 text-white">
                {isBoardDeleting ? '삭제 중...' : '삭제'}
              </Text>
            </TouchableOpacity>
          </View>
        </DialogContent>
      </Dialog>
    </ScrollView>
  );
}

function LoadingState({ topInset, bottomInset }: { topInset: number; bottomInset: number }) {
  return (
    <View className="flex-1 bg-white" style={{ paddingTop: topInset }}>
      <View className="flex-1 items-center justify-center gap-3">
        <ActivityIndicator />
        <Text className="text-body05 text-grey-40">게시글을 불러오고 있습니다.</Text>
      </View>
      <View style={{ paddingBottom: bottomInset }}>
        <Footer />
      </View>
    </View>
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
        <Text className="text-center text-body04 text-black">{message}</Text>
        <Button onPress={onRetry} className="rounded-xl px-5">
          <Text>다시 시도</Text>
        </Button>
      </View>
      <View style={{ paddingBottom: bottomInset }}>
        <Footer />
      </View>
    </View>
  );
}

function LoggedOutCommentView({ onLoginPress }: { onLoginPress: () => void }) {
  return (
    <View className="gap-[14px]">
      <View className="h-[129px] items-center justify-center rounded-[4px] border border-grey-10 bg-white px-4">
        <Text className="text-center text-body05 text-grey-30">로그인 후 이용 가능합니다.</Text>
      </View>
      <Button onPress={onLoginPress} className="h-[48px] rounded-[8px] bg-blue-35">
        <Text className="text-white">Thingo 로그인하기</Text>
      </Button>
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
          className="max-h-[84px] min-h-[21px] py-0 pe-10 font-pretendard text-body05 text-black"
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

      <Text className="text-right text-caption02 text-grey-40">
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
              <Text className="text-body04 text-black">{comment.nickname}</Text>
              <Text className="text-caption02 text-grey-30">
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

        <Text className="text-body05 leading-[21px] text-black">{comment.content}</Text>

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
                  ? 'min-w-[14px] text-caption02 text-grey-30'
                  : 'min-w-[14px] text-caption02 text-grey-40'
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
                  ? 'min-w-[14px] text-caption02 text-blue-20'
                  : 'min-w-[14px] text-caption02 text-grey-40'
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
