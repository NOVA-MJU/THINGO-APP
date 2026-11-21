// 네이버 지도 기본 심벌(가게·건물 글자)을 눌렀을 때 우리 DB의 같은 장소를 찾는다.
// 심벌은 이름(caption)과 좌표만 주므로 이름이 비슷하고 가까운 곳을 같은 곳으로 본다.
// 기준은 scripts/audit-places.mjs(공공데이터 전수조사)와 같다. 두 곳은 실행 환경이 달라(앱 번들, node 스크립트) 복사해 둔다

// 네이버 심벌 좌표와 우리 핀 좌표는 건물 대표점 차이로 수십 m 어긋날 수 있다
const MATCH_METERS = 80;

export type SymbolPoint = { caption: string; latitude: number; longitude: number };
export type SymbolMatchTarget = { name: string; latitude: number; longitude: number };

// 이름이 비슷한 곳 중 가장 가까운 곳. 없으면 null
export function findSymbolMatch<T extends SymbolMatchTarget>(
  symbol: SymbolPoint,
  targets: T[]
): T | null {
  const [closestMatch] = targets
    .map((target) => ({ target, distance: distanceMeters(symbol, target) }))
    .filter(
      ({ target, distance }) =>
        distance <= MATCH_METERS && isSimilarName(symbol.caption, target.name)
    )
    .sort((first, second) => first.distance - second.distance);
  return closestMatch?.target ?? null;
}

const METERS_PER_DEGREE = 111320;

function distanceMeters(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
) {
  const northMeters = (from.latitude - to.latitude) * METERS_PER_DEGREE;
  const eastMeters =
    (from.longitude - to.longitude) * METERS_PER_DEGREE * Math.cos((from.latitude * Math.PI) / 180);
  return Math.hypot(eastMeters, northMeters);
}

function normalizeName(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/\(.*?\)/g, '')
      .replace(/[^0-9a-z가-힣]/g, '')
      // 지점 꼬리('명지대점', '본점', '2호점')만 뗀다. '만점'처럼 이름이 '점'으로 끝나는 가게는 그대로 둔다
      .replace(/((명지대|명지|남가좌|북가좌|가좌|홍제|연희)점|본점|\d+호점)$/, '')
  );
}

// 두 글자씩 끊은 조각 ('삼정식당' -> 삼정, 정식, 식당)
function bigrams(text: string) {
  return new Set(
    Array.from({ length: Math.max(text.length - 1, 0) }, (_, start) => text.slice(start, start + 2))
  );
}

export function isSimilarName(firstName: string, secondName: string) {
  const first = normalizeName(firstName);
  const second = normalizeName(secondName);
  if (!first || !second) return false;
  if (first === second) return true;
  // '명지대학교 학생회관'과 '학생회관'처럼 한쪽 이름이 다른 쪽에 들어 있으면 같은 곳
  const isContained = first.includes(second) || second.includes(first);
  if (Math.min(first.length, second.length) >= 2 && isContained) return true;
  // 두 글자 조각이 60% 이상 겹치면 같은 곳 (Dice 계수)
  const firstBigrams = bigrams(first);
  const secondBigrams = bigrams(second);
  const totalCount = firstBigrams.size + secondBigrams.size;
  if (totalCount === 0) return false;
  const sharedCount = [...firstBigrams].filter((bigram) => secondBigrams.has(bigram)).length;
  return (2 * sharedCount) / totalCount >= 0.6;
}
