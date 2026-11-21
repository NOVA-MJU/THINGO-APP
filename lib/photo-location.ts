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
  return groupPhotosByDay(
    photos.filter((photo) => distanceMeters(photo.location, place) <= radiusMeters)
  );
}

// 사진을 찍은 날짜(기기 로컬)로 묶는다. 최근 날짜가 먼저, 같은 날 안에서는 찍은 순서대로
export function groupPhotosByDay<T extends { takenAt: number }>(
  photos: T[]
): { day: string; photos: T[] }[] {
  const days = photos.reduce((grouped, photo) => {
    const day = localDay(photo.takenAt);
    return grouped.set(day, [...(grouped.get(day) ?? []), photo]);
  }, new Map<string, T[]>());
  return [...days.entries()]
    .sort(([first], [second]) => second.localeCompare(first))
    .map(([day, list]) => ({
      day,
      photos: [...list].sort((first, second) => first.takenAt - second.takenAt),
    }));
}

// 반경 원을 감싸는 위경도 상자. 사진첩 전체를 훑을 때 네이티브 쪽에서 이 상자 밖 사진을 먼저 걸러낸다
export function boundsAround(center: GeoPoint, radiusMeters: number) {
  const latDelta = (radiusMeters / EARTH_RADIUS_METERS) * (180 / Math.PI);
  const lngDelta = latDelta / Math.cos((center.latitude * Math.PI) / 180);
  return {
    minLatitude: center.latitude - latDelta,
    maxLatitude: center.latitude + latDelta,
    minLongitude: center.longitude - lngDelta,
    maxLongitude: center.longitude + lngDelta,
  };
}

// 실내 GPS 오차 때문에 붙어 있는 가게는 사진만으로 어느 곳인지 정할 수 없다.
// 가장 가까운 가게보다 이만큼까지 더 먼 가게는 같은 후보로 보고 사용자가 고르게 한다
export const PLACE_AMBIGUITY_METERS = 10;

export type VisitedPlaceGroup = {
  // 후보 가게. 첫 번째가 사진에서 가장 가까운 가게(핀 위치)이고 나머지는 가까운 순
  candidates: { placeId: number; distanceMeters: number }[];
  photoIds: string[];
  // 가장 최근 사진 촬영 시각 (ms)
  lastVisitAt: number;
};

// 사진을 "가장 가까운 가게" 기준으로 묶고, 그 가게와 거리가 비슷한(PLACE_AMBIGUITY_METERS 안) 가게를 후보로 함께 둔다
// 최근 방문 순으로 돌려준다
export function groupVisitedPlaces(
  photos: LocatedPhoto[],
  places: (GeoPoint & { id: number })[],
  radiusMeters = DEFAULT_PLACE_RADIUS_METERS,
  ambiguityMeters = PLACE_AMBIGUITY_METERS
): VisitedPlaceGroup[] {
  const groups: {
    anchorId: number;
    distances: Map<number, number>;
    photoIds: string[];
    lastVisitAt: number;
  }[] = [];
  // 사진이 수천 장이면 사진 x 가게 수만큼 거리 계산을 하게 되므로, 위경도 차이로 먼저 걸러 계산을 줄인다
  const latDelta = (radiusMeters / EARTH_RADIUS_METERS) * (180 / Math.PI);
  for (const photo of photos) {
    const lngDelta = latDelta / Math.cos((photo.location.latitude * Math.PI) / 180);
    const nearby: { placeId: number; distanceMeters: number }[] = [];
    for (const place of places) {
      if (
        Math.abs(place.latitude - photo.location.latitude) > latDelta ||
        Math.abs(place.longitude - photo.location.longitude) > lngDelta
      )
        continue;
      const distance = distanceMeters(photo.location, place);
      if (distance <= radiusMeters) nearby.push({ placeId: place.id, distanceMeters: distance });
    }
    if (!nearby.length) continue;
    nearby.sort((a, b) => a.distanceMeters - b.distanceMeters);
    const nearest = nearby[0];
    const kept = nearby.filter(
      (candidate) => candidate.distanceMeters <= nearest.distanceMeters + ambiguityMeters
    );
    // 같은 자리에서 찍은 사진도 GPS가 조금씩 달라 가장 가까운 가게가 바뀐다.
    // 기존 묶음의 기준 가게가 이 사진의 후보이고, 이 사진의 기준 가게가 그 묶음의 후보면 같은 곳으로 합친다
    let group = groups.find(
      (item) =>
        item.distances.has(nearest.placeId) &&
        kept.some((candidate) => candidate.placeId === item.anchorId)
    );
    if (!group) {
      group = {
        anchorId: nearest.placeId,
        distances: new Map<number, number>(),
        photoIds: [],
        lastVisitAt: 0,
      };
      groups.push(group);
    }
    for (const candidate of kept) {
      const previous = group.distances.get(candidate.placeId);
      group.distances.set(
        candidate.placeId,
        previous === undefined
          ? candidate.distanceMeters
          : Math.min(previous, candidate.distanceMeters)
      );
    }
    group.photoIds.push(photo.id);
    group.lastVisitAt = Math.max(group.lastVisitAt, photo.takenAt);
  }

  return groups
    .map(({ anchorId, ...group }) => ({
      candidates: [...group.distances.entries()]
        .map(([placeId, distance]) => ({ placeId, distanceMeters: distance }))
        .sort((a, b) =>
          a.placeId === anchorId
            ? -1
            : b.placeId === anchorId
              ? 1
              : a.distanceMeters - b.distanceMeters
        ),
      photoIds: group.photoIds,
      lastVisitAt: group.lastVisitAt,
    }))
    .sort((a, b) => b.lastVisitAt - a.lastVisitAt);
}

