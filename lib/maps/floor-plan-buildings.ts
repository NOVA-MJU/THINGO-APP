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

// 도면 글자로 장소 종류를 짐작한다 (검색 결과 아이콘과 안내도 위치 핀 아이콘에 쓴다). 위에서부터 처음 맞는 규칙을 쓰고,
// 아무것도 안 맞으면 강의실이다 (S10134 같은 호실 번호, '코이노니아홀' 같은 강의 공간)
const FLOOR_TEXT_CATEGORY_RULES: { pattern: RegExp; categoryCode: string }[] = [
  { pattern: /화장실/, categoryCode: 'restroom' },
  { pattern: /카페|커피|스타벅스|매머드|베이커리|빵/, categoryCode: 'cafe' },
  { pattern: /이마트|편의점|gs25|cu|세븐일레븐|마트/i, categoryCode: 'convenience-store' },
  { pattern: /식당|학식|푸드코트/, categoryCode: 'cafeteria' },
  { pattern: /프린트|프린터|복사/, categoryCode: 'printer' },
  { pattern: /라운지/, categoryCode: 'lounge' },
  { pattern: /열람실/, categoryCode: 'reading-room' },
  { pattern: /스터디룸|세미나실/, categoryCode: 'study-room' },
  { pattern: /휴게실/, categoryCode: 'break-room' },
  { pattern: /체육관|헬스|피트니스/, categoryCode: 'gym' },
  { pattern: /은행|atm/i, categoryCode: 'bank' },
  { pattern: /우체국|우편/, categoryCode: 'mail' },
  { pattern: /동아리/, categoryCode: 'club-room' },
  { pattern: /증명/, categoryCode: 'certificate-kiosk' },
  { pattern: /흡연/, categoryCode: 'smoking' },
  { pattern: /주차/, categoryCode: 'parking' },
  { pattern: /출입문|출입구|게이트|진입로/, categoryCode: 'building-entrance' },
  { pattern: /교수|연구실/, categoryCode: 'professor-room' },
];

export function floorTextCategoryCode(text: string) {
  return (
    FLOOR_TEXT_CATEGORY_RULES.find((rule) => rule.pattern.test(text))?.categoryCode ?? 'classroom'
  );
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
      categoryCode: floorTextCategoryCode(result.text),
      // 아이콘은 categoryCode로 고른다 (lib/maps/icons.ts의 카테고리별 아이콘)
      iconKey: '',
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
