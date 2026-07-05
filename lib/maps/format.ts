export function formatMapDistance(distanceMeters: number) {
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)}m`;
  return `${(distanceMeters / 1000).toFixed(1)}km`;
}

export function getOperatingStatusClassName(status: string) {
  if (status.includes('휴무')) return 'text-grey-40';
  if (status.includes('종료')) return 'text-error';
  if (status.includes('시작')) return 'text-blue-35';
  if (status.includes('운영중') || status.includes('24시간')) return 'text-[#34AA6F]';
  return 'text-grey-60';
}
