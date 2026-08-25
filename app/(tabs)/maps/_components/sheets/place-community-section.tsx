import ReviewRatingPrompt from '@/assets/images/review-rating-prompt.svg';
import ReviewWriteEditIcon from '@/assets/images/review-write-edit.svg';
import { blockMember } from '@/api/members';
import { reportReview, type ReportReason } from '@/api/reports';
import {
  ArrowDownIcon,
  HeartIcon,
  MoreVerticalIcon,
  RadioIcon,
  XThinIcon,
} from '@/components/icons';
import { ReviewVideoThumbnail } from '@/components/maps/review-video-thumbnail';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { useLoginRequiredModal } from '@/context/login-required-modal-context';
import {
  getPlaceReviewKeyword,
  deletePlaceReview,
  getPlaceReviewMediaItems,
  togglePlaceReviewLike,
  type PlaceReview,
  type PlaceReviewMediaStripItem,
  type PlaceReviewMediaItem,
  type PlaceReviewSort,
} from '@/lib/maps/place-reviews';
import { showAlert } from '@/lib/alert';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  type NativeSyntheticEvent,
  type TextLayoutEventData,
} from 'react-native';
import { NativeViewGestureHandler } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PlaceCommunitySectionProps = {
  placeName: string;
  categoryCode: string;
  reviews: PlaceReview[];
  reviewMediaItems: PlaceReviewMediaStripItem[];
  onWriteReview: () => void;
  onOpenMedia: (
    reviewId: string | undefined,
    mediaIndex: number | undefined,
    source: 'place-media' | 'review'
  ) => void;
  onReviewsChange: (reviews: PlaceReview[]) => void;
  onReviewDeleted?: (reviewId: string) => void;
  onSortChange?: (sort: PlaceReviewSort) => void;
};

const COMING_SOON_CATEGORY_CODES = new Set(['club-room', 'smoking']);

const REVIEW_SORT_OPTIONS: { value: PlaceReviewSort; label: string }[] = [
  { value: 'latest', label: '최신순' },
  { value: 'likes', label: '좋아요순' },
];
const COLLAPSED_REVIEW_LINE_COUNT = 4;
const COLLAPSED_REVIEW_FALLBACK_LENGTH = 120;
const REPORT_ETC_MAX_LENGTH = 400;

const REPORT_REASON_OPTIONS: {
  id: ReportReason;
  title: string;
  description?: string;
}[] = [
  {
    id: 'COMMERCIAL_AD',
    title: '상업적 광고 및 홍보성',
    description: '영리 목적의 홍보·판매, 타 서비스나 사이트 가입 유도',
  },
  {
    id: 'INAPPROPRIATE',
    title: '주제 및 서비스 성격에 부적절함',
    description: '게시판 주제나 장소와 무관한 내용, 무의미한 초성·도배·낚시',
  },
  {
    id: 'ABUSE',
    title: '욕설/비하/인신공격',
    description: '특정인이나 단체에 대한 비방, 명예훼손, 학우 간 분란 조장',
  },
  {
    id: 'OBSCENE',
    title: '음란성/불건전한 내용',
    description: '선정적인 내용, 불건전한 만남 유도, 불법촬영물 등 유통',
  },
  {
    id: 'PRIVACY_SCAM',
    title: '개인정보 노출 및 사칭/사기',
    description: '개인 실명·연락처·SNS ID 노출, 관리자 사칭, 사기 의심',
  },
  { id: 'ETC', title: '기타' },
];

