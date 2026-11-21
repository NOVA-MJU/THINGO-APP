import AsyncStorage from '@react-native-async-storage/async-storage';

// "여기서 찍은 내 사진" 제안에서 사용자가 X로 숨긴 사진 (장소 id → 사진 id 목록).
// 띵고는 새로 나온 서비스라 사진첩에는 지금은 없어진 예전 가게나 옆 가게 사진이 섞인다. 사진 위치만으로는 가릴 수 없어서
// 사용자가 "이 가게 사진이 아니에요" / "지금은 없어진 가게예요"를 고르면 그 장소 제안과 다녀온 곳 핀에서 뺀다.
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
