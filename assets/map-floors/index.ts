import type React from 'react';
import type { SvgProps } from 'react-native-svg';

import Building1B1 from './building-1/B1.svg';
import Building1F1 from './building-1/F1.svg';
import Building1F2 from './building-1/F2.svg';
import Building1F3 from './building-1/F3.svg';
import Building1F4 from './building-1/F4.svg';
import Building1F5 from './building-1/F5.svg';
import Building1F6 from './building-1/F6.svg';
import Building1F7 from './building-1/F7.svg';
import Building1F8 from './building-1/F8.svg';
import Building1F9 from './building-1/F9.svg';
import Building1F10 from './building-1/F10.svg';
import Building2B1 from './building-2/B1.svg';
import Building2F1 from './building-2/F1.svg';
import Building2F2 from './building-2/F2.svg';
import Building2F3 from './building-2/F3.svg';
import Building2F4 from './building-2/F4.svg';
import Building2F5 from './building-2/F5.svg';
import Building2F6 from './building-2/F6.svg';
import Building2F7 from './building-2/F7.svg';
import Building2F8 from './building-2/F8.svg';
import Building2F9 from './building-2/F9.svg';
import Building2F10 from './building-2/F10.svg';
import Building4F1 from './building-4/F1.svg';
import Building4F2 from './building-4/F2.svg';
import Building4F3 from './building-4/F3.svg';
import Building4F4 from './building-4/F4.svg';
import Building4F5 from './building-4/F5.svg';
import Building4F6 from './building-4/F6.svg';
import Building4F7 from './building-4/F7.svg';
import Building4F8 from './building-4/F8.svg';
import Building4F9 from './building-4/F9.svg';
import Building5B1 from './building-5/B1.svg';
import Building5F1 from './building-5/F1.svg';
import Building5F5 from './building-5/F5.svg';
import Building7B3 from './building-7/B3.svg';
import Building7B2 from './building-7/B2.svg';
import Building7B1 from './building-7/B1.svg';
import Building7F1 from './building-7/F1.svg';
import Building7F2 from './building-7/F2.svg';
import Building7F3 from './building-7/F3.svg';
import Building7F4 from './building-7/F4.svg';

// 층별 안내도 도면(Figma export SVG) 매니페스트.
// 바깥 키는 건물 id(assets/map-markers의 building-{id}.png와 동일한 1~9 네임스페이스),
// 안쪽 키는 건물 상세 API가 내려주는 floorLabel('B1', 'F1', 'F2'...)을 그대로 쓴다.
// Metro는 동적 경로의 require()를 지원하지 않아, 도면별로 정적으로 나열해야 한다.
// 도면이 아직 없는 건물(3, 6, 8, 9)과 층은 여기 없으면 화면에서 "준비 중"으로 처리된다.
export const MAP_FLOOR_PLANS: Record<string, Record<string, React.FC<SvgProps>>> = {
  '1': {
    B1: Building1B1,
    F1: Building1F1,
    F2: Building1F2,
    F3: Building1F3,
    F4: Building1F4,
    F5: Building1F5,
    F6: Building1F6,
    F7: Building1F7,
    F8: Building1F8,
    F9: Building1F9,
    F10: Building1F10,
  },
  '2': {
    B1: Building2B1,
    F1: Building2F1,
    F2: Building2F2,
    F3: Building2F3,
    F4: Building2F4,
    F5: Building2F5,
    F6: Building2F6,
    F7: Building2F7,
    F8: Building2F8,
    F9: Building2F9,
    F10: Building2F10,
  },
  '4': {
    F1: Building4F1,
    F2: Building4F2,
    F3: Building4F3,
    F4: Building4F4,
    F5: Building4F5,
    F6: Building4F6,
    F7: Building4F7,
    F8: Building4F8,
    F9: Building4F9,
  },
  '5': {
    B1: Building5B1,
    F1: Building5F1,
    F5: Building5F5,
  },
  '7': {
    B3: Building7B3,
    B2: Building7B2,
    B1: Building7B1,
    F1: Building7F1,
    F2: Building7F2,
    F3: Building7F3,
    F4: Building7F4,
  },
};

// 모든 도면이 393x698 캔버스로 export돼 있다. 뷰포트 스케일 계산에 쓴다.
export const MAP_FLOOR_PLAN_WIDTH = 393;
export const MAP_FLOOR_PLAN_HEIGHT = 698;

// 해당 건물에 도면이 준비된 층 라벨 목록 (없으면 빈 배열)
export function getFloorPlanLabels(buildingId: string): string[] {
  return Object.keys(MAP_FLOOR_PLANS[buildingId] ?? {});
}

export function getFloorPlan(buildingId: string, floorLabel: string) {
  return MAP_FLOOR_PLANS[buildingId]?.[floorLabel];
}