// 이 장소 반경 안 사진 중, 주변 가게들과 비교해 이 장소가 후보(가장 가까운 가게와 ambiguityMeters 안)인 사진만 남긴다
// 지도 "다녀온 곳" 핀(groupVisitedPlaces)과 같은 기준이라 핀의 사진 수와 장소 상세의 사진 수가 맞는다
export function filterPhotosForPlace<T extends LocatedPhoto>(
  photos: T[],
  place: GeoPoint & { id: number },
  nearbyPlaces: (GeoPoint & { id: number })[],
  radiusMeters = DEFAULT_PLACE_RADIUS_METERS,
  ambiguityMeters = PLACE_AMBIGUITY_METERS
): T[] {
  const others = nearbyPlaces.filter((other) => other.id !== place.id);
  return photos.filter((photo) => {
    const distance = distanceMeters(photo.location, place);
    if (distance > radiusMeters) return false;
    return others.every(
      (other) => distance <= distanceMeters(photo.location, other) + ambiguityMeters
    );
  });
}

// 여러 장소를 모두 감싸는 위경도 상자 (각 장소 반경 포함)
export function boundsAroundAll(points: GeoPoint[], radiusMeters: number) {
  const boxes = points.map((point) => boundsAround(point, radiusMeters));
  return {
    minLatitude: Math.min(...boxes.map((box) => box.minLatitude)),
    maxLatitude: Math.max(...boxes.map((box) => box.maxLatitude)),
    minLongitude: Math.min(...boxes.map((box) => box.minLongitude)),
    maxLongitude: Math.max(...boxes.map((box) => box.maxLongitude)),
  };
}

// 가게 도로명 주소에서 건물 키를 만든다. 같은 건물 가게는 좌표가 조금씩 달라도 도로명 주소(번지)가 같다.
// 뒤에 붙은 층·호수·괄호(동 이름)는 떼어 낸다. 주소가 없으면 가게 하나를 건물 하나로 본다
// 예: '서울 서대문구 증가로 150 2층' -> '서울 서대문구 증가로 150'
export function buildingKeyOf(address: string | null | undefined, placeId: number) {
  const key = (address ?? '')
    .trim()
    .replace(/\s*\(.*\)$/, '')
    .replace(/\s*,.*$/, '')
    .replace(/\s+(지하|지상)?\s*\d+\s*(층|호).*$/, '')
    .trim();
  return key || `place:${placeId}`;
}
