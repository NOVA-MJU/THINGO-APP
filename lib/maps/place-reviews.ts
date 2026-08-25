import { client } from '@/api/client';

export type PlaceReviewKeywordGroup = 'food' | 'mood' | 'etc';

export type PlaceReviewKeyword = {
  id: string;
  label: string;
  emoji: string;
  group: PlaceReviewKeywordGroup;
};

export type PlaceReviewMediaItem = {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string | null;
};

export type PlaceReview = {
  id: string;
  placeId: number;
  placeName: string;
  authorUuid?: string | null;
  nickname: string;
  profileImageUrl: string | null;
  content: string;
  imageUrls: string[];
  mediaItems: PlaceReviewMediaItem[];
  keywordIds: string[];
  likeCount: number;
  liked: boolean;
  isMine?: boolean;
  canDelete?: boolean;
  createdAt: string;
};

export type CreatePlaceReviewInput = {
  placeId: number;
  placeName: string;
  authorUuid: string | null;
  nickname: string;
  profileImageUrl: string | null;
  content: string;
  imageUrls: string[];
  mediaItems?: PlaceReviewMediaItem[];
  keywordIds: string[];
};

export type UpdatePlaceReviewInput = Pick<
  CreatePlaceReviewInput,
  'content' | 'imageUrls' | 'mediaItems' | 'keywordIds'
>;

export type PlaceReviewSort = 'latest' | 'likes';

export type PlaceReviewPage = {
  reviews: PlaceReview[];
  nextCursor: string | null;
  hasNext: boolean;
  totalElements: number;
  sort: PlaceReviewSort;
};

export type PlaceReviewMediaStripItem = {
  reviewId: string;
  mediaItem: PlaceReviewMediaItem;
};

type ApiSuccess<T> = {
  data: T;
};

type BackendReviewKeywordCode =
  | 'TASTY'
  | 'REVISIT'
  | 'VALUE'
  | 'GENEROUS'
  | 'FRESH'
  | 'NOT_BAD'
  | 'CLEAN_LOOK'
  | 'COZY'
  | 'GOOD_VIBE'
  | 'LUXURIOUS'
  | 'FOCUS'
  | 'SOLO_DINING'
  | 'KIND'
  | 'HYGIENIC'
  | 'CLEAN_RESTROOM'
  | 'GROUP_OK'
  | 'ADULT_MEAL'
  | 'NONE_APPROPRIATE';

type BackendMediaType = 'IMAGE' | 'VIDEO';

type BackendKeywordTag = {
  code?: string | null;
  emoji?: string | null;
  label?: string | null;
};

type BackendMediaInfo = {
  url?: string | null;
  thumbnailUrl?: string | null;
  mediaType?: BackendMediaType | string | null;
  sortOrder?: number | null;
};

type BackendAuthorInfo = {
  authorUuid?: string | null;
  nickname?: string | null;
  profileImageUrl?: string | null;
};

type BackendReviewSummary = {
  reviewUuid?: string | null;
  pinId?: number | null;
  author?: BackendAuthorInfo | null;
  keywords?: BackendKeywordTag[] | null;
  content?: string | null;
  media?: BackendMediaInfo[] | null;
  likeCount?: number | null;
  isLiked?: boolean | null;
  isMine?: boolean | null;
  canDelete?: boolean | null;
  createdAt?: string | null;
};

type BackendReviewCursorPage = {
  content?: BackendReviewSummary[] | null;
  nextCursor?: string | null;
  hasNext?: boolean | null;
  totalElements?: number | null;
  sort?: PlaceReviewSort | string | null;
};

type BackendLikeResult = {
  liked?: boolean | null;
  likeCount?: number | null;
};

type BackendMediaStripItem = BackendMediaInfo & {
  reviewUuid?: string | null;
};

type BackendKeywordGroup = 'FOOD_PRICE' | 'MOOD' | 'ETC';

type BackendGroupCatalog = {
  group?: BackendKeywordGroup | string | null;
  label?: string | null;
  keywords?: BackendKeywordTag[] | null;
};

