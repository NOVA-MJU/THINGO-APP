// 지도에서 서로 겹치는 다녀온 곳 핀을 하나로 묶는다. 학교 주변이 좁아 가게 이름 알약을 다 띄우면 겹쳐 대부분 숨기 때문에,
// 겹치는 곳끼리 묶어 "대표 가게 외 N곳" 알약 하나로 보여준다. 확대하면 화면상 거리가 벌어져 저절로 풀린다.
// 입력 순서가 우선순위다 (앞쪽이 대표가 된다. 다녀온 곳은 최근에 간 곳부터 온다)

// 256px 타일 기준 줌 0에서 적도의 1px이 몇 m인지 (웹 메르카토르)
const METERS_PER_PIXEL_AT_ZOOM_ZERO = 156543.03392;
const METERS_PER_DEGREE = 111320;
// 이름 알약 하나가 화면에서 차지하는 대략의 크기(pt). 두 핀이 이만큼 안에 있으면 겹친다고 본다
const PILL_WIDTH = 110;
const PILL_HEIGHT = 36;

export type ClusterablePoint = { latitude: number; longitude: number };
export type PointCluster<T> = { representative: T; members: T[] };

function overlapsOnScreen(first: ClusterablePoint, second: ClusterablePoint, zoom: number) {
  const latitudeRadians = (first.latitude * Math.PI) / 180;
  const metersPerPixel = (METERS_PER_PIXEL_AT_ZOOM_ZERO * Math.cos(latitudeRadians)) / 2 ** zoom;
  const horizontalPixels =
    ((first.longitude - second.longitude) * METERS_PER_DEGREE * Math.cos(latitudeRadians)) /
    metersPerPixel;
  const verticalPixels = ((first.latitude - second.latitude) * METERS_PER_DEGREE) / metersPerPixel;
  return Math.abs(horizontalPixels) < PILL_WIDTH && Math.abs(verticalPixels) < PILL_HEIGHT;
}

export function clusterOverlappingPoints<T extends ClusterablePoint>(
  points: T[],
  zoom: number
): PointCluster<T>[] {
  return points.reduce<PointCluster<T>[]>((clusters, point) => {
    const overlappingIndex = clusters.findIndex((cluster) =>
      overlapsOnScreen(cluster.representative, point, zoom)
    );
    if (overlappingIndex === -1) return [...clusters, { representative: point, members: [point] }];
    return clusters.map((cluster, clusterIndex) =>
      clusterIndex === overlappingIndex
        ? { ...cluster, members: [...cluster.members, point] }
        : cluster
    );
  }, []);
}
