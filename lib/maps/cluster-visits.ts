// 지도에서 다녀온 곳 핀을 묶는다. 학교 주변이 좁아 "내가 찍은 사진 N장" 알약을 다 띄우면 서로 겹치기 때문에,
// 화면에서 알약끼리 겹칠 만큼 가까운 핀만 하나로 묶는다(사진 수 합계). 대표는 입력 순서(최근에 간 곳) 앞쪽이고,
// 뒤의 핀은 앞에서 정한 대표와 겹치면 그 묶음에 들어간다. 화면 거리는 줌으로만 정해져서 지도를 옮겨도 묶음이 바뀌지 않고
// (핀이 옆으로 튀지 않는다), 확대하면 저절로 풀린다. 고정 격자로 나누면 칸 경계 양쪽의 가까운 건물이 안 묶여 알약이 겹쳐서
// 칸 대신 실제 화면 거리로 본다

// 256px 타일 기준 줌 0에서 적도의 1px이 몇 m인지 (웹 메르카토르)
const METERS_PER_PIXEL_AT_ZOOM_ZERO = 156543.03392;
const METERS_PER_DEGREE = 111320;
// 알약 하나가 차지하는 화면 크기(pt, "내가 찍은 사진 12장" 기준). 대표와 이만큼 안쪽이면 겹친다고 보고 묶는다
const PIN_OVERLAP_WIDTH = 130;
const PIN_OVERLAP_HEIGHT = 40;

export type ClusterablePoint = { latitude: number; longitude: number };
// position: 묶음 핀을 놓을 자리. 한 곳이면 그 곳, 여러 곳이면 묶인 곳들의 가운데
export type PointCluster<T> = { representative: T; members: T[]; position: ClusterablePoint };

export function clusterOverlappingPins<T extends ClusterablePoint>(
  points: T[],
  zoom: number
): PointCluster<T>[] {
  if (!points.length) return [];
  const averageLatitude = points.reduce((sum, point) => sum + point.latitude, 0) / points.length;
  const cosine = Math.cos((averageLatitude * Math.PI) / 180);
  const metersPerPixel = (METERS_PER_PIXEL_AT_ZOOM_ZERO * cosine) / 2 ** zoom;
  const overlaps = (first: T, second: T) =>
    (Math.abs(first.longitude - second.longitude) * METERS_PER_DEGREE * cosine) / metersPerPixel <
      PIN_OVERLAP_WIDTH &&
    (Math.abs(first.latitude - second.latitude) * METERS_PER_DEGREE) / metersPerPixel <
      PIN_OVERLAP_HEIGHT;

  const groups = points.reduce<T[][]>((grouped, point) => {
    const group = grouped.find((members) => overlaps(members[0], point));
    if (group) group.push(point);
    else grouped.push([point]);
    return grouped;
  }, []);

  return groups.map((members) => ({
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
  return candidateZooms.find((zoom) => clusterOverlappingPins(points, zoom).length > 1) ?? maxZoom;
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
