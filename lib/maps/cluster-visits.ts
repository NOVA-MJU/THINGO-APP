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
