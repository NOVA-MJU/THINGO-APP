import { HeartIcon, XIcon } from '@/components/icons';
import { ReviewContentBottomSheet } from '@/components/maps/reviews/review-content-bottom-sheet';
import { ReviewMediaStoryIndicator } from '@/components/maps/reviews/review-media-story-indicator';
import {
  VideoMediaPlayer,
  type MediaOrientation,
} from '@/components/maps/reviews/video-media-player';
import { ZoomableMedia } from '@/components/maps/reviews/zoomable-media';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/auth-context';
import { showAlert } from '@/lib/alert';
import {
  getPlaceReview,
  getPlaceReviewMediaItems,
  getPlaceReviewMediaStrip,
  togglePlaceReviewLike,
  type PlaceReview,
  type PlaceReviewMediaStripItem,
  type PlaceReviewMediaItem,
} from '@/lib/maps/place-reviews';
import { format, parseISO } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import {
  Animated,
  Image,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';

const KOREAN_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const STORY_INDICATOR_TOP = 8;
const MEDIA_TOP_FROM_SAFE_AREA = 16;
const CLOSE_TOP_FROM_MEDIA = 16;
const SEEK_BOTTOM_FROM_SAFE_AREA = 24;
const REVIEW_BOTTOM_FROM_SEEK = 38;
const LIKE_BOTTOM_FROM_REVIEW = 72;
const MUTE_BOTTOM_FROM_LIKE = 66;
const CONTENT_SHEET_HEIGHT_RATIO = 0.6;
const CONTENT_SHEET_MEDIA_VERTICAL_GAP = 20;
const REVIEW_GRADIENT_HEIGHT_RATIO = 0.25;
const STORY_IMAGE_DURATION_MS = 5000;
const STORY_PROGRESS_TICK_MS = 50;
type StoryMediaEntry = {
  mediaItem: PlaceReviewMediaItem;
  review: PlaceReview | null;
  reviewId?: string;
};

export default function PlaceReviewMediaScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { user } = useAuth();
  const { imageUrl, reviewId, placeName, placeId, mediaIndex, mediaSource } = useLocalSearchParams<{
    imageUrl?: string | string[];
    reviewId?: string | string[];
    placeName?: string | string[];
    placeId?: string | string[];
    mediaIndex?: string | string[];
    mediaSource?: string | string[];
  }>();
  const resolvedImageUrl = Array.isArray(imageUrl) ? imageUrl[0] : imageUrl;
  const resolvedReviewId = Array.isArray(reviewId) ? reviewId[0] : reviewId;
  const resolvedPlaceName = Array.isArray(placeName) ? placeName[0] : placeName;
  const resolvedPlaceId = Number(Array.isArray(placeId) ? placeId[0] : placeId);
  const resolvedMediaIndex = Number(Array.isArray(mediaIndex) ? mediaIndex[0] : mediaIndex);
  const resolvedMediaSource = Array.isArray(mediaSource) ? mediaSource[0] : mediaSource;
  const isPlaceMediaSource = resolvedMediaSource === 'place-media';
  const [review, setReview] = React.useState<PlaceReview | null>(null);
  const [placeMediaItems, setPlaceMediaItems] = React.useState<PlaceReviewMediaStripItem[]>([]);
  const [reviewDetailsById, setReviewDetailsById] = React.useState<Record<string, PlaceReview>>({});
  const [activeIndex, setActiveIndex] = React.useState(
    Number.isFinite(resolvedMediaIndex) ? resolvedMediaIndex : 0
  );
  const [mediaWidth, setMediaWidth] = React.useState(0);
  const [reviewContentLineCount, setReviewContentLineCount] = React.useState(0);
  const [contentSheetOpen, setContentSheetOpen] = React.useState(false);
  const [contentSheetVisible, setContentSheetVisible] = React.useState(false);
  const [mediaOrientation, setMediaOrientation] = React.useState<MediaOrientation>('unknown');
  const [isStoryPaused, setIsStoryPaused] = React.useState(false);
  const [isZooming, setIsZooming] = React.useState(false);
  const [isMediaZoomed, setIsMediaZoomed] = React.useState(false);
  const [selfLikeDialogOpen, setSelfLikeDialogOpen] = React.useState(false);
  const [storyProgress, setStoryProgress] = React.useState(0);
  const contentSheetProgress = React.useRef(new Animated.Value(0)).current;
  const storyProgressAnimation = React.useRef(new Animated.Value(0)).current;
  const closeSheetTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeViewerTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const storyProgressRef = React.useRef(0);
  const suppressNextPressRef = React.useRef(false);

  React.useEffect(() => {
    if (!resolvedReviewId || isPlaceMediaSource) return;
    getPlaceReview(resolvedReviewId).then(setReview);
  }, [isPlaceMediaSource, resolvedReviewId]);

  React.useEffect(() => {
    if (!isPlaceMediaSource || !Number.isFinite(resolvedPlaceId)) return;
    getPlaceReviewMediaStrip(resolvedPlaceId).then(setPlaceMediaItems);
  }, [isPlaceMediaSource, resolvedPlaceId]);

  // 진입 경로별 리뷰 미디어 구성
  const mediaEntries = React.useMemo<StoryMediaEntry[]>(() => {
    if (isPlaceMediaSource) {
      return placeMediaItems.map((item) => ({
        mediaItem: item.mediaItem,
        review: reviewDetailsById[item.reviewId] ?? null,
        reviewId: item.reviewId,
      }));
    }

    if (review) {
      return getPlaceReviewMediaItems(review).map((mediaItem) => ({
        mediaItem,
        review,
        reviewId: review.id,
      }));
    }

    return resolvedImageUrl
      ? [
          {
            mediaItem: { id: 'place-image', url: resolvedImageUrl, type: 'image' },
            review: null,
            reviewId: resolvedReviewId,
          },
        ]
      : [];
  }, [
    isPlaceMediaSource,
    placeMediaItems,
    resolvedImageUrl,
    resolvedReviewId,
    review,
    reviewDetailsById,
  ]);

  const mediaItems = React.useMemo(
    () => mediaEntries.map((entry) => entry.mediaItem),
    [mediaEntries]
  );
  const activeMediaItem = mediaItems[activeIndex] ?? mediaItems[0] ?? null;
  const activeReview =
    mediaEntries[activeIndex]?.review ??
    (mediaEntries[activeIndex]?.reviewId
      ? reviewDetailsById[mediaEntries[activeIndex].reviewId]
      : null) ??
    mediaEntries[0]?.review ??
    review;
  const showIndicator = mediaItems.length > 1;
  const imageResizeMode =
    contentSheetVisible || mediaOrientation === 'landscape' ? 'contain' : 'cover';
  const shouldShowReviewGradient = Boolean(
    activeReview &&
    !contentSheetVisible &&
    shouldRenderReviewGradient(activeMediaItem, mediaOrientation)
  );
  const isStoryPlaybackPaused = isStoryPaused || isZooming || isMediaZoomed;
  const canAdvanceMedia = activeIndex < mediaItems.length - 1;
  const reviewNickname = resolveReviewNickname(activeReview?.nickname, user?.nickname);
  const reviewProfileImageUrl = resolveReviewProfileImageUrl(
    activeReview?.profileImageUrl,
    user?.profileImageUrl
  );
  const bottomInset = Math.max(insets.bottom, 18);
  const seekBottomOffset = bottomInset + SEEK_BOTTOM_FROM_SAFE_AREA;
  const reviewBottomOffset = seekBottomOffset + REVIEW_BOTTOM_FROM_SEEK;
  const likeBottomOffset = reviewBottomOffset + LIKE_BOTTOM_FROM_REVIEW;
  const muteBottomOffset = likeBottomOffset + MUTE_BOTTOM_FROM_LIKE;
  const mediaTopOffset = insets.top + MEDIA_TOP_FROM_SAFE_AREA;
  const mediaBottomOffset = seekBottomOffset + 2;
  const contentSheetHeight = windowHeight * CONTENT_SHEET_HEIGHT_RATIO;

  React.useEffect(() => {
    setReviewContentLineCount(0);
    handleCloseReviewContent();
  }, [activeReview?.id]);

  React.useEffect(() => {
    const activeReviewId = mediaEntries[activeIndex]?.reviewId;
    if (!activeReviewId || reviewDetailsById[activeReviewId]) return;

    let cancelled = false;
    getPlaceReview(activeReviewId).then((nextReview) => {
      if (cancelled || !nextReview) return;
      setReviewDetailsById((previous) => ({ ...previous, [nextReview.id]: nextReview }));
    });

    return () => {
      cancelled = true;
    };
  }, [activeIndex, mediaEntries, reviewDetailsById]);

  React.useEffect(() => {
    Animated.timing(contentSheetProgress, {
      toValue: contentSheetOpen ? 1 : 0,
      duration: 240,
      useNativeDriver: false,
    }).start();
  }, [contentSheetOpen, contentSheetProgress]);

  React.useEffect(() => {
    return () => {
      if (closeSheetTimerRef.current) clearTimeout(closeSheetTimerRef.current);
      if (closeViewerTimerRef.current) clearTimeout(closeViewerTimerRef.current);
    };
  }, []);

  // 상세 바텀시트 노출 시 미디어 영역 축소
  const animatedMediaBottomOffset = contentSheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [mediaBottomOffset, contentSheetHeight + CONTENT_SHEET_MEDIA_VERTICAL_GAP],
  });
  const animatedMediaTopOffset = contentSheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [mediaTopOffset, mediaTopOffset + CONTENT_SHEET_MEDIA_VERTICAL_GAP],
  });
  const mediaTopStyleOffset = contentSheetVisible ? animatedMediaTopOffset : mediaTopOffset;
  const mediaBottomStyleOffset = contentSheetVisible
    ? animatedMediaBottomOffset
    : mediaBottomOffset;

  // 스토리 진행률 애니메이션 반영
  React.useEffect(() => {
    setActiveIndex((previous) => {
      if (mediaItems.length === 0) return previous;
      return Math.min(previous, mediaItems.length - 1);
    });
  }, [mediaItems.length]);

  // 마지막 미디어 종료 시 화면 닫기
  React.useEffect(() => {
    storyProgressRef.current = storyProgress;
    Animated.timing(storyProgressAnimation, {
      toValue: Math.max(0, Math.min(1, storyProgress)),
      duration: STORY_PROGRESS_TICK_MS,
      useNativeDriver: false,
    }).start();
  }, [storyProgress, storyProgressAnimation]);

  React.useEffect(() => {
    storyProgressRef.current = 0;
    setStoryProgress(0);
    storyProgressAnimation.setValue(0);
    setIsZooming(false);
    setIsMediaZoomed(false);
    if (closeViewerTimerRef.current) {
      clearTimeout(closeViewerTimerRef.current);
      closeViewerTimerRef.current = null;
    }
  }, [activeMediaItem?.url, storyProgressAnimation]);

  React.useEffect(() => {
    if (
      !activeMediaItem ||
      canAdvanceMedia ||
      contentSheetVisible ||
      isStoryPlaybackPaused ||
      storyProgress < 0.999 ||
      closeViewerTimerRef.current
    ) {
      return;
    }

    closeViewerTimerRef.current = setTimeout(() => {
      closeViewerTimerRef.current = null;
      router.back();
    }, 120);

    return () => {
      if (closeViewerTimerRef.current) {
        clearTimeout(closeViewerTimerRef.current);
        closeViewerTimerRef.current = null;
      }
    };
  }, [activeMediaItem, canAdvanceMedia, contentSheetVisible, isStoryPlaybackPaused, storyProgress]);

  React.useEffect(() => {
    setMediaOrientation('unknown');
    if (!activeMediaItem || activeMediaItem.type !== 'image') return;

    Image.getSize(
      activeMediaItem.url,
      (width, height) => setMediaOrientation(getMediaOrientation(width, height)),
      () => setMediaOrientation('unknown')
    );
  }, [activeMediaItem]);

  // 좌우 제스처로 이전/다음 미디어 이동
  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          if (contentSheetVisible || isMediaZoomed) return false;

          const horizontalMove =
            mediaItems.length > 1 &&
            Math.abs(gestureState.dx) > 18 &&
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
          const verticalMove =
            Math.abs(gestureState.dy) > 18 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);

          return horizontalMove || verticalMove;
        },
        onPanResponderRelease: (_, gestureState) => {
          if (
            mediaItems.length > 1 &&
            Math.abs(gestureState.dx) > 70 &&
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
          ) {
            setActiveIndex((previous) => {
              if (gestureState.dx > 0) return Math.max(0, previous - 1);
              return Math.min(mediaItems.length - 1, previous + 1);
            });
            return;
          }

          if (gestureState.dy > 70) router.back();
        },
      }),
    [contentSheetVisible, isMediaZoomed, mediaItems.length]
  );

  const moveToPrevious = React.useCallback(() => {
    setActiveIndex((previous) => Math.max(0, previous - 1));
  }, []);

  const moveToNext = React.useCallback(() => {
    setActiveIndex((previous) => Math.min(mediaItems.length - 1, previous + 1));
  }, [mediaItems.length]);

  const handleVideoProgress = React.useCallback(
    (progress: number) => {
      if (contentSheetVisible || isStoryPlaybackPaused) return;
      setStoryProgress(progress);
    },
    [contentSheetVisible, isStoryPlaybackPaused]
  );

  const handleVideoEnd = React.useCallback(() => {
    if (contentSheetVisible || isStoryPlaybackPaused) return;

    if (canAdvanceMedia) {
      moveToNext();
      return;
    }

    setStoryProgress(1);
    router.back();
  }, [canAdvanceMedia, contentSheetVisible, isStoryPlaybackPaused, moveToNext]);

  const handleStoryLongPress = React.useCallback(() => {
    suppressNextPressRef.current = true;
    setIsStoryPaused(true);
  }, []);

  const handleStoryPressOut = React.useCallback(() => {
    setIsStoryPaused(false);
    setTimeout(() => {
      suppressNextPressRef.current = false;
    }, 0);
  }, []);

  const handleMediaPress = React.useCallback(
    (event: GestureResponderEvent, onMiddlePress?: () => void) => {
      if (suppressNextPressRef.current) return;
      if (isMediaZoomed) return;

      if (mediaItems.length <= 1 || mediaWidth <= 0) {
        onMiddlePress?.();
        return;
      }

      const locationX = event.nativeEvent.locationX;
      if (locationX < mediaWidth * 0.28) {
        moveToPrevious();
        return;
      }
      if (locationX > mediaWidth * 0.72) {
        moveToNext();
        return;
      }
      onMiddlePress?.();
    },
    [isMediaZoomed, mediaItems.length, mediaWidth, moveToNext, moveToPrevious]
  );

  // 이미지 미디어 자동 진행
  React.useEffect(() => {
    if (
      !activeMediaItem ||
      activeMediaItem.type !== 'image' ||
      contentSheetVisible ||
      isStoryPlaybackPaused
    ) {
      return;
    }

    const initialProgress = Math.max(0, Math.min(1, storyProgressRef.current));
    const startedAt = Date.now() - initialProgress * STORY_IMAGE_DURATION_MS;
    const intervalId = setInterval(() => {
      const nextProgress = Math.min(1, (Date.now() - startedAt) / STORY_IMAGE_DURATION_MS);
      setStoryProgress(nextProgress);

      if (nextProgress < 1) return;
      clearInterval(intervalId);

      if (canAdvanceMedia) {
        moveToNext();
        return;
      }

      router.back();
    }, STORY_PROGRESS_TICK_MS);

    return () => clearInterval(intervalId);
  }, [activeMediaItem, canAdvanceMedia, contentSheetVisible, isStoryPlaybackPaused, moveToNext]);

  async function handleToggleLike() {
    if (!activeReview) return;
    if (isCurrentUserReview(activeReview, user?.uuid, user?.nickname)) {
      setSelfLikeDialogOpen(true);
      return;
    }

    try {
      const nextReview = await togglePlaceReviewLike(activeReview.id);
      if (!nextReview) return;

      setReview((previous) => (previous?.id === nextReview.id ? nextReview : previous));
      setReviewDetailsById((previous) => ({ ...previous, [nextReview.id]: nextReview }));
    } catch {
      showAlert('좋아요 처리 실패', '잠시 후 다시 시도해주세요.');
    }
  }

  function handleOpenReviewContent() {
    if (!activeReview) return;
    if (closeSheetTimerRef.current) clearTimeout(closeSheetTimerRef.current);
    setContentSheetVisible(true);
    setContentSheetOpen(true);
  }

  function handleCloseReviewContent() {
    setContentSheetOpen(false);
    closeSheetTimerRef.current = setTimeout(() => {
      setContentSheetVisible(false);
    }, 240);
  }

  const canOpenReviewContent =
    Boolean(activeReview) &&
    (reviewContentLineCount > 2 || (activeReview?.content.length ?? 0) > 45);

  return (
    <View className="flex-1 bg-black" {...panResponder.panHandlers}>
      <View className="absolute inset-0">
        {activeMediaItem ? (
          activeMediaItem.type === 'video' ? (
            <VideoMediaPlayer
              key={activeMediaItem.url}
              mediaItem={activeMediaItem}
              isContentSheetOpen={contentSheetVisible}
              isStoryPaused={isStoryPlaybackPaused}
              mediaTopOffset={mediaTopStyleOffset}
              mediaBottomOffset={mediaBottomStyleOffset}
              muteBottomOffset={muteBottomOffset - mediaBottomOffset}
              onOrientationChange={setMediaOrientation}
              onProgress={handleVideoProgress}
              onEnd={handleVideoEnd}
              onPress={(event, togglePlayback) => handleMediaPress(event, togglePlayback)}
              onStoryLongPress={handleStoryLongPress}
              onStoryPressOut={handleStoryPressOut}
              onZoomActiveChange={setIsZooming}
              onZoomedChange={setIsMediaZoomed}
              onLayout={(event) => setMediaWidth(event.nativeEvent.layout.width)}
            />
          ) : (
            <Animated.View
              style={[
                styles.mediaContainer,
                { bottom: mediaBottomStyleOffset, top: mediaTopStyleOffset },
              ]}
              onLayout={(event) => setMediaWidth(event.nativeEvent.layout.width)}
            >
              <ZoomableMedia
                resetKey={activeMediaItem.url}
                onZoomActiveChange={setIsZooming}
                onZoomedChange={setIsMediaZoomed}
                overlay={
                  <Pressable
                    className="absolute inset-0"
                    onPress={(event) => handleMediaPress(event)}
                    onLongPress={handleStoryLongPress}
                    onPressOut={handleStoryPressOut}
                    delayLongPress={180}
                  />
                }
              >
                <Image
                  source={{ uri: activeMediaItem.url }}
                  onLoad={(event) => {
                    const { width, height } = event.nativeEvent.source;
                    setMediaOrientation(getMediaOrientation(width, height));
                  }}
                  resizeMode={imageResizeMode}
                  style={styles.mediaImage}
                />
              </ZoomableMedia>
            </Animated.View>
          )
        ) : (
          <View className="h-full w-full items-center justify-center bg-grey-40">
            <Text className="text-body05 text-white">이미지 없음</Text>
          </View>
        )}
      </View>

      <View pointerEvents="none" style={styles.bottomScrim} />
      {shouldShowReviewGradient ? <ReviewBottomGradient /> : null}

      <ReviewMediaStoryIndicator
        visible={showIndicator && !contentSheetVisible}
        items={mediaItems}
        activeIndex={activeIndex}
        progress={storyProgressAnimation}
        topOffset={insets.top + STORY_INDICATOR_TOP}
      />

      <Pressable
        onPress={() => router.back()}
        className="absolute right-5 z-30 h-8 w-8 items-center justify-center"
        style={{ top: mediaTopOffset + CLOSE_TOP_FROM_MEDIA }}
        hitSlop={8}
      >
        <XIcon size={24} className="text-white" />
      </Pressable>

      {activeReview ? (
        <View
          pointerEvents="box-none"
          className="absolute left-5 right-5 z-20"
          style={{ bottom: reviewBottomOffset }}
        >
          <View className="min-w-0 pr-14">
            <View className="flex-row items-center gap-2">
              <ReviewAvatar profileImageUrl={reviewProfileImageUrl} />
              <Text className="text-body04 text-white" numberOfLines={1}>
                {reviewNickname}
              </Text>
            </View>
            <Text className="mt-5 text-caption02 text-grey-20">
              {formatReviewDate(activeReview.createdAt)}
            </Text>
            <ReviewContentPreview
              content={activeReview.content}
              canOpen={canOpenReviewContent}
              onOpen={handleOpenReviewContent}
              onLineCountChange={setReviewContentLineCount}
            />
          </View>
        </View>
      ) : null}

      {activeReview ? (
        <Pressable
          onPress={handleToggleLike}
          className="absolute right-5 z-30 h-[50px] w-8 items-center"
          style={{ bottom: likeBottomOffset }}
          hitSlop={8}
        >
          <HeartIcon size={35} filled={Boolean(activeReview.liked)} className="text-white" />
          <View className="h-[16px] items-center justify-center">
            {(activeReview.likeCount ?? 0) > 0 ? (
              <Text className="text-caption02 leading-[16px] text-white">
                {activeReview.likeCount}
              </Text>
            ) : null}
          </View>
        </Pressable>
      ) : null}

      {!activeReview && resolvedPlaceName ? (
        <View className="absolute left-5 right-5 z-20" style={{ bottom: reviewBottomOffset }}>
          <Text className="text-body04 leading-[21px] text-white" numberOfLines={2}>
            {resolvedPlaceName} 사진입니다.
          </Text>
        </View>
      ) : null}

      {activeReview ? (
        <ReviewContentBottomSheet
          review={activeReview}
          visible={contentSheetVisible}
          progress={contentSheetProgress}
          sheetHeight={contentSheetHeight}
          nickname={reviewNickname}
          profileImageUrl={reviewProfileImageUrl}
          onClose={handleCloseReviewContent}
          onToggleLike={handleToggleLike}
        />
      ) : null}

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
            <Pressable
              onPress={() => setSelfLikeDialogOpen(false)}
              className="h-[36px] flex-1 items-center justify-center rounded-[8px] bg-blue-35"
              accessibilityRole="button"
              accessibilityLabel="좋아요 제한 안내 확인"
            >
              <Text className="text-body06 text-white">확인</Text>
            </Pressable>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  );
}

