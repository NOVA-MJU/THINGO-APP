import AsyncStorage from '@react-native-async-storage/async-storage';

// "여기서 찍은 내 사진" 제안에서 사용자가 X로 숨긴 사진 (장소 id → 사진 id 목록).
// 띵고는 새로 나온 서비스라 사진첩에는 지금은 없어진 예전 가게나 옆 가게 사진이 섞인다. 사진 위치만으로는 가릴 수 없어서
// 사용자가 "이 가게 사진이 아니에요" / "지금은 없어진 가게예요"를 고르면 그 장소 제안과 다녀온 곳 핀에서 뺀다.
// 리뷰에 이미 올린 사진도 같은 이유(다시 권할 필요가 없다)로 여기에 넣는다 (app/maps/reviews/write.tsx).
// 사진 위치와 마찬가지로 기기에만 둔다 (lib/maps/reviewed-places.ts와 같은 방식)
const DISMISSED_PLACE_PHOTOS_KEY = 'thingo.dismissedPlacePhotos.v1';

export type PhotoDismissReason = 'not-this-place' | 'place-gone';

type DismissedPlacePhotos = Record<string, string[]>;

export async function getDismissedPlacePhotos(): Promise<DismissedPlacePhotos> {
  try {
    const raw = await AsyncStorage.getItem(DISMISSED_PLACE_PHOTOS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as DismissedPlacePhotos) : {};
  } catch {
    // 저장된 값이 깨졌으면 숨긴 사진이 없는 것으로 본다 (다시 숨기면 된다)
    return {};
  }
}

export async function dismissPlacePhotos(placeIds: number[], photoIds: string[]) {
  const dismissed = await getDismissedPlacePhotos();
  const updated = Object.fromEntries(
    placeIds.map((placeId) => [
      String(placeId),
      [...new Set([...(dismissed[String(placeId)] ?? []), ...photoIds])],
    ])
  );
  await AsyncStorage.setItem(
    DISMISSED_PLACE_PHOTOS_KEY,
    JSON.stringify({ ...dismissed, ...updated })
  );
}

// 이미 올린 내 리뷰 사진 중 사진첩과 비교를 마친 이미지 주소. 장소를 열 때마다 같은 사진을 다시 내려받아 비교하지 않게 기억한다
const CHECKED_REVIEW_IMAGES_KEY = 'thingo.checkedReviewImageUrls.v1';

export async function getCheckedReviewImageUrls(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(CHECKED_REVIEW_IMAGES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((url): url is string => typeof url === 'string')
      : [];
  } catch {
    // 깨졌으면 다시 비교하면 된다
    return [];
  }
}

export async function markReviewImagesChecked(imageUrls: string[]) {
  if (!imageUrls.length) return;
  const checked = await getCheckedReviewImageUrls();
  await AsyncStorage.setItem(
    CHECKED_REVIEW_IMAGES_KEY,
    JSON.stringify([...new Set([...checked, ...imageUrls])])
  );
}