export default function PlaceCommunitySection({
  categoryCode,
  placeName,
  reviews,
  reviewMediaItems,
  onWriteReview,
  onOpenMedia,
  onReviewsChange,
  onReviewDeleted,
  onSortChange,
}: PlaceCommunitySectionProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showLoginRequiredModal } = useLoginRequiredModal();
  const reportBottomSheetRef = React.useRef<BottomSheetModal>(null);
  const [reviewSort, setReviewSort] = React.useState<PlaceReviewSort>('latest');
  const [deleteTargetReview, setDeleteTargetReview] = React.useState<PlaceReview | null>(null);
  const [reportTargetReview, setReportTargetReview] = React.useState<PlaceReview | null>(null);
  const [blockTargetReview, setBlockTargetReview] = React.useState<PlaceReview | null>(null);
  const [isDeletingReview, setIsDeletingReview] = React.useState(false);
  const [isReportSubmitting, setIsReportSubmitting] = React.useState(false);
  const [isBlockingReviewAuthor, setIsBlockingReviewAuthor] = React.useState(false);
  const [selectedReportReasonId, setSelectedReportReasonId] = React.useState<ReportReason | null>(
    null
  );
  const [reportEtcText, setReportEtcText] = React.useState('');
  const [selfLikeDialogOpen, setSelfLikeDialogOpen] = React.useState(false);
  const selectedSortLabel =
    REVIEW_SORT_OPTIONS.find((option) => option.value === reviewSort)?.label ??
    REVIEW_SORT_OPTIONS[0].label;
  const sortedReviews = React.useMemo(
    () => sortReviews(reviews, reviewSort),
    [reviews, reviewSort]
  );

  const openDeleteReviewDialog = React.useCallback(
    (review: PlaceReview) => {
      if (!user) {
        showLoginRequiredModal();
        return;
      }

      if (
        !review.id ||
        (!review.canDelete && !isCurrentUserReview(review, user.uuid, user.nickname))
      ) {
        showAlert('리뷰 삭제 실패', '삭제할 수 있는 리뷰가 아닙니다.');
        return;
      }

      setDeleteTargetReview(review);
    },
    [showLoginRequiredModal, user]
  );

  const handleConfirmDeleteReview = React.useCallback(() => {
    if (!deleteTargetReview || isDeletingReview) return;

    setIsDeletingReview(true);
    void deletePlaceReview(deleteTargetReview.id)
      .then(() => {
        onReviewsChange(reviews.filter((item) => item.id !== deleteTargetReview.id));
        onReviewDeleted?.(deleteTargetReview.id);
        setDeleteTargetReview(null);
      })
      .catch(() => {
        showAlert('리뷰 삭제 실패', '잠시 후 다시 시도해주세요.');
      })
      .finally(() => {
        setIsDeletingReview(false);
      });
  }, [deleteTargetReview, isDeletingReview, onReviewDeleted, onReviewsChange, reviews]);

  const handleDeleteDialogOpenChange = React.useCallback(
    (open: boolean) => {
      if (open || isDeletingReview) return;
      setDeleteTargetReview(null);
    },
    [isDeletingReview]
  );

  const openReportReviewSheet = React.useCallback(
    (review: PlaceReview) => {
      if (!user) {
        showLoginRequiredModal();
        return;
      }

      setReportTargetReview(review);
      setSelectedReportReasonId(null);
      setReportEtcText('');
      reportBottomSheetRef.current?.present();
    },
    [showLoginRequiredModal, user]
  );

  const closeReportReviewSheet = React.useCallback(() => {
    reportBottomSheetRef.current?.dismiss();
  }, []);

  const handleReportReviewSubmit = React.useCallback(async () => {
    const canSubmitReport =
      selectedReportReasonId === 'ETC'
        ? reportEtcText.trim().length > 0
        : selectedReportReasonId !== null;

    if (!reportTargetReview || !selectedReportReasonId || !canSubmitReport || isReportSubmitting) {
      return;
    }

    setIsReportSubmitting(true);

    try {
      await reportReview(reportTargetReview.id, selectedReportReasonId, reportEtcText.trim());
      closeReportReviewSheet();
      showAlert('신고가 접수되었습니다.');
    } catch {
      showAlert('신고 접수 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setIsReportSubmitting(false);
    }
  }, [
    closeReportReviewSheet,
    isReportSubmitting,
    reportEtcText,
    reportTargetReview,
    selectedReportReasonId,
  ]);

  const openBlockReviewAuthorDialog = React.useCallback(
    (review: PlaceReview) => {
      if (!user) {
        showLoginRequiredModal();
        return;
      }

      if (!review.authorUuid) {
        showAlert('사용자 차단 실패', '차단할 사용자 정보를 찾을 수 없습니다.');
        return;
      }

      setBlockTargetReview(review);
    },
    [showLoginRequiredModal, user]
  );

  const handleConfirmBlockReviewAuthor = React.useCallback(async () => {
    if (!blockTargetReview?.authorUuid || isBlockingReviewAuthor) return;

    setIsBlockingReviewAuthor(true);

    try {
      await blockMember(blockTargetReview.authorUuid);
      setBlockTargetReview(null);
      onReviewsChange(reviews.filter((item) => item.authorUuid !== blockTargetReview.authorUuid));
    } catch {
      showAlert('사용자 차단 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setIsBlockingReviewAuthor(false);
    }
  }, [blockTargetReview, isBlockingReviewAuthor, onReviewsChange, reviews]);

  if (COMING_SOON_CATEGORY_CODES.has(categoryCode)) {
    return (
      <View className="mt-4 px-4 py-5">
        <Text className="text-title03 text-black">커뮤니티</Text>
        <View className="mt-3 h-[88px] items-center justify-center rounded-[4px] border border-grey-10 bg-white">
          <Text className="text-body05 text-grey-30">곧 만나볼 수 있어요!</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="mt-4">
      <View className="px-4">
        <Text className="text-title03 text-black">사진·영상</Text>
      </View>

      <NativeViewGestureHandler disallowInterruption>
        <ScrollView
          horizontal
          nestedScrollEnabled
          directionalLockEnabled
          showsHorizontalScrollIndicator={false}
          className="mt-2"
          contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
        >
          {reviewMediaItems.length > 0 ? (
            reviewMediaItems.map((item, index) => (
              <Pressable
                key={`${item.reviewId}-${item.mediaItem.id}-${index}`}
                className="h-[120px] w-[90px] overflow-hidden rounded-[4px] bg-grey-10"
                onPress={() => onOpenMedia(item.reviewId, index, 'place-media')}
              >
                <MediaThumbnail mediaItem={item.mediaItem} />
              </Pressable>
            ))
          ) : (
            <View className="h-[120px] w-[90px] rounded-[4px] bg-grey-10" />
          )}
        </ScrollView>
      </NativeViewGestureHandler>

      <ReviewPromptCard placeName={placeName} onWriteReview={onWriteReview} />

      <View className="mt-5 px-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-title03 text-black">리뷰</Text>
            <Text className="text-body05 text-grey-40">{reviews.length}</Text>
          </View>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <TouchableOpacity
                className="flex-row items-center gap-0.5 py-1 pl-2"
                accessibilityRole="button"
                accessibilityLabel="리뷰 정렬 선택"
              >
                <Text className="text-caption02 text-grey-40">{selectedSortLabel}</Text>
                <ArrowDownIcon size={14} className="text-grey-30" />
              </TouchableOpacity>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[96px] overflow-hidden rounded-[8px]">
              {REVIEW_SORT_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onPress={() => {
                    setReviewSort(option.value);
                    onSortChange?.(option.value);
                  }}
                  className={cn(reviewSort === option.value && 'bg-blue-05')}
                >
                  <Text
                    className={cn(
                      'text-caption02',
                      reviewSort === option.value ? 'text-blue-35' : 'text-grey-60'
                    )}
                  >
                    {option.label}
                  </Text>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </View>

        {reviews.length > 0 ? (
          <View className="mt-3 gap-5">
            {sortedReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                currentUserUuid={user?.uuid}
                fallbackNickname={user?.nickname}
                fallbackProfileImageUrl={user?.profileImageUrl}
                onEditReview={() => showAlert('알림', '리뷰 수정 기능은 준비 중입니다.')}
                onDeleteReview={() => openDeleteReviewDialog(review)}
                onReportReview={() => openReportReviewSheet(review)}
                onBlockReviewAuthor={() => openBlockReviewAuthorDialog(review)}
                onOpenMedia={(mediaIndex) => onOpenMedia(review.id, mediaIndex, 'review')}
                onToggleLike={async () => {
                  if (isCurrentUserReview(review, user?.uuid, user?.nickname)) {
                    setSelfLikeDialogOpen(true);
                    return;
                  }

                  try {
                    const nextReview = await togglePlaceReviewLike(review.id);
                    if (!nextReview) return;
                    onReviewsChange(
                      reviews.map((item) => (item.id === nextReview.id ? nextReview : item))
                    );
                  } catch {
                    showAlert('좋아요 처리 실패', '잠시 후 다시 시도해주세요.');
                  }
                }}
              />
            ))}
          </View>
        ) : (
          <View className="mt-3 h-[88px] items-center justify-center rounded-[4px] border border-grey-10 bg-white">
            <Text className="text-body05 text-grey-30">첫 리뷰를 남겨주세요!</Text>
          </View>
        )}
      </View>

      <Dialog open={!!deleteTargetReview} onOpenChange={handleDeleteDialogOpenChange}>
        <DialogContent
          className="w-[320px] max-w-[320px] gap-4 rounded-[12px] border-2 border-grey-02 bg-white p-[24px]"
          showCloseButton={false}
        >
          <DialogHeader className="gap-[2px]">
            <DialogTitle className="text-center text-body02 text-black">
              리뷰를 삭제할까요?
            </DialogTitle>
            <DialogDescription className="text-center text-body06 text-grey-80">
              삭제된 리뷰는 복구할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="h-[36px] flex-row gap-2">
            <TouchableOpacity
              onPress={() => setDeleteTargetReview(null)}
              disabled={isDeletingReview}
              className="h-[36px] flex-1 items-center justify-center rounded-[8px] bg-grey-10"
              accessibilityRole="button"
              accessibilityLabel="리뷰 삭제 취소"
            >
              <Text className="text-body06 text-black">취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirmDeleteReview}
              disabled={isDeletingReview}
              className="h-[36px] flex-1 items-center justify-center rounded-[8px] bg-error"
              accessibilityRole="button"
              accessibilityLabel="리뷰 삭제 확인"
            >
              <Text className="text-body06 text-white">
                {isDeletingReview ? '삭제 중' : '삭제'}
              </Text>
            </TouchableOpacity>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!blockTargetReview}
        onOpenChange={(open) => !open && setBlockTargetReview(null)}
      >
        <DialogContent showCloseButton={false} className="min-w-80 p-5">
          <View className="gap-4">
            <View>
              <DialogTitle className="text-center text-body04 leading-normal text-grey-80">
                {`'${resolveReviewNickname(blockTargetReview?.nickname, undefined)}' 차단하시겠어요?`}
              </DialogTitle>
              <Text className="text-center text-caption02 text-grey-80">
                {
                  '차단하면 이 사용자가 작성한 모든 게시판 글과\n댓글, 명지도 리뷰가 즉시 숨겨집니다.'
                }
              </Text>
              <Text className="text-center text-caption04 text-grey-40">
                (상대방에게는 차단 사실을 알리지 않아요.)
              </Text>
            </View>
            <View className="flex-row gap-2">
              <Button
                className="h-9 flex-1 py-0"
                variant="outline"
                onPress={() => setBlockTargetReview(null)}
                disabled={isBlockingReviewAuthor}
              >
                <Text>취소</Text>
              </Button>
              <Button
                className="h-9 flex-1 py-0"
                onPress={handleConfirmBlockReviewAuthor}
                disabled={isBlockingReviewAuthor}
              >
                <Text>{isBlockingReviewAuthor ? '차단 중...' : '차단'}</Text>
              </Button>
            </View>
          </View>
        </DialogContent>
      </Dialog>

      <Dialog open={selfLikeDialogOpen} onOpenChange={setSelfLikeDialogOpen}>
        <DialogContent
          className="w-[320px] max-w-[320px] gap-4 rounded-[12px] border-2 border-grey-02 bg-white p-[24px]"
          showCloseButton={false}
        >
          <DialogHeader className="gap-[2px]">
            <DialogTitle className="text-center text-body02 text-black">
              내 리뷰에는 좋아요를 누를 수 없어요
            </DialogTitle>
            <DialogDescription className="text-center text-body06 text-grey-80">
              다른 사용자가 남긴 리뷰에만 좋아요를 누를 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="h-[36px] flex-row">
            <TouchableOpacity
              onPress={() => setSelfLikeDialogOpen(false)}
              className="h-[36px] flex-1 items-center justify-center rounded-[8px] bg-blue-35"
              accessibilityRole="button"
              accessibilityLabel="좋아요 제한 안내 확인"
            >
              <Text className="text-body06 text-white">확인</Text>
            </TouchableOpacity>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomSheetModal
        ref={reportBottomSheetRef}
        snapPoints={['70%']}
        enableDynamicSizing={false}
        backdropComponent={ReportBottomSheetBackdrop}
        enableContentPanningGesture={false}
        onDismiss={() => setReportTargetReview(null)}
      >
        <BottomSheetScrollView contentContainerClassName="pb-4">
          <View className="items-end px-4">
            <TouchableOpacity onPress={closeReportReviewSheet} hitSlop={4}>
              <XThinIcon size={24} className="text-grey-30" />
            </TouchableOpacity>
          </View>
          <View className="mt-[18px] flex-row items-center gap-1 px-4">
            <Text className="text-body02 text-grey-80">신고 사유를 알려주세요.</Text>
            <Text className="text-body02 text-error">*</Text>
          </View>

          {REPORT_REASON_OPTIONS.map((reason) => (
            <TouchableOpacity
              key={reason.id}
              className="mt-[18px] flex-row items-start gap-1.5 px-4"
              onPress={() => setSelectedReportReasonId(reason.id)}
            >
              <RadioIcon size={20} checked={selectedReportReasonId === reason.id} />
              <View className="flex-1 gap-1">
                <Text className="text-body05 text-grey-60">{reason.title}</Text>
                {reason.description ? (
                  <Text className="text-caption02 text-grey-40">{reason.description}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ))}

          <View className="mt-2 px-4">
            <View className="rounded-[8px] border border-grey-10 px-3 py-2.5">
              <TextInput
                multiline
                textAlignVertical="top"
                className="h-[96px] py-0 font-pretendard text-body05 text-black"
                value={reportEtcText}
                onChangeText={setReportEtcText}
                placeholder="신고 사유를 입력해주세요."
                placeholderTextColor="#909499"
                maxLength={REPORT_ETC_MAX_LENGTH}
              />
              <Text className="text-right text-caption02 text-grey-40">
                {reportEtcText.length}/{REPORT_ETC_MAX_LENGTH}
              </Text>
            </View>
          </View>
        </BottomSheetScrollView>

        <View className="mt-4 px-4" style={{ paddingBottom: insets.bottom }}>
          <Button
            onPress={() => void handleReportReviewSubmit()}
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
    </View>
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

function sortReviews(reviews: PlaceReview[], sortOption: PlaceReviewSort) {
  return [...reviews].sort((a, b) => {
    if (sortOption === 'likes') {
      const likeDiff = b.likeCount - a.likeCount;
      if (likeDiff !== 0) return likeDiff;
    }

    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });
}

function ReviewPromptCard({
  placeName,
  onWriteReview,
}: {
  placeName: string;
  onWriteReview: () => void;
}) {
  return (
    <View className="mx-4 mt-5 rounded-[12px] bg-grey-02 px-4 py-3">
      <View className="relative min-h-[44px]">
        <View className="min-w-0 pr-[108px]">
          <Text
            className="font-pretendard-normal text-body04 leading-[21px] text-grey-80"
            numberOfLines={1}
          >
            {placeName}
          </Text>
          <Text className="mt-0.5 text-body05 leading-[21px] text-grey-60" numberOfLines={1}>
            어떠셨나요?
          </Text>
          <Text className="text-body05 leading-[21px] text-grey-60" numberOfLines={1}>
            명지대생의 솔직한 후기를 남겨주세요!
          </Text>
        </View>
        <View className="absolute right-[-2px] top-[24px] h-[49px] w-[112px]">
          <ReviewRatingPrompt width={112} height={49} />
        </View>
      </View>
      <TouchableOpacity
        onPress={onWriteReview}
        className="mt-2 h-[36px] flex-row items-center justify-center gap-[10px] rounded-[8px] border border-blue-20 bg-grey-02"
      >
        <ReviewWriteEditIcon width={20} height={20} />
        <Text className="text-body05 leading-[21px] text-blue-35">리뷰 쓰기</Text>
      </TouchableOpacity>
    </View>
  );
}

function ReviewCard({
  review,
  currentUserUuid,
  fallbackNickname,
  fallbackProfileImageUrl,
  onEditReview,
  onDeleteReview,
  onReportReview,
  onBlockReviewAuthor,
  onOpenMedia,
  onToggleLike,
}: {
  review: PlaceReview;
  currentUserUuid?: string;
  fallbackNickname?: string;
  fallbackProfileImageUrl?: string | null;
  onEditReview: () => void;
  onDeleteReview: () => void;
  onReportReview: () => void;
  onBlockReviewAuthor: () => void;
  onOpenMedia: (mediaIndex: number) => void;
  onToggleLike: () => void;
}) {
  const nickname = resolveReviewNickname(review.nickname, fallbackNickname);
  const profileImageUrl = resolveReviewProfileImageUrl(
    review.profileImageUrl,
    fallbackProfileImageUrl
  );
  const isOwnReview = isCurrentUserReview(review, currentUserUuid, fallbackNickname);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [measuredCollapsedLineCount, setMeasuredCollapsedLineCount] = React.useState(0);
  const [isReviewMenuOpen, setIsReviewMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setIsExpanded(false);
    setMeasuredCollapsedLineCount(0);
    setIsReviewMenuOpen(false);
  }, [review.content]);

  const handleCollapsedTextLayout = React.useCallback(
    (event: NativeSyntheticEvent<TextLayoutEventData>) => {
      setMeasuredCollapsedLineCount(event.nativeEvent.lines.length);
    },
    []
  );
  const visibleKeywordIds = review.keywordIds.filter((keywordId) => keywordId !== 'none');
  const canToggleContent =
    measuredCollapsedLineCount >= COLLAPSED_REVIEW_LINE_COUNT ||
    review.content.length > COLLAPSED_REVIEW_FALLBACK_LENGTH ||
    review.content.includes('\n');
  const handleReviewMenuAction = React.useCallback((action: () => void) => {
    setIsReviewMenuOpen(false);
    action();
  }, []);

  return (
    <View
      className="relative border-b border-grey-02 pb-4"
      style={{ zIndex: isReviewMenuOpen ? 20 : 0 }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <ReviewAvatar profileImageUrl={profileImageUrl} />
          <Text className="text-body05 text-grey-80">{nickname}</Text>
        </View>
        <View>
          <TouchableOpacity
            onPress={() => setIsReviewMenuOpen((prev) => !prev)}
            className="h-8 w-8 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="리뷰 옵션"
          >
            <MoreVerticalIcon size={18} className="text-grey-30" />
          </TouchableOpacity>
        </View>
      </View>
      {isReviewMenuOpen ? (
        <View
          className="absolute right-0 top-8 w-[84px] bg-white py-[6px]"
          style={{
            elevation: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            zIndex: 30,
          }}
        >
          {isOwnReview ? (
            <>
              <ReviewDropdownMenuItem
                label="수정"
                onPress={() => handleReviewMenuAction(onEditReview)}
              />
              <ReviewDropdownMenuItem
                label="삭제"
                onPress={() => handleReviewMenuAction(onDeleteReview)}
              />
            </>
          ) : (
            <>
              <ReviewDropdownMenuItem
                label="신고"
                onPress={() => handleReviewMenuAction(onReportReview)}
              />
              <ReviewDropdownMenuItem
                label="차단"
                onPress={() => handleReviewMenuAction(onBlockReviewAuthor)}
              />
            </>
          )}
        </View>
      ) : null}

      {visibleKeywordIds.length > 0 ? (
        <View className="mt-2 flex-row flex-wrap gap-1">
          {visibleKeywordIds.map((keywordId) => {
            const keyword = getPlaceReviewKeyword(keywordId);
            if (!keyword) return null;
            return (
              <View
                key={keywordId}
                className="flex-row items-center gap-0.5 rounded-full bg-grey-02 px-1.5 py-0.5"
              >
                {keyword.emoji ? <Text className="text-[10px]">{keyword.emoji}</Text> : null}
                <Text className="text-caption04 text-grey-40">{keyword.label}</Text>
              </View>
            );
          })}
        </View>
      ) : null}

      <View className="relative mt-2">
        <Text
          className="text-body05 leading-[20px] text-grey-80"
          numberOfLines={isExpanded ? undefined : COLLAPSED_REVIEW_LINE_COUNT}
          onTextLayout={!isExpanded ? handleCollapsedTextLayout : undefined}
        >
          {review.content}
        </Text>
        {canToggleContent && !isExpanded ? (
          <Pressable
            onPress={() => setIsExpanded(true)}
            className="absolute bottom-0 right-0 bg-white pl-1"
            accessibilityRole="button"
            accessibilityLabel="리뷰 더보기"
          >
            <Text className="text-body05 leading-[20px] text-grey-30">... 더보기</Text>
          </Pressable>
        ) : null}
      </View>

      {canToggleContent && isExpanded ? (
        <TouchableOpacity
          onPress={() => setIsExpanded(false)}
          className="mt-1 self-start"
          accessibilityRole="button"
          accessibilityLabel="리뷰 접기"
        >
          <Text className="text-caption02 text-grey-40">접기</Text>
        </TouchableOpacity>
      ) : null}

      {getPlaceReviewMediaItems(review).length > 0 ? (
        <NativeViewGestureHandler disallowInterruption>
          <ScrollView
            horizontal
            nestedScrollEnabled
            directionalLockEnabled
            showsHorizontalScrollIndicator={false}
            className="mt-3"
            contentContainerStyle={{ gap: 8 }}
          >
            {getPlaceReviewMediaItems(review).map((mediaItem, index) => (
              <Pressable
                key={`${mediaItem.id}-${index}`}
                onPress={() => onOpenMedia(index)}
                className="h-[76px] w-[76px] overflow-hidden rounded-[4px] border border-grey-10"
              >
                <MediaThumbnail mediaItem={mediaItem} />
              </Pressable>
            ))}
          </ScrollView>
        </NativeViewGestureHandler>
      ) : null}

      <View className="mt-2 flex-row items-center justify-between">
        <TouchableOpacity onPress={onToggleLike} className="flex-row items-center gap-1">
          <HeartIcon size={18} filled={review.liked} className="text-blue-20" />
          {review.likeCount > 0 ? (
            <Text className="text-caption02 text-grey-40">{review.likeCount}</Text>
          ) : null}
        </TouchableOpacity>
        <Text className="text-caption02 text-grey-30">{formatReviewDate(review.createdAt)}</Text>
      </View>
    </View>
  );
}

function ReviewDropdownMenuItem({ label, onPress }: { label: string; onPress: () => void }) {
  const [isPressed, setIsPressed] = React.useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      className={cn('h-[26px] w-full justify-center px-2 py-1', isPressed && 'bg-blue-05')}
    >
      <Text
        className={cn(
          'w-full text-center text-caption02 leading-[18px]',
          isPressed ? 'text-blue-35' : 'text-grey-30'
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function MediaThumbnail({ mediaItem }: { mediaItem: PlaceReviewMediaItem }) {
  if (mediaItem.type === 'image') {
    return <Image source={{ uri: mediaItem.url }} className="h-full w-full" resizeMode="cover" />;
  }

  return <ReviewVideoThumbnail uri={mediaItem.url} thumbnailUrl={mediaItem.thumbnailUrl} />;
}

function isCurrentUserReview(
  review: PlaceReview,
  currentUserUuid?: string,
  fallbackNickname?: string
) {
  if (review.isMine) return true;
  if (review.authorUuid && currentUserUuid) return review.authorUuid === currentUserUuid;
  if (!currentUserUuid) return false;
  return Boolean(fallbackNickname && review.nickname === fallbackNickname);
}

function ReviewAvatar({ profileImageUrl }: { profileImageUrl: string | null }) {
  if (profileImageUrl) {
    return (
      <Image
        source={{ uri: profileImageUrl }}
        className="h-8 w-8 rounded-full bg-grey-10"
        resizeMode="cover"
      />
    );
  }

  return <View className="h-8 w-8 rounded-full bg-grey-10" />;
}

function resolveReviewNickname(nickname: string | null | undefined, fallbackNickname?: string) {
  const trimmedNickname = nickname?.trim();
  if (trimmedNickname && trimmedNickname !== '닉네임') return trimmedNickname;
  return fallbackNickname?.trim() || '닉네임';
}

function resolveReviewProfileImageUrl(
  profileImageUrl: string | null | undefined,
  fallbackProfileImageUrl?: string | null
) {
  return profileImageUrl ?? fallbackProfileImageUrl ?? null;
}

function formatReviewDate(value: string) {
  try {
    return format(parseISO(value), 'yy.MM.dd');
  } catch {
    return '';
  }
}