function ReviewContentPreview({
  content,
  canOpen,
  onOpen,
  onLineCountChange,
}: {
  content: string;
  canOpen: boolean;
  onOpen: () => void;
  onLineCountChange: (lineCount: number) => void;
}) {
  const [measuredLines, setMeasuredLines] = React.useState<string[]>([]);
  const shouldShowMore = canOpen || measuredLines.length > 2;
  const firstLine = measuredLines[0]?.trimEnd() ?? content;
  const secondLine = createSecondLinePreview(measuredLines[1] ?? '');

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel="리뷰 내용 전체보기"
      className="relative mt-1"
    >
      <Text
        className="absolute text-body04 leading-[21px] opacity-0"
        onTextLayout={(event) => {
          const lines = event.nativeEvent.lines.map((line) => line.text);
          setMeasuredLines(lines);
          onLineCountChange(lines.length);
        }}
      >
        {content}
      </Text>

      {shouldShowMore && measuredLines.length >= 2 ? (
        <View>
          <Text className="text-body04 leading-[21px] text-white" numberOfLines={1}>
            {firstLine}
          </Text>
          <View className="flex-row items-center">
            <Text
              className="min-w-0 flex-1 text-body04 leading-[21px] text-white"
              numberOfLines={1}
              ellipsizeMode="clip"
            >
              {secondLine}
            </Text>
            <Text className="text-caption02 leading-[18px] text-grey-20"> ... 더보기</Text>
          </View>
        </View>
      ) : (
        <Text className="text-body04 leading-[21px] text-white" numberOfLines={2}>
          {content}
        </Text>
      )}
    </Pressable>
  );
}