type BackendKeywordCatalog = {
  groups?: BackendGroupCatalog[] | null;
};

type ReviewCreateRequest = {
  pinId: number;
  keywords: BackendReviewKeywordCode[];
  content: string;
  media?: {
    url: string;
    thumbnailUrl?: string | null;
    mediaType: BackendMediaType;
  }[];
};

const DEFAULT_REVIEW_PAGE_SIZE = 50;

const BACKEND_KEYWORD_BY_LOCAL_ID: Record<string, BackendReviewKeywordCode> = {
  tasty: 'TASTY',
  again: 'REVISIT',
  value: 'VALUE',
  generous: 'GENEROUS',
  fresh: 'FRESH',
  'not-bad': 'NOT_BAD',
  neat: 'CLEAN_LOOK',
  cozy: 'COZY',
  open: 'GOOD_VIBE',
  premium: 'LUXURIOUS',
  focus: 'FOCUS',
  solo: 'SOLO_DINING',
  kind: 'KIND',
  clean: 'HYGIENIC',
  'toilet-clean': 'CLEAN_RESTROOM',
  takeout: 'GROUP_OK',
  adult: 'ADULT_MEAL',
  none: 'NONE_APPROPRIATE',
};

const LOCAL_ID_BY_BACKEND_KEYWORD = Object.fromEntries(
  Object.entries(BACKEND_KEYWORD_BY_LOCAL_ID).map(([localId, backendCode]) => [
    backendCode,
    localId,
  ])
) as Record<string, string>;

export const PLACE_REVIEW_KEYWORDS: PlaceReviewKeyword[] = [
  { id: 'tasty', label: '맛있음', emoji: '😋', group: 'food' },
  { id: 'again', label: '또갈집', emoji: '✌🏻', group: 'food' },
  { id: 'value', label: '가성비', emoji: '💸', group: 'food' },
  { id: 'generous', label: '양 혜자', emoji: '🍚', group: 'food' },
  { id: 'fresh', label: '재료 신선', emoji: '🌿', group: 'food' },
  { id: 'not-bad', label: '낫배드', emoji: '😌', group: 'food' },
  { id: 'neat', label: '깔끔함', emoji: '✨', group: 'mood' },
  { id: 'cozy', label: '아늑함', emoji: '🛋️', group: 'mood' },
  { id: 'open', label: '느좋', emoji: '🎧', group: 'mood' },
  { id: 'premium', label: '고급짐', emoji: '👑', group: 'mood' },
  { id: 'focus', label: '집중 굿', emoji: '💻', group: 'mood' },
  { id: 'solo', label: '혼밥 굿', emoji: '👤', group: 'mood' },
  { id: 'kind', label: '친절함', emoji: '🥰', group: 'etc' },
  { id: 'clean', label: '청결함', emoji: '🫧', group: 'etc' },
  { id: 'toilet-clean', label: '화장실 깨끗', emoji: '🚻', group: 'etc' },
  { id: 'takeout', label: '단체 가능', emoji: '👥', group: 'etc' },
  { id: 'adult', label: '어른 식사 대접', emoji: '🙇🏻', group: 'etc' },
  { id: 'none', label: '적절한 키워드 없음', emoji: '', group: 'etc' },
];

export function getPlaceReviewKeyword(id: string) {
  const localId = LOCAL_ID_BY_BACKEND_KEYWORD[id] ?? id;
  return PLACE_REVIEW_KEYWORDS.find((keyword) => keyword.id === localId) ?? null;
}

export function getPlaceReviewMediaItems(review: Pick<PlaceReview, 'imageUrls' | 'mediaItems'>) {
  if (review.mediaItems.length > 0) return review.mediaItems;

  return review.imageUrls.map((url, index) => ({
    id: `legacy-image-${index}`,
    url,
    type: 'image' as const,
  }));
}

export async function getPlaceReviews(
  placeId: number,
  options: { sort?: PlaceReviewSort; cursor?: string | null; size?: number } = {}
): Promise<PlaceReview[]> {
  const page = await getPlaceReviewPage(placeId, options);
  return page.reviews;
}

