// 지도에서 다녀온 곳 핀을 구역별로 묶는다. 학교 주변이 좁아 가게 이름 알약을 다 띄우면 겹쳐 대부분 숨기 때문에,
// 지도를 화면 크기 기준의 고정된 격자(구역)로 나누고 같은 구역에 든 곳을 "대표 가게 외 N곳" 알약 하나로 보여준다.
// 격자는 위경도 0,0을 기준으로 고정돼 있어서 지도를 조금 옮겨도 묶음이 바뀌지 않고(핀이 옆 가게로 튀지 않는다),
// 확대하면 구역이 잘게 나뉘어 저절로 풀린다. 입력 순서가 우선순위다 (앞쪽이 대표 이름이 된다. 다녀온 곳은 최근에 간 곳부터 온다)

// 256px 타일 기준 줌 0에서 적도의 1px이 몇 m인지 (웹 메르카토르)
const METERS_PER_PIXEL_AT_ZOOM_ZERO = 156543.03392;
const METERS_PER_DEGREE = 111320;
// 구역 하나의 화면 크기(pt). 처음 줌(16)에서 약 225m x 150m로, 대동 상권이 몇 구역으로 나뉜다
const CELL_WIDTH = 120;
const CELL_HEIGHT = 80;

export type ClusterablePoint = { latitude: number; longitude: number };
// position: 묶음 핀을 놓을 자리. 한 곳이면 그 곳, 여러 곳이면 구역 안 곳들의 가운데
export type PointCluster<T> = { representative: T; members: T[]; position: ClusterablePoint };

export function clusterByGridCell<T extends ClusterablePoint>(
  points: T[],
  zoom: number
): PointCluster<T>[] {
  if (!points.length) return [];
  // 경도 칸 폭은 위도에 따라 달라서, 지도를 옮겨도 칸이 변하지 않게 점들의 평균 위도 하나로 고정한다
  const averageLatitude = points.reduce((sum, point) => sum + point.latitude, 0) / points.length;
  const cosine = Math.cos((averageLatitude * Math.PI) / 180);
  const metersPerPixel = (METERS_PER_PIXEL_AT_ZOOM_ZERO * cosine) / 2 ** zoom;
  const cellLatitude = (CELL_HEIGHT * metersPerPixel) / METERS_PER_DEGREE;
  const cellLongitude = (CELL_WIDTH * metersPerPixel) / (METERS_PER_DEGREE * cosine);
  const cellKey = (point: T) =>
    `${Math.floor(point.latitude / cellLatitude)}:${Math.floor(point.longitude / cellLongitude)}`;

  // Map은 처음 넣은 순서를 지키므로, 구역 순서와 구역 안 순서 모두 입력(최근) 순서다
  const cells = points.reduce((grouped, point) => {
    const key = cellKey(point);
    return grouped.set(key, [...(grouped.get(key) ?? []), point]);
  }, new Map<string, T[]>());

  return [...cells.values()].map((members) => ({
    representative: members[0],
    members,
    position:
      members.length === 1
        ? members[0]
        : {
            latitude: members.reduce((sum, member) => sum + member.latitude, 0) / members.length,
            longitude: members.reduce((sum, member) => sum + member.longitude, 0) / members.length,
          },
  }));
}

// 묶음 핀을 눌렀을 때 확대할 줌. 지금 줌에서 조금씩 키워 가며 묶음이 처음 둘 이상으로 나뉘는 줌을 찾는다.
// 그래서 어느 정도 확대된 상태면 한 단계만 나뉘고, 아주 축소된 상태면 크게 확대돼도 아직 묶인 핀이 남을 수 있다(한 번 더 누르면 된다).
// maxZoom까지 가도 안 나뉘면(건물이 바로 붙어 있으면) maxZoom
export function zoomToSplit<T extends ClusterablePoint>(
  points: T[],
  currentZoom: number,
  maxZoom: number,
  step = 0.5
): number {
  const candidateZooms = Array.from(
    { length: Math.max(0, Math.ceil((maxZoom - currentZoom) / step)) },
    (_, index) => Math.min(maxZoom, currentZoom + step * (index + 1))
  );
  return candidateZooms.find((zoom) => clusterByGridCell(points, zoom).length > 1) ?? maxZoom;
}

// 점들이 화면의 보이는 영역(visibleWidth x visibleHeight pt) 안에 다 들어오는 가장 큰 줌 (maxZoom을 넘지 않음).
// 묶음 핀을 눌러 확대했는데 풀린 핀이 화면 밖이나 시트 뒤로 가면 안 보여서, 나뉘는 줌(zoomToSplit)과 같이 보고 작은 쪽을 쓴다
export function zoomToFit<T extends ClusterablePoint>(
  points: T[],
  visibleWidth: number,
  visibleHeight: number,
  maxZoom: number
): number {
  if (!points.length) return maxZoom;
  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  const averageLatitude = latitudes.reduce((sum, value) => sum + value, 0) / points.length;
  const cosine = Math.cos((averageLatitude * Math.PI) / 180);
  const widthMeters =
    (Math.max(...longitudes) - Math.min(...longitudes)) * METERS_PER_DEGREE * cosine;
  const heightMeters = (Math.max(...latitudes) - Math.min(...latitudes)) * METERS_PER_DEGREE;
  const metersPerPixel = Math.max(widthMeters / visibleWidth, heightMeters / visibleHeight);
  if (metersPerPixel <= 0) return maxZoom;
  return Math.min(maxZoom, Math.log2((METERS_PER_PIXEL_AT_ZOOM_ZERO * cosine) / metersPerPixel));
}

// 카메라 가운데 위도를 shiftPixels만큼 아래(남쪽)로 옮긴 값. 그러면 latitude 자리가 화면 가운데보다 shiftPixels 위에 보인다
// (아래 절반을 시트가 덮을 때 보여줄 곳을 시트 위 지도 가운데로 올리는 데 쓴다)
export function latitudeShiftedDown(latitude: number, zoom: number, shiftPixels: number) {
  const cosine = Math.cos((latitude * Math.PI) / 180);
  const metersPerPixel = (METERS_PER_PIXEL_AT_ZOOM_ZERO * cosine) / 2 ** zoom;
  return latitude - (shiftPixels * metersPerPixel) / METERS_PER_DEGREE;
}