function createSecondLinePreview(line: string) {
  return line.trimEnd();
}

function shouldRenderReviewGradient(
  mediaItem: PlaceReviewMediaItem | null,
  orientation: MediaOrientation
) {
  if (!mediaItem) return false;
  if (mediaItem.type === 'image') return orientation === 'portrait';

  // 네이티브 영상 회전 메타데이터 보정
  if (Platform.OS !== 'web') return true;

  return orientation === 'portrait';
}

function getMediaOrientation(width: number, height: number): MediaOrientation {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return 'unknown';
  }

  return height > width ? 'portrait' : 'landscape';
}

function ReviewBottomGradient() {
  return (
    <View pointerEvents="none" style={styles.reviewGradient}>
      <Svg height="100%" width="100%">
        <Defs>
          <SvgLinearGradient id="review-bottom-gradient" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor="#000000" stopOpacity="0" />
            <Stop offset="1" stopColor="#000000" stopOpacity="0.4" />
          </SvgLinearGradient>
        </Defs>
        <Rect fill="url(#review-bottom-gradient)" height="100%" width="100%" x="0" y="0" />
      </Svg>
    </View>
  );
}

function ReviewAvatar({ profileImageUrl }: { profileImageUrl: string | null }) {
  if (profileImageUrl) {
    return (
      <Image
        source={{ uri: profileImageUrl }}
        className="h-7 w-7 rounded-full bg-grey-10"
        resizeMode="cover"
      />
    );
  }

  return <View className="h-7 w-7 rounded-full bg-grey-10" />;
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

function formatReviewDate(value: string) {
  try {
    const date = parseISO(value);
    return `${format(date, 'yyyy.MM.dd')} (${KOREAN_WEEKDAYS[date.getDay()]})`;
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  mediaContainer: {
    zIndex: 12,
    elevation: 12,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
  },
  mediaImage: {
    height: '100%',
    width: '100%',
  },
  bottomScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
  },
  reviewGradient: {
    bottom: 0,
    elevation: 13,
    height: `${REVIEW_GRADIENT_HEIGHT_RATIO * 100}%`,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 13,
  },
});
