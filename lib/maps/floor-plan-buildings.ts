import { getFloorPlanLabels, getFloorPlanLayout, MAP_FLOOR_PLANS } from '@/assets/map-floors';
import type { MapSearchItem } from '@/api/maps';
import {
  type BuildingFloorPlanSearchResult,
  type BuildingFloorPlans,
  sortFloorLabels,
} from '@/lib/maps/floor-plan-search';

// 앱에 들어 있는 층별 안내도 도면 글자(assets/map-floors/targets.json)를 건물별로 묶는다.
// floor-plan-search.ts는 node 확인 스크립트(floor-plan-search.check.mjs)가 직접 불러서 '@/' 경로를 쓸 수 없어 따로 둔다
export function loadBuildingFloorPlans(buildingId: string): BuildingFloorPlans {
  const floorOrder = sortFloorLabels(getFloorPlanLabels(buildingId));
  const floors = Object.fromEntries(
    floorOrder.flatMap((label) => {
      const layout = getFloorPlanLayout(buildingId, label);
      return layout ? [[label, layout]] : [];
    })
  ) as BuildingFloorPlans['floors'];
  return { buildingId, floors, floorOrder };
}

export function loadAllBuildingFloorPlans(): BuildingFloorPlans[] {
  return Object.keys(MAP_FLOOR_PLANS).map(loadBuildingFloorPlans);
}

// 명지도 통합 검색 결과 목록에 섞어 보여 주려고 도면 검색 결과를 서버 검색 결과(MapSearchItem) 모양으로 바꾼다.
// 서버 장소 이름이 도면 표기와 다른 호실(서버 'S10134', 도면 'S10134 코이노니아홀')도 도면 이름으로 찾히게 하려는 것이다.
// 서버 결과에 같은 호실 코드가 이미 있으면 빼서 같은 곳이 두 번 나오지 않게 한다
export function toFloorPlanSearchItems(
  results: BuildingFloorPlanSearchResult[],
  buildingNames: Record<string, string>,
  serverItems: MapSearchItem[]
): MapSearchItem[] {
  const serverIndoorCodes = serverItems
    .map((item) => item.indoorCode?.toLowerCase())
    .filter((code): code is string => !!code);
  return results
    .filter((result) => !serverIndoorCodes.some((code) => result.key.includes(code)))
    .map((result, index) => ({
      // 서버 id와 겹치지 않게 음수로 둔다 (목록 key에만 쓴다)
      id: -(index + 1),
      type: 'FLOOR_MAP',
      name: result.text,
      categoryCode: 'classroom',
      iconKey: 'ClassroomIcon',
      imageUrl: null,
      classroomCode: null,
      location: `${buildingNames[result.buildingId] ?? ''} ${result.floorLabel}`.trim(),
      favorite: false,
      operatingStatus: null,
      distanceMeters: null,
      latitude: 0,
      longitude: 0,
      indoorCode: null,
      link: `/maps/floor?buildingId=${result.buildingId}&floorLabel=${result.floorLabel}&target=${encodeURIComponent(result.key)}`,
    }));
}
