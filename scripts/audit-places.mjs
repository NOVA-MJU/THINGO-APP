// 학교 주변 가게 전수조사. 소상공인시장진흥공단 상가(상권)정보 API(data.go.kr 15012005, 이용허락 제한 없음)의
// 영업 중 가게 목록과 우리 지도 가게(서버 카테고리 마커)를 이름과 거리로 대조해 CSV 두 개를 만든다.
//   missing.csv  - 공공데이터에는 있는데 우리에게 없는 가게 (추가 후보)
//   closed.csv   - 우리에게는 있는데 공공데이터에 없는 가게 (폐업·이전 후보. 그 자리에 다른 가게가 있으면 같이 적는다)
// 공공데이터도 빠지거나 늦게 반영되는 가게가 있어서 두 목록 모두 사람이 네이버 지도에서 확인한 뒤 시트에 반영한다.
// 네이버·카카오 지도 데이터는 약관상 저장할 수 없어 대조 기준으로 쓰지 않는다. 공공데이터가 분기마다 갱신되니 분기마다 다시 돌린다.
//
// 실행: SEMAS_SERVICE_KEY=<data.go.kr 일반 인증키(Decoding)> node scripts/audit-places.mjs [--radius 1000] [--out place-audit]
//       [--daedong-seed ../THINGO_BACKEND/docs/map-seed/daedong-sync.json] (폐업 후보에 네이버 장소 링크를 붙인다)
// 매칭 로직만 확인: node scripts/audit-places.mjs --check
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CAMPUS = { lat: 37.579711, lng: 126.923186 }; // lib/maps/campus.ts와 같은 값
const SEMAS_URL = 'https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInRadius';
const MAX_RADIUS = 2000; // API 명세상 반경 최대값(m)
const PAGE_SIZE = 1000;
const THINGO_API = process.env.THINGO_API_BASE ?? 'https://api.thingo.kr/api/v1';
// 가게 핀이 들어 있는 카테고리. cafeteria(학식)는 교내 시설이라 상가 데이터에 없어 뺀다
const OUR_CATEGORIES = ['daedong', 'restaurant', 'cafe', 'truck', 'convenience-store', 'printer'];
// 공공데이터 좌표는 건물 대표점이라 우리 핀과 수십 m 어긋날 수 있다
const MATCH_METERS = 80;
// 이 거리 안의 다른 이름 가게는 "같은 자리" 참고용으로만 적는다 (간판이 바뀐 가게 확인용)
const SAME_SPOT_METERS = 20;

const METERS_PER_DEGREE = 111320;

function distanceMeters(from, to) {
  const northMeters = (from.lat - to.lat) * METERS_PER_DEGREE;
  const eastMeters =
    (from.lng - to.lng) * METERS_PER_DEGREE * Math.cos((CAMPUS.lat * Math.PI) / 180);
  return Math.hypot(eastMeters, northMeters);
}

