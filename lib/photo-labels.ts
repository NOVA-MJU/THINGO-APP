import PhotoLocationScan from '@/modules/photo-location-scan';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 사진에 찍힌 것 라벨(기기 안 Apple Vision 분류). 사진마다 이미지를 열어 분류해서 무거우므로
// 한 번 분류한 결과는 기기에 기억해 두고 새 사진만 분류한다. 라벨은 서버로 보내지 않는다
const PHOTO_LABELS_KEY = 'thingo.photoLabels.v1';

// 앱 실행 동안 하나만 있는 메모리 캐시 (AsyncStorage를 매번 다시 읽지 않게)
let cache: Record<string, string[]> | null = null;

async function loadCache() {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(PHOTO_LABELS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    cache = parsed && typeof parsed === 'object' ? (parsed as Record<string, string[]>) : {};
  } catch {
    // 저장된 값이 깨졌으면 처음부터 다시 분류하면 된다
    cache = {};
  }
  return cache;
}

// 사진 id → 라벨. 기기에 이미지가 없어(iCloud에만 있는 사진) 분류하지 못한 사진은 결과에 없다
export async function getPhotoLabels(ids: string[]): Promise<Record<string, string[]>> {
  const labels = await loadCache();
  const missing = ids.filter((id) => !(id in labels));
  if (missing.length && PhotoLocationScan) {
    Object.assign(labels, await PhotoLocationScan.classifyPhotos(missing));
    AsyncStorage.setItem(PHOTO_LABELS_KEY, JSON.stringify(labels)).catch(() => {
      // 저장에 실패해도 이번 실행에서는 메모리 캐시로 쓰고, 다음 실행 때 다시 분류한다
    });
  }
  return Object.fromEntries(ids.filter((id) => labels[id]).map((id) => [id, labels[id]]));
}
