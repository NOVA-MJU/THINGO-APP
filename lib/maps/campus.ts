// 명지대학교 인문캠퍼스 기준 좌표.
// 지도 화면과 층별 안내도 화면이 같은 값으로 건물 상세를 조회해야 react-query 캐시(['map-building-detail', id])를
// 공유할 수 있어서 공용 모듈로 분리해뒀다.
export const CAMPUS_LATITUDE = 37.579711;
export const CAMPUS_LONGITUDE = 126.923186;
export const CAMPUS_ZOOM = 16;

// 현위치 버튼 클릭 시 "캠퍼스와 너무 멀다"고 판단하는 기준 반경(km)
export const CAMPUS_RADIUS_KM = 5;

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

// 두 좌표 간 거리(km)를 하버사인 공식으로 계산
export function getDistanceFromCampusKm(latitude: number, longitude: number) {
  const dLat = toRadians(latitude - CAMPUS_LATITUDE);
  const dLon = toRadians(longitude - CAMPUS_LONGITUDE);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(CAMPUS_LATITUDE)) * Math.cos(toRadians(latitude)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}