function normalizeName(name) {
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
function bigrams(text) {
  return new Set(
    Array.from({ length: Math.max(text.length - 1, 0) }, (_, start) => text.slice(start, start + 2))
  );
}

// lib/maps/match-symbol.ts의 isSimilarName과 같은 기준 (앱 번들과 node 스크립트라 복사해 둔다)
function isSimilarName(firstName, secondName) {
  const first = normalizeName(firstName);
  const second = normalizeName(secondName);
  if (!first || !second) return false;
  if (first === second) return true;
  const isContained = first.includes(second) || second.includes(first);
  if (Math.min(first.length, second.length) >= 2 && isContained) return true;
  // 두 글자 조각이 60% 이상 겹치면 같은 곳 (Dice 계수)
  return bigramSimilarity(first, second) >= 0.6;
}

function bigramSimilarity(first, second) {
  const firstBigrams = bigrams(first);
  const secondBigrams = bigrams(second);
  const totalCount = firstBigrams.size + secondBigrams.size;
  if (totalCount === 0) return 0;
  const sharedCount = [...firstBigrams].filter((bigram) => secondBigrams.has(bigram)).length;
  return (2 * sharedCount) / totalCount;
}

function commonPrefixLength(first, second) {
  const mismatchIndex = [...first].findIndex((character, index) => character !== second[index]);
  return mismatchIndex === -1 ? first.length : mismatchIndex;
}

// 같은 자리(20m 안)에서는 이름이 덜 비슷해도 같은 가게로 본다. 우리 이름은 네이버 지도 이름이고 공공데이터는 사업자 등록 이름이라
// '봉구네가마솥순대국'/'봉구네순대', '롯데리아 명지대학점'/'롯데리아해리피아'처럼 앞부분만 같거나 일부만 겹친다
function isSameStoreAtSpot(point, candidate) {
  if (distanceMeters(point, candidate) > SAME_SPOT_METERS) return false;
  const first = normalizeName(point.name);
  const second = normalizeName(candidate.name);
  return commonPrefixLength(first, second) >= 2 || bigramSimilarity(first, second) >= 0.4;
}

function nearest(point, candidates) {
  const [closest] = candidates
    .map((item) => ({ item, distance: distanceMeters(point, item) }))
    .sort((first, second) => first.distance - second.distance);
  return closest ?? null;
}

function hasMatch(point, candidates) {
  return candidates.some(
    (candidate) =>
      (distanceMeters(point, candidate) <= MATCH_METERS &&
        isSimilarName(point.name, candidate.name)) ||
      isSameStoreAtSpot(point, candidate)
  );
}

// 공공데이터 업종(대 > 중 > 소분류) → 우리 카테고리. 위에서부터 처음 맞는 규칙을 쓴다.
// categoryCode가 없는 규칙은 학생에게 쓸모 있지만 아직 우리 카테고리가 없는 업종이라 "새 카테고리 후보"로만 적는다
const STORE_CATEGORY_RULES = [
  {
    matches: (store) => /편의점|슈퍼마켓/.test(store.indsSclsNm),
    categoryCode: 'convenience-store',
  },
  { matches: (store) => store.indsSclsNm === '복사업', categoryCode: 'printer' },
  { matches: (store) => store.indsMclsNm?.trim() === '비알코올', categoryCode: 'cafe' },
  { matches: (store) => store.indsLclsNm === '음식', categoryCode: 'restaurant' },
  { matches: (store) => store.indsSclsNm === '약국', categoryCode: 'pharmacy' },
  { matches: (store) => /문구/.test(store.indsSclsNm), newCategory: '문구점' },
  { matches: (store) => store.indsSclsNm === '셀프 빨래방', newCategory: '빨래방' },
  { matches: (store) => /스터디 카페/.test(store.indsSclsNm), categoryCode: 'study-cafe' },
];

function classifyStore(store) {
  return STORE_CATEGORY_RULES.find((rule) => rule.matches(store)) ?? null;
}

async function fetchPublicStores(serviceKey, radius) {
  const stores = [];
  for (let pageNo = 1; ; pageNo++) {
    const params = new URLSearchParams({
      serviceKey,
      pageNo: String(pageNo),
      numOfRows: String(PAGE_SIZE),
      radius: String(radius),
      cx: String(CAMPUS.lng),
      cy: String(CAMPUS.lat),
      type: 'json',
    });
    const response = await fetch(`${SEMAS_URL}?${params}`);
    const text = await response.text();
    let body;
    try {
      body = JSON.parse(text).body;
    } catch {
      throw new Error(
        `상가정보 API 응답을 읽지 못했다 (HTTP ${response.status}): ${text.slice(0, 300)}`
      );
    }
    if (!body?.items) throw new Error(`상가정보 API 응답에 items가 없다: ${text.slice(0, 300)}`);
    stores.push(...body.items);
    if (stores.length >= Number(body.totalCount) || body.items.length === 0) return stores;
  }
}

async function fetchOurPlaces() {
  const markerLists = await Promise.all(
    OUR_CATEGORIES.map(async (code) => {
      const response = await fetch(`${THINGO_API}/map/categories/${code}/markers`);
      if (!response.ok)
        throw new Error(`우리 서버 ${code} 마커를 받지 못했다 (HTTP ${response.status})`);
      return (await response.json()).data;
    })
  );
  const places = markerLists
    .flat()
    .filter((marker) => marker.type === 'PLACE' && !marker.grouped)
    .map((marker) => ({
      id: marker.id,
      name: marker.title,
      category: marker.categoryCode,
      address: marker.location ?? '',
      lat: marker.latitude,
      lng: marker.longitude,
    }));
  // 같은 가게가 여러 카테고리에 들어 있으면 하나만 남긴다
  return [...new Map(places.map((place) => [place.id, place])).values()];
}

// 마커 API는 code를 주지 않아서, 대동명지도 시드(백엔드 docs/map-seed/daedong-sync.json)에서 이름과 좌표로 네이버 장소 id를 찾아 붙인다
function withNaverPlaceIds(places, seedPath) {
  if (!seedPath) return places;
  const seedPlaces = JSON.parse(readFileSync(seedPath, 'utf8').replace(/^\uFEFF/, '')).places;
  return places.map((place) => {
    const seedPlace = seedPlaces.find(
      (candidate) =>
        candidate.name === place.name &&
        distanceMeters(place, { lat: candidate.latitude, lng: candidate.longitude }) <= 10
    );
    const naverPlaceId = seedPlace?.code.match(/^dd-(\d+)$/)?.[1];
    return naverPlaceId ? { ...place, naverPlaceId } : place;
  });
}

function toCsv(rows) {
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const header = Object.keys(rows[0] ?? { 결과: '' });
  // 엑셀에서 한글이 깨지지 않게 BOM을 붙인다
  return (
    '﻿' +
    [header, ...rows.map((row) => header.map((column) => row[column]))]
      .map((cells) => cells.map(escape).join(','))
      .join('\n')
  );
}

function audit(publicStores, ourPlaces, radius) {
  const ours = ourPlaces.filter((place) => distanceMeters(CAMPUS, place) <= radius);
  const missing = publicStores
    .filter((store) => !hasMatch(store, ours))
    .map((store) => {
      const near = nearest(store, ours);
      return {
        // 추가할 가게는 이 칸에 O를 적는다 (scripts/audit-to-sync.mjs가 O인 줄만 서버에 올린다)
        추가: '',
        상가업소번호: store.id ?? '',
        상호: store.name,
        업종: store.category,
        // 서버에 올릴 우리 카테고리. 비어 있으면 아직 카테고리가 없는 업종(새카테고리후보 칸)이라 올리지 않는다
        카테고리: store.categoryCode ?? '',
        새카테고리후보: store.newCategory ?? '',
        주소: store.address,
        학교에서m: Math.round(distanceMeters(CAMPUS, store)),
        같은자리우리가게:
          near && near.distance <= SAME_SPOT_METERS
            ? `${near.item.name} (${Math.round(near.distance)}m)`
            : '',
        위도: store.lat,
        경도: store.lng,
      };
    })
    .sort((a, b) => a.학교에서m - b.학교에서m);
  const closed = ours
    // 야식트럭은 사업장 등록이 없는 이동 판매라 공공데이터에 없는 게 정상이다
    .filter((place) => place.category !== 'truck' && !hasMatch(place, publicStores))
    .map((place) => {
      const near = nearest(place, publicStores);
      return {
        id: place.id,
        상호: place.name,
        // 대동명지도 가게는 네이버 지도 장소에서 가져와 code가 dd-<네이버 장소 id>다. 눌러서 지금도 영업하는지 확인한다
        네이버지도: place.naverPlaceId
          ? `https://map.naver.com/p/entry/place/${place.naverPlaceId}`
          : `https://map.naver.com/p/search/${encodeURIComponent(place.name)}`,
        카테고리: place.category,
        주소: place.address,
        학교에서m: Math.round(distanceMeters(CAMPUS, place)),
        같은자리공공데이터가게:
          near && near.distance <= SAME_SPOT_METERS
            ? `${near.item.name} (${Math.round(near.distance)}m)`
            : '',
      };
    })
    .sort((a, b) => a.학교에서m - b.학교에서m);
  return { ours, missing, closed };
}

function selfCheck() {
  assert.ok(isSimilarName('스타벅스 명지대점', '스타벅스'));
  assert.ok(isSimilarName('삼정식당', '삼정 식당'));
  assert.ok(isSimilarName('제일쌀국수(본점)', '제일쌀국수'));
  assert.ok(!isSimilarName('호랑마라', '탄뽀뽀'));
  assert.ok(!isSimilarName('GS25', 'CU'));
  const ourStore = { name: '삼정식당', lat: 37.5796415, lng: 126.9250425 };
  const publicStore = { name: '삼정식당', lat: 37.5799, lng: 126.9252 };
  const far = { name: '삼정식당', lat: 37.585, lng: 126.9250425 };
  assert.ok(hasMatch(ourStore, [publicStore]));
  assert.ok(!hasMatch(ourStore, [far]));
  const { missing, closed } = audit(
    [publicStore, { name: '호랑마라', category: '음식', lat: 37.58, lng: 126.923 }],
    [
      { ...ourStore, id: 1 },
      { id: 2, name: '망한가게', lat: 37.5805, lng: 126.9235 },
    ],
    1000
  );
  assert.deepEqual(
    missing.map((store) => store.상호),
    ['호랑마라']
  );
  assert.deepEqual(
    closed.map((place) => place.상호),
    ['망한가게']
  );
  console.log('ok');
}

function argValue(name, fallback) {
  const flagIndex = process.argv.indexOf(name);
  return flagIndex === -1 ? fallback : process.argv[flagIndex + 1];
}

async function main() {
  if (process.argv.includes('--check')) return selfCheck();

  const serviceKey = process.env.SEMAS_SERVICE_KEY;
  if (!serviceKey)
    throw new Error('SEMAS_SERVICE_KEY 환경변수에 data.go.kr 일반 인증키(Decoding)를 넣어야 한다');
  const radius = Number(argValue('--radius', '1000'));
  if (!(radius > 0 && radius <= MAX_RADIUS)) throw new Error(`--radius는 1~${MAX_RADIUS}(m)`);
  const outDir = argValue('--out', 'place-audit');

  const raw = await fetchPublicStores(serviceKey, radius);
  const classified = raw
    .map((store) => ({ store, rule: classifyStore(store) }))
    .filter(({ rule }) => rule !== null);
  // 업종 이름이 바뀌면 필터가 0건이 되므로 분포를 보여 줘서 바로 알아채게 한다
  const counts = Object.groupBy(raw, (store) => store.indsLclsNm);
  const countByCategory = Object.fromEntries(
    Object.entries(counts).map(([category, stores]) => [category, stores.length])
  );
  console.log(`반경 ${radius}m 상가 ${raw.length}곳, 업종 대분류:`, countByCategory);
  if (classified.length === 0)
    throw new Error('대상 업종이 0건이다. 위 대분류 이름을 보고 STORE_CATEGORY_RULES를 고친다');

  const publicStores = classified.map(({ store, rule }) => ({
    id: store.bizesId,
    categoryCode: rule.categoryCode ?? '',
    newCategory: rule.newCategory ?? '',
    name: store.brchNm ? `${store.bizesNm} ${store.brchNm}` : store.bizesNm,
    category: [store.indsMclsNm, store.indsSclsNm].filter(Boolean).join(' > '),
    address: store.rdnmAdr || store.lnoAdr,
    lat: Number(store.lat),
    lng: Number(store.lon),
  }));
  const ourPlaces = withNaverPlaceIds(await fetchOurPlaces(), argValue('--daedong-seed', null));
  const { ours, missing, closed } = audit(publicStores, ourPlaces, radius);

  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'missing.csv'), toCsv(missing));
  writeFileSync(join(outDir, 'closed.csv'), toCsv(closed));
  console.log(
    `공공데이터 대상 업종 ${publicStores.length}곳, 우리 장소 ${ours.length}곳\n` +
      `우리에게 없는 가게 ${missing.length}곳 -> ${join(outDir, 'missing.csv')}\n` +
      `폐업·이전 후보 ${closed.length}곳 -> ${join(outDir, 'closed.csv')}`
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
