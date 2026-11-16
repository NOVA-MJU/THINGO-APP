import AsyncStorage from '@react-native-async-storage/async-storage';

// 이 기기에서 리뷰를 쓴 장소 id. 지도의 "리뷰 남길 곳" 핀에서 빼는 데만 쓴다
// (서버에 "내가 쓴 리뷰" 목록 API가 없어서 기기에 기억한다. 다른 기기에서 쓴 리뷰는 모른다)
const REVIEWED_PLACES_KEY = 'thingo.reviewedPlaceIds';

export async function getReviewedPlaceIds(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(REVIEWED_PLACES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is number => typeof id === 'number') : [];
  } catch {
    return [];
  }
}

export async function markPlaceReviewed(placeId: number) {
  const ids = await getReviewedPlaceIds();
  if (ids.includes(placeId)) return;
  await AsyncStorage.setItem(REVIEWED_PLACES_KEY, JSON.stringify([...ids, placeId]));
}