export async function getPlaceReviewPage(
  placeId: number,
  { sort = 'latest', cursor, size = DEFAULT_REVIEW_PAGE_SIZE }: {
    sort?: PlaceReviewSort;
    cursor?: string | null;
    size?: number;
  } = {}
): Promise<PlaceReviewPage> {
  const { data } = await client.get<ApiSuccess<BackendReviewCursorPage>>('/reviews', {
    params: {
      pinId: placeId,
      sort,
      cursor: cursor || undefined,
      size,
    },
  });
  const page = data.data;

  return {
    reviews: (page.content ?? []).map((review) => normalizeReview(review, placeId)),
    nextCursor: page.nextCursor ?? null,
    hasNext: Boolean(page.hasNext),
    totalElements: Number(page.totalElements ?? page.content?.length ?? 0),
    sort: page.sort === 'likes' ? 'likes' : 'latest',
  };
}

export async function getPlaceReview(reviewId: string): Promise<PlaceReview | null> {
  const { data } = await client.get<ApiSuccess<BackendReviewSummary>>(
    `/reviews/${encodeURIComponent(reviewId)}`
  );
  return normalizeReview(data.data);
}

export async function createPlaceReview(input: CreatePlaceReviewInput): Promise<PlaceReview> {
  const body: ReviewCreateRequest = {
    pinId: input.placeId,
    keywords: input.keywordIds.map(toBackendKeywordCode).filter(isBackendKeywordCode),
    content: input.content,
    media: createMediaRequest(input.mediaItems ?? createImageMediaItems(input.imageUrls)),
  };

  const { data } = await client.post<ApiSuccess<BackendReviewSummary>>('/reviews', body);
  return normalizeReview(data.data, input.placeId);
}

export async function updatePlaceReview(
  reviewId: string,
  _input: UpdatePlaceReviewInput
): Promise<PlaceReview | null> {
  throw new Error(`리뷰 수정 API가 제공되지 않았습니다. reviewId=${reviewId}`);
}

export async function deletePlaceReview(reviewId: string): Promise<void> {
  await client.delete(`/reviews/${encodeURIComponent(reviewId)}`);
}

export async function togglePlaceReviewLike(reviewId: string): Promise<PlaceReview | null> {
  const { data } = await client.post<ApiSuccess<BackendLikeResult>>(
    `/reviews/${encodeURIComponent(reviewId)}/like`
  );
  const detail = await getPlaceReview(reviewId);
  if (!detail) return null;

  return {
    ...detail,
    liked: Boolean(data.data.liked),
    likeCount: Number(data.data.likeCount ?? detail.likeCount),
  };
}

export async function getPlaceReviewMediaStrip(
  placeId: number,
  limit = 10
): Promise<PlaceReviewMediaStripItem[]> {
  const { data } = await client.get<ApiSuccess<BackendMediaStripItem[]>>('/reviews/media', {
    params: { pinId: placeId, limit },
  });

  return (data.data ?? [])
    .map((item, index) => {
      const mediaItem = normalizeMediaItem(item, index, item.reviewUuid ?? 'strip');
      if (!item.reviewUuid || !mediaItem) return null;
      return { reviewId: item.reviewUuid, mediaItem };
    })
    .filter(isNonNullable);
}

export async function getPlaceReviewKeywordCatalog(placeId?: number): Promise<PlaceReviewKeyword[]> {
  const { data } = await client.get<ApiSuccess<BackendKeywordCatalog>>('/reviews/keywords', {
    params: Number.isFinite(placeId) ? { pinId: placeId } : undefined,
  });

  const keywords = (data.data.groups ?? [])
    .flatMap((group) =>
      (group.keywords ?? []).map((keyword) => normalizeKeyword(keyword, group.group))
    )
    .filter(isNonNullable);

  return keywords.length > 0 ? keywords : PLACE_REVIEW_KEYWORDS;
}

