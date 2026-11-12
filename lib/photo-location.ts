// 리뷰 작성 시 "이 장소에서 찍은 사진"을 고르는 순수 함수 모음.
// 사진 위치는 기기 안에서만 비교하고 서버로 보내지 않는다.

export type GeoPoint = { latitude: number; longitude: number };

export type LocatedPhoto = {
  id: string;
  // 촬영 시각 (ms)
  takenAt: number;
  location: GeoPoint;
};

export type PhotoVisit<T extends LocatedPhoto> = {
  // 'YYYY-MM-DD' (기기 로컬 날짜)
  day: string;
  photos: T[];
};

// 실내 GPS 오차가 20~50m라 70m까지 같은 장소로 본다. 학교 앞 상권은 가게가 붙어 있어 더 넓히면 옆 가게 사진이 섞인다
export const DEFAULT_PLACE_RADIUS_METERS = 70;

const EARTH_RADIUS_METERS = 6_371_000;

export function distanceMeters(a: GeoPoint, b: GeoPoint) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

function localDay(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 반경 안 사진을 방문일(같은 날짜)로 묶는다. 최근 방문이 먼저, 같은 날 안에서는 찍은 순서대로
export function groupPhotosNearPlace<T extends LocatedPhoto>(
  photos: T[],
  place: GeoPoint,
  radiusMeters = DEFAULT_PLACE_RADIUS_METERS
): PhotoVisit<T>[] {
  const visits = new Map<string, T[]>();
  for (const photo of photos) {
    if (distanceMeters(photo.location, place) > radiusMeters) continue;
    const day = localDay(photo.takenAt);
    visits.set(day, [...(visits.get(day) ?? []), photo]);
  }
  return [...visits.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([day, list]) => ({ day, photos: list.sort((x, y) => x.takenAt - y.takenAt) }));
}
