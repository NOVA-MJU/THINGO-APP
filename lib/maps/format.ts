export function formatMapDistance(distanceMeters: number) {
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)}m`;
  return `${(distanceMeters / 1000).toFixed(1)}km`;
}

export function formatMapFloorLabel(floorLabel: string) {
  return floorLabel.replace(/^F(\d+)$/i, '$1');
}

// 층별 안내도 화면(층 선택 리스트, 헤더) 표기: 지상층은 'F1' → '1F'처럼 층수를 앞에 두고 F를 뒤에 붙인다.
// formatMapFloorLabel은 'F1' → '1'만 반환하는 공용 포맷이라 따로 둔다. 지하층('B1' 등)은 그대로 둔다
export function formatFloorPlanLabel(floorLabel: string) {
  return floorLabel.replace(/^F(\d+)$/i, '$1F');
}

export function getOperatingStatusClassName(status: string) {
  if (status.includes('휴무')) return 'text-grey-40';
  if (status.includes('종료')) return 'text-error';
  if (status.includes('시작')) return 'text-blue-35';
  if (status.includes('운영중') || status.includes('24시간')) return 'text-[#34AA6F]';
  return 'text-grey-60';
}