function normalizeReview(review: BackendReviewSummary, fallbackPlaceId = 0): PlaceReview {
  const reviewId = String(review.reviewUuid ?? '');
  const mediaItems = (review.media ?? [])
    .slice()
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
    .map((mediaItem, index) => normalizeMediaItem(mediaItem, index, reviewId))
    .filter(isNonNullable);

  return {
    id: reviewId,
    placeId: Number(review.pinId ?? fallbackPlaceId),
    placeName: '',
    authorUuid: review.author?.authorUuid ?? null,
    nickname: review.author?.nickname?.trim() || '닉네임',
    profileImageUrl: review.author?.profileImageUrl ?? null,
    content: String(review.content ?? ''),
    imageUrls: mediaItems.filter((item) => item.type === 'image').map((item) => item.url),
    mediaItems,
    keywordIds: (review.keywords ?? [])
      .map((keyword) => LOCAL_ID_BY_BACKEND_KEYWORD[String(keyword.code ?? '')])
      .filter(isString),
    likeCount: Number(review.likeCount ?? 0),
    liked: Boolean(review.isLiked),
    isMine: Boolean(review.isMine),
    canDelete: Boolean(review.canDelete),
    createdAt: String(review.createdAt ?? new Date().toISOString()),
  };
}

function normalizeMediaItem(
  mediaItem: BackendMediaInfo,
  index: number,
  reviewId: string
): PlaceReviewMediaItem | null {
  if (!mediaItem.url) return null;
  const type = mediaItem.mediaType === 'VIDEO' ? 'video' : 'image';

  return {
    id: `${reviewId}-media-${mediaItem.sortOrder ?? index}`,
    url: mediaItem.url,
    type,
    thumbnailUrl:
      type === 'video' && mediaItem.thumbnailUrl === mediaItem.url
        ? null
        : (mediaItem.thumbnailUrl ?? (type === 'image' ? mediaItem.url : null)),
  };
}

function normalizeKeyword(
  keyword: BackendKeywordTag,
  backendGroup?: BackendKeywordGroup | string | null
): PlaceReviewKeyword | null {
  const backendCode = String(keyword.code ?? '');
  const localId = LOCAL_ID_BY_BACKEND_KEYWORD[backendCode];
  if (!localId) return null;

  const fallbackKeyword = getPlaceReviewKeyword(localId);
  return {
    id: localId,
    label: keyword.label?.trim() || fallbackKeyword?.label || localId,
    emoji: keyword.emoji ?? fallbackKeyword?.emoji ?? '',
    group: toLocalKeywordGroup(backendGroup) ?? fallbackKeyword?.group ?? 'etc',
  };
}

function toLocalKeywordGroup(group?: BackendKeywordGroup | string | null): PlaceReviewKeywordGroup | null {
  switch (group) {
    case 'FOOD_PRICE':
      return 'food';
    case 'MOOD':
      return 'mood';
    case 'ETC':
      return 'etc';
    default:
      return null;
  }
}

function createMediaRequest(mediaItems: PlaceReviewMediaItem[]): ReviewCreateRequest['media'] {
  return mediaItems.map((item) => ({
    url: item.url,
    thumbnailUrl: item.thumbnailUrl ?? item.url,
    mediaType: item.type === 'video' ? 'VIDEO' : 'IMAGE',
  }));
}

function createImageMediaItems(imageUrls: string[]): PlaceReviewMediaItem[] {
  return imageUrls.map((url, index) => ({
    id: `image-${index}`,
    url,
    thumbnailUrl: url,
    type: 'image',
  }));
}

function toBackendKeywordCode(keywordId: string) {
  return BACKEND_KEYWORD_BY_LOCAL_ID[keywordId] ?? keywordId;
}

function isBackendKeywordCode(value: string): value is BackendReviewKeywordCode {
  return Object.values(BACKEND_KEYWORD_BY_LOCAL_ID).includes(value as BackendReviewKeywordCode);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNonNullable<T>(value: T | null | undefined): value is T {
  return value != null;
}
