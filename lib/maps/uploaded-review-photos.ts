import AsyncStorage from '@react-native-async-storage/async-storage';

// 내 리뷰에 올린 사진첩 사진 (리뷰 id -> 장소 id, 사진첩 id와 올린 이미지 주소).
// 이미 올린 사진은 "여기서 찍은 내 사진"과 다녀온 곳 핀에서 다시 권하지 않는다.
// 리뷰별로 기억하는 이유: 리뷰를 고쳐 사진을 빼거나 리뷰를 지우면 그 사진을 다시 보여줘야 해서다.
// 사진 위치와 마찬가지로 기기에만 둔다 (서버에 "내가 쓴 리뷰" 목록 API가 없다)
const UPLOADED_REVIEW_PHOTOS_KEY = 'thingo.uploadedReviewPhotos.v1';
// 사진첩과 그림 비교를 마친 내 리뷰 이미지 주소. 장소를 열 때마다 같은 이미지를 다시 내려받아 비교하지 않게 기억한다
const CHECKED_REVIEW_IMAGES_KEY = 'thingo.checkedReviewImageUrls.v1';

export type UploadedReviewPhoto = { photoId: string; url: string };
type UploadedReviewPhotos = Record<string, { placeId: number; photos: UploadedReviewPhoto[] }>;

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    // 깨진 값이면 비어 있는 것으로 본다 (다시 비교하거나 다시 올리면 채워진다)
    return fallback;
  }
}

function getUploadedReviewPhotos() {
  return readJson<UploadedReviewPhotos>(UPLOADED_REVIEW_PHOTOS_KEY, {});
}

// 모든 리뷰에 올린 사진첩 사진 id
export async function getUploadedPhotoIds(): Promise<string[]> {
  const uploaded = await getUploadedReviewPhotos();
  return Object.values(uploaded).flatMap((review) => review.photos.map((photo) => photo.photoId));
}

// 리뷰에 올린 사진첩 사진 id -> 그 리뷰의 가게 id. 같은 방문에 찍은 나머지 사진을 그 가게로 정하는 데 쓴다
// (lib/photo-location.ts assignPhotosToUploadedPlaces)
export async function getUploadedPhotoPlaces(): Promise<Map<string, number>> {
  const uploaded = await getUploadedReviewPhotos();
  return new Map(
    Object.values(uploaded).flatMap((review) =>
      review.photos.map((photo) => [photo.photoId, review.placeId] as const)
    )
  );
}

// 리뷰를 올리거나 고친 뒤: 지금 리뷰에 남아 있는 사진만 남기고, 이번에 사진첩에서 올린 사진을 더한다
export async function rememberReviewPhotos(
  reviewId: string,
  placeId: number,
  mediaItems: { url: string; libraryPhotoId?: string | null }[]
) {
  const uploaded = await getUploadedReviewPhotos();
  const currentUrls = mediaItems.map((item) => item.url);
  const keptPhotos = (uploaded[reviewId]?.photos ?? []).filter((photo) =>
    currentUrls.includes(photo.url)
  );
  const addedPhotos = mediaItems.flatMap((item) =>
    item.libraryPhotoId ? [{ photoId: item.libraryPhotoId, url: item.url }] : []
  );
  await saveReviewPhotos(uploaded, reviewId, placeId, [...keptPhotos, ...addedPhotos]);
  await markReviewImagesChecked(addedPhotos.map((photo) => photo.url));
}

// 그림 비교로 찾은 예전 리뷰 사진을 그 리뷰에 더한다
export async function addMatchedReviewPhotos(
  reviewId: string,
  placeId: number,
  photos: UploadedReviewPhoto[]
) {
  if (!photos.length) return;
  const uploaded = await getUploadedReviewPhotos();
  await saveReviewPhotos(uploaded, reviewId, placeId, [
    ...(uploaded[reviewId]?.photos ?? []),
    ...photos,
  ]);
}

// 리뷰를 지우면 그 리뷰에 올린 사진을 다시 권한다
export async function forgetReviewPhotos(reviewId: string) {
  const uploaded = await getUploadedReviewPhotos();
  if (!uploaded[reviewId]) return;
  const { [reviewId]: _removed, ...rest } = uploaded;
  await AsyncStorage.setItem(UPLOADED_REVIEW_PHOTOS_KEY, JSON.stringify(rest));
}

async function saveReviewPhotos(
  uploaded: UploadedReviewPhotos,
  reviewId: string,
  placeId: number,
  photos: UploadedReviewPhoto[]
) {
  const uniquePhotos = [...new Map(photos.map((photo) => [photo.photoId, photo])).values()];
  await AsyncStorage.setItem(
    UPLOADED_REVIEW_PHOTOS_KEY,
    JSON.stringify({ ...uploaded, [reviewId]: { placeId, photos: uniquePhotos } })
  );
}

export async function getCheckedReviewImageUrls(): Promise<string[]> {
  const parsed = await readJson<unknown>(CHECKED_REVIEW_IMAGES_KEY, []);
  return Array.isArray(parsed)
    ? parsed.filter((url): url is string => typeof url === 'string')
    : [];
}

export async function markReviewImagesChecked(imageUrls: string[]) {
  if (!imageUrls.length) return;
  const checked = await getCheckedReviewImageUrls();
  await AsyncStorage.setItem(
    CHECKED_REVIEW_IMAGES_KEY,
    JSON.stringify([...new Set([...checked, ...imageUrls])])
  );
}
