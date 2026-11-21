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

// 다녀온 날짜: 올해면 '11월 12일', 지난해 이전이면 '2025년 11월 12일'
export function formatVisitDate(ms: number) {
  const date = new Date(ms);
  const prefix = date.getFullYear() === new Date().getFullYear() ? '' : `${date.getFullYear()}년 `;
  return `${prefix}${date.getMonth() + 1}월 ${date.getDate()}일`;
}

const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

// 사진 찍은 날 ('YYYY-MM-DD' 기기 로컬 날짜): 올해면 '11월 12일 (수)', 지난해 이전이면 '2025년 11월 12일 (수)'
export function formatPhotoDay(day: string) {
  const [year, month, date] = day.split('-').map(Number);
  const weekday = WEEKDAY_NAMES[new Date(year, month - 1, date).getDay()];
  const prefix = year === new Date().getFullYear() ? '' : `${year}년 `;
  return `${prefix}${month}월 ${date}일 (${weekday})`;
}
