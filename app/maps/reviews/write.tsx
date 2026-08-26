import {
  createPlaceReview,
  getPlaceReview,
  getPlaceReviewKeywordCatalog,
  getPlaceReviewMediaItems,
  PLACE_REVIEW_KEYWORDS,
  type PlaceReviewMediaItem,
  type PlaceReviewKeyword,
  updatePlaceReview,
} from '@/lib/maps/place-reviews';
import { ReviewVideoThumbnail } from '@/components/maps/review-video-thumbnail';
import { useMediaUpload } from '@/hooks/useImageUpload';
import { ArrowLeftIcon, InfoOutlineIcon, PlusIcon, XIcon } from '@/components/icons';
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
import { cn } from '@/lib/utils';
import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  type KeyboardEvent,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MAX_REVIEW_LENGTH = 400;
const MAX_MEDIA_COUNT = 10;
const REVIEW_INPUT_SCROLL_DELAY_MS = 80;
const MIN_REVIEW_FIELD_HEIGHT = 120;
const MIN_REVIEW_TEXT_INPUT_HEIGHT = 72;
const REVIEW_FIELD_EXTRA_HEIGHT = 48;
const KEYWORD_GROUP_LABELS = {
  food: '음식/가격',
  mood: '분위기',
  etc: '기타',
} as const;
const FOOD_CATEGORY_CODES = new Set([
  'daedong',
  'cafeteria',
  'restaurant',
  'cafe',
  'truck',
  'convenience-store',
  'korean',
  'chinese',
  'japanese',
  'western',
]);
const FNB_ONLY_KEYWORD_IDS = new Set(['adult']);
const KEYWORD_GROUP_ROWS: Record<keyof typeof KEYWORD_GROUP_LABELS, number[]> = {
  food: [4, 2],
  mood: [4, 2],
  etc: [4, 2],
};
const CHIP_SHADOW_STYLE = Platform.select({
  web: { boxShadow: '0px 1px 2px rgba(23, 23, 27, 0.1)' },
  default: {
    shadowColor: '#17171B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
const KEYWORD_CARD_BORDER_STYLE = { borderWidth: 0.6 };

export default function PlaceReviewWriteScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const reviewInputFocusedRef = React.useRef(false);
  const { placeId, placeName, categoryCode, reviewId } = useLocalSearchParams<{
    placeId?: string | string[];
    placeName?: string | string[];
    categoryCode?: string | string[];
    reviewId?: string | string[];
  }>();
  const numericPlaceId = Number(Array.isArray(placeId) ? placeId[0] : placeId);
  const resolvedPlaceName = Array.isArray(placeName) ? placeName[0] : placeName;
  const resolvedCategoryCode = Array.isArray(categoryCode) ? categoryCode[0] : categoryCode;
  const resolvedReviewId = Array.isArray(reviewId) ? reviewId[0] : reviewId;
  const isEditMode = Boolean(resolvedReviewId);
  const fallbackVisibleKeywords = React.useMemo(
    () => getVisibleReviewKeywords(resolvedCategoryCode),
    [resolvedCategoryCode]
  );
  const [catalogKeywords, setCatalogKeywords] = React.useState<PlaceReviewKeyword[] | null>(null);
  const visibleKeywords = catalogKeywords ?? fallbackVisibleKeywords;
  const visibleKeywordIds = React.useMemo(
    () => new Set(visibleKeywords.map((keyword) => keyword.id)),
    [visibleKeywords]
  );
  const [selectedKeywordIds, setSelectedKeywordIds] = React.useState<string[]>([]);
  const [mediaItems, setMediaItems] = React.useState<PlaceReviewMediaItem[]>([]);
  const [content, setContent] = React.useState('');
  const [reviewInputContentHeight, setReviewInputContentHeight] = React.useState(
    MIN_REVIEW_TEXT_INPUT_HEIGHT
  );
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [exitDialogOpen, setExitDialogOpen] = React.useState(false);
  const {
    isLoading: isUploading,
    error: uploadError,
    pickAndUpload,
  } = useMediaUpload('REVIEW_MEDIA');

  const isDirty =
    selectedKeywordIds.length > 0 || mediaItems.length > 0 || content.trim().length > 0;
  const canSubmit =
    selectedKeywordIds.length > 0 && content.trim().length > 0 && !isSubmitting && !isUploading;
  const reviewFieldHeight = Math.max(
    MIN_REVIEW_FIELD_HEIGHT,
    reviewInputContentHeight + REVIEW_FIELD_EXTRA_HEIGHT
  );
  const scrollBottomPadding = insets.bottom + 1 + (keyboardHeight > 0 ? keyboardHeight + 1 : 0);
  const scrollToReviewInput = React.useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, REVIEW_INPUT_SCROLL_DELAY_MS);
  }, []);

  React.useEffect(() => {
    setSelectedKeywordIds((previous) => previous.filter((id) => visibleKeywordIds.has(id)));
  }, [visibleKeywordIds]);

  React.useEffect(() => {
    if (!Number.isFinite(numericPlaceId)) return;

    let cancelled = false;
    getPlaceReviewKeywordCatalog(numericPlaceId)
      .then((keywords) => {
        if (!cancelled) setCatalogKeywords(keywords);
      })
      .catch(() => {
        if (!cancelled) setCatalogKeywords(null);
      });

    return () => {
      cancelled = true;
    };
  }, [numericPlaceId]);

  React.useEffect(() => {
    if (!resolvedReviewId) return;

    let cancelled = false;
    getPlaceReview(resolvedReviewId).then((review) => {
      if (cancelled || !review) return;
      setSelectedKeywordIds(review.keywordIds);
      setMediaItems(getPlaceReviewMediaItems(review));
      setContent(review.content);
    });

    return () => {
      cancelled = true;
    };
  }, [resolvedReviewId]);

  const handleReviewInputFocus = React.useCallback(() => {
    reviewInputFocusedRef.current = true;
    scrollToReviewInput();
  }, [scrollToReviewInput]);

  const handleReviewInputBlur = React.useCallback(() => {
    reviewInputFocusedRef.current = false;
  }, []);

  React.useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event: KeyboardEvent) => {
      setKeyboardHeight(event.endCoordinates.height);
      if (reviewInputFocusedRef.current) scrollToReviewInput();
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [scrollToReviewInput]);

  function handleBackPress() {
    if (isSubmitting) return;
    if (!isDirty) {
      router.back();
      return;
    }
    Keyboard.dismiss();
    setExitDialogOpen(true);
  }

  async function handleMediaAdd() {
    if (mediaItems.length >= MAX_MEDIA_COUNT || isUploading) return;
    const uploadedMedia = await pickAndUpload();
    if (uploadedMedia) {
      setMediaItems((previous) =>
        [
          ...previous,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            url: uploadedMedia.url,
            type: uploadedMedia.type,
            thumbnailUrl: uploadedMedia.thumbnailUrl ?? null,
          },
        ].slice(0, MAX_MEDIA_COUNT)
      );
    }
  }

  async function handleSubmit() {
    if (!canSubmit || !Number.isFinite(numericPlaceId) || !resolvedPlaceName) return;

    setIsSubmitting(true);
    try {
      if (resolvedReviewId) {
        await updatePlaceReview(resolvedReviewId, {
          content: content.trim(),
          imageUrls: getImageUrlsFromMediaItems(mediaItems),
          mediaItems,
          keywordIds: selectedKeywordIds,
        });
      } else {
        await createPlaceReview({
          placeId: numericPlaceId,
          placeName: resolvedPlaceName,
          authorUuid: user?.uuid ?? null,
          nickname: user?.nickname?.trim() || '닉네임',
          profileImageUrl: user?.profileImageUrl ?? null,
          content: content.trim(),
          imageUrls: getImageUrlsFromMediaItems(mediaItems),
          mediaItems,
          keywordIds: selectedKeywordIds,
        });
      }
      router.back();
    } catch (error) {
      const errorMessage = getReviewSubmitErrorMessage(error);
      if (errorMessage) showAlert('리뷰 등록 실패', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleKeyword(keywordId: string) {
    setSelectedKeywordIds((previous) => {
      if (previous.includes(keywordId)) return previous.filter((id) => id !== keywordId);
      if (keywordId === 'none') return ['none'];
      if (previous.includes('none')) return [keywordId];
      if (previous.length >= 5) return previous;
      return [...previous, keywordId];
    });
  }

  return (
    <View className="flex-1 bg-grey-02" style={{ paddingTop: insets.top }}>
      <View className="h-[56px] flex-row items-center border-b border-grey-10 bg-white px-4">
        <Pressable onPress={handleBackPress} hitSlop={8}>
          <ArrowLeftIcon size={22} className="text-grey-40" />
        </Pressable>
        <Text className="flex-1 text-center text-body02 text-black" numberOfLines={1}>
          {resolvedPlaceName ?? '장소명'}
        </Text>
        <Pressable onPress={handleBackPress} hitSlop={8}>
          <XIcon size={18} className="text-grey-30" />
        </Pressable>
      </View>

      <View className="flex-1">
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="py-5">
            <View className="px-4">
              <Text className="text-title03 text-black">
                어떤 곳이었나요? <Text className="text-body02 text-error">*</Text>
              </Text>
              <Text className="mt-0.5 text-caption02 text-grey-60">
                가장 공감되는 키워드를 골라주세요.(1-5개)
              </Text>
            </View>

            <View
              className="mx-4 mt-2 rounded-[12px] border-grey-02 bg-white px-[10px] py-4"
              style={KEYWORD_CARD_BORDER_STYLE}
            >
              <View style={{ gap: 18 }}>
                {(['food', 'mood', 'etc'] as const).map((group) => (
                  <KeywordGroup
                    key={group}
                    group={group}
                    keywords={visibleKeywords.filter((keyword) => keyword.group === group)}
                    selectedKeywordIds={selectedKeywordIds}
                    onToggleKeyword={toggleKeyword}
                  />
                ))}
              </View>
            </View>

            <View className="mt-6" style={{ gap: 8 }}>
              <View>
                <View className="flex-row items-center gap-1 px-4 pr-[14px]">
                  <Text className="text-title03 text-black">사진/영상 추가</Text>
                  <Text className="text-body06 text-grey-80">(선택)</Text>
                </View>
                <View className="flex-row items-center gap-1 px-4">
                  <View className="h-6 w-6 items-center justify-center opacity-80">
                    <InfoOutlineIcon size={14} className="text-grey-30" />
                  </View>
                  <Text className="flex-1 text-caption02 text-grey-60">
                    타인의 얼굴이 나오거나 장소와 관련없는 사진 등록은 자제해 주세요.
                  </Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingLeft: 16 }}
              >
                <Pressable
                  onPress={handleMediaAdd}
                  disabled={isUploading || mediaItems.length >= MAX_MEDIA_COUNT}
                  className="h-[90px] w-[90px] items-center justify-center rounded-[4px] border border-grey-20 bg-grey-02 pt-2"
                  style={{ gap: 4 }}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    <>
                      <PlusIcon size={24} className="text-grey-40" />
                      <Text className="text-caption02 text-grey-40">
                        {mediaItems.length}/{MAX_MEDIA_COUNT}
                      </Text>
                    </>
                  )}
                </Pressable>
                {mediaItems.map((item, index) => (
                  <View
                    key={`${item.id}-${index}`}
                    className="relative h-[90px] w-[90px] overflow-hidden rounded-[4px] border border-grey-10 bg-white"
                  >
                    {item.type === 'image' ? (
                      <Image
                        source={{ uri: item.url }}
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <ReviewVideoThumbnail uri={item.url} thumbnailUrl={item.thumbnailUrl} />
                    )}
                    <Pressable
                      onPress={() =>
                        setMediaItems((previous) => previous.filter((_, i) => i !== index))
                      }
                      className="absolute right-1 top-1 h-5 w-5 items-center justify-center rounded-full bg-grey-30"
                    >
                      <XIcon size={10} className="text-white" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
              {uploadError ? (
                <Text className="px-4 text-caption02 text-error">{uploadError}</Text>
              ) : null}
            </View>

            <View className="mt-6">
              <Text className="px-4 text-title03 text-black">
                리뷰를 작성해주세요 <Text className="text-body02 text-error">*</Text>
              </Text>
              <Text className="mt-0.5 px-4 text-caption02 text-grey-60">
                실제 방문 경험을 바탕으로 이 곳의 팁과 후기를 남겨주세요.
              </Text>
              <View
                className="mx-4 mt-3 justify-between rounded-[12px] border border-grey-02 bg-white px-2 py-3"
                style={{ height: reviewFieldHeight }}
              >
                <TextInput
                  multiline
                  textAlignVertical="top"
                  value={content}
                  onFocus={handleReviewInputFocus}
                  onBlur={handleReviewInputBlur}
                  onChangeText={(value) => setContent(value.slice(0, MAX_REVIEW_LENGTH))}
                  onContentSizeChange={(event) => {
                    const nextHeight = Math.ceil(event.nativeEvent.contentSize.height);
                    setReviewInputContentHeight(Math.max(MIN_REVIEW_TEXT_INPUT_HEIGHT, nextHeight));
                    if (reviewInputFocusedRef.current) scrollToReviewInput();
                  }}
                  placeholder={
                    '욕설, 비방, 광고성 내용, 타인의 명예를 훼손하는 리뷰 작성 시 서비스\n이용이 제한될 수 있습니다'
                  }
                  placeholderTextColor="#AEB2B6"
                  className="min-h-0 py-0 font-pretendard text-caption02 leading-[18px] text-grey-80"
                  style={{ height: reviewInputContentHeight }}
                  maxLength={MAX_REVIEW_LENGTH}
                />
                <Text className="text-right text-caption02 text-grey-30">
                  {content.length}/{MAX_REVIEW_LENGTH}
                </Text>
              </View>
              <Pressable
                disabled={!canSubmit}
                onPress={handleSubmit}
                className={cn(
                  'mx-4 mt-5 h-[36px] items-center justify-center rounded-[8px]',
                  canSubmit ? 'bg-blue-35' : 'bg-grey-30'
                )}
              >
                <Text className="text-body05 text-white">
                  {isSubmitting
                    ? isEditMode
                      ? '수정 중...'
                      : '등록 중...'
                    : isEditMode
                      ? '리뷰 수정'
                      : '리뷰 등록'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>

      <Dialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <DialogContent
          showCloseButton={false}
          className="mx-6 w-[320px] gap-4 rounded-xl border-2 border-grey-02 bg-white p-5"
        >
          <DialogHeader>
            <DialogTitle className="text-center text-body04 text-grey-80">
              리뷰 작성을 취소하시겠습니까?
            </DialogTitle>
            <DialogDescription className="hidden" />
          </DialogHeader>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setExitDialogOpen(false)}
              className="h-[36px] flex-1 items-center justify-center rounded-[8px] border border-grey-10 bg-white"
            >
              <Text className="text-body05 text-grey-40">취소</Text>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              className="h-[36px] flex-1 items-center justify-center rounded-[8px] bg-blue-35"
            >
              <Text className="text-body05 text-white">확인</Text>
            </Pressable>
          </View>
        </DialogContent>
      </Dialog>
    </View>
  );
}

function KeywordGroup({
  group,
  keywords,
  selectedKeywordIds,
  onToggleKeyword,
}: {
  group: keyof typeof KEYWORD_GROUP_LABELS;
  keywords: PlaceReviewKeyword[];
  selectedKeywordIds: string[];
  onToggleKeyword: (keywordId: string) => void;
}) {
  if (keywords.length === 0) return null;

  return (
    <View>
      <Text className="font-pretendard-normal mb-1 text-body06 text-grey-80">
        {KEYWORD_GROUP_LABELS[group]}
      </Text>
      <View className="gap-2">
        {chunkKeywords(keywords, KEYWORD_GROUP_ROWS[group]).map((row, rowIndex) => (
          <View key={`${group}-${rowIndex}`} className="flex-row items-start gap-2">
            {row.map((keyword) => {
              const selected = selectedKeywordIds.includes(keyword.id);
              return (
                <Pressable
                  key={keyword.id}
                  onPress={() => onToggleKeyword(keyword.id)}
                  className={cn(
                    'h-[30px] items-center justify-center rounded-full border px-2',
                    selected ? 'border-blue-10 bg-blue-05' : 'border-transparent bg-white'
                  )}
                  style={CHIP_SHADOW_STYLE}
                >
                  <Text
                    className={cn(
                      'text-center text-caption02',
                      selected ? 'text-blue-35' : 'text-grey-60'
                    )}
                  >
                    {keyword.emoji ? `${keyword.emoji} ${keyword.label}` : keyword.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

function getVisibleReviewKeywords(categoryCode?: string) {
  if (!categoryCode) return PLACE_REVIEW_KEYWORDS;

  if (isFoodCategoryCode(categoryCode)) return PLACE_REVIEW_KEYWORDS;

  return PLACE_REVIEW_KEYWORDS.filter(
    (keyword) => keyword.group !== 'food' && !FNB_ONLY_KEYWORD_IDS.has(keyword.id)
  );
}

function isFoodCategoryCode(categoryCode: string) {
  const normalizedCategoryCode = categoryCode.toLowerCase();
  return (
    FOOD_CATEGORY_CODES.has(normalizedCategoryCode) || normalizedCategoryCode.startsWith('daedong-')
  );
}

function getImageUrlsFromMediaItems(mediaItems: PlaceReviewMediaItem[]) {
  return mediaItems.filter((item) => item.type === 'image').map((item) => item.url);
}

function chunkKeywords<T>(items: T[], rowSizes: number[]) {
  const rows: T[][] = [];
  let start = 0;

  for (const size of rowSizes) {
    rows.push(items.slice(start, start + size));
    start += size;
  }

  if (start < items.length) rows.push(items.slice(start));
  return rows;
}

function getReviewSubmitErrorMessage(error: unknown): string | null {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response
  ) {
    const data = error.response.data as { message?: unknown };
    if (typeof data.message === 'string' && data.message.trim()) {
      if (data.message.includes('썸네일 이미지가 필요')) return null;
      return data.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    if (error.message.includes('썸네일 이미지가 필요')) return null;
    return error.message;
  }
  return '잠시 후 다시 시도해주세요.';
}
