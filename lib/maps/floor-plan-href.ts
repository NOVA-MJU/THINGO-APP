import type { MapSearchItem } from '@/api/maps';
import { getFloorPlan } from '@/assets/map-floors';
import { getMapIconKey } from '@/lib/maps/icons';
import type { Href } from 'expo-router';

// 서버가 FLOOR_MAP으로 내려준 교내 장소(강의실, 건물 안 시설)의 층별 안내도 경로.
// 앱에 그 건물·층 도면이 아직 없으면 "준비 중" 화면 대신 지도 핀으로 보여주도록 null을 돌려준다.
// 도면 위 핀이 지도와 같은 카테고리 마커를 쓰도록 markerIcon을 붙인다
// (명지도 검색 화면과 통합검색의 '명지도 장소' 칸이 함께 쓴다)
export function getFloorPlanHref(
  item: Pick<MapSearchItem, 'type' | 'link' | 'iconKey' | 'categoryCode'>
): Href | null {
  if (item.type !== 'FLOOR_MAP' || !item.link) return null;

  const params = new URLSearchParams(item.link.split('?')[1]);
  const floorPlan = getFloorPlan(params.get('buildingId') ?? '', params.get('floorLabel') ?? '');
  if (floorPlan === undefined) return null;

  const markerIcon = getMapIconKey(item.iconKey ?? '', item.categoryCode);
  return `${item.link}&markerIcon=${encodeURIComponent(markerIcon)}` as Href;
}

// '국제관 F1' → '국제관 1층', '방목학술정보관 B2' → '방목학술정보관 지하 2층'. 외부 주소는 그대로
export function formatPlaceLocation(location: string | null): string {
  if (!location) return '';
  return location.replace(/\s([BF])(\d+)$/, (_, floor: string, number: string) =>
    floor === 'B' ? ` 지하 ${number}층` : ` ${number}층`
  );
}
