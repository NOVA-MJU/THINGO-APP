// 학교 주변 가게 전수조사. 소상공인시장진흥공단 상가(상권)정보 API(data.go.kr 15012005, 이용허락 제한 없음)의
// 영업 중 가게 목록과 우리 지도 가게(서버 카테고리 마커)를 이름과 거리로 대조해 CSV 두 개를 만든다.
//   missing.csv  - 공공데이터에는 있는데 우리에게 없는 가게 (추가 후보)
//   closed.csv   - 우리에게는 있는데 공공데이터에 없는 가게 (폐업·이전 후보. 그 자리에 다른 가게가 있으면 같이 적는다)
// 공공데이터도 빠지거나 늦게 반영되는 가게가 있어서 두 목록 모두 사람이 네이버 지도에서 확인한 뒤 시트에 반영한다.
// 네이버·카카오 지도 데이터는 약관상 저장할 수 없어 대조 기준으로 쓰지 않는다. 공공데이터가 분기마다 갱신되니 분기마다 다시 돌린다.
//
// 실행: SEMAS_SERVICE_KEY=<data.go.kr 일반 인증키(Decoding)> node scripts/audit-places.mjs [--radius 1000] [--out place-audit]
// 매칭 로직만 확인: node scripts/audit-places.mjs --check
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CAMPUS = { lat: 37.579711, lng: 126.923186 }; // lib/maps/campus.ts와 같은 값
const SEMAS_URL = 'https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInRadius';
const MAX_RADIUS = 2000; // API 명세상 반경 최대값(m)
const PAGE_SIZE = 1000;
const THINGO_API = process.env.THINGO_API_BASE ?? 'https://api.thingo.kr/api/v1';
// 가게 핀이 들어 있는 카테고리. cafeteria(학식)는 교내 시설이라 상가 데이터에 없어 뺀다
const OUR_CATEGORIES = ['daedong', 'restaurant', 'cafe', 'convenience-store'];
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
  const firstBigrams = bigrams(first);
  const secondBigrams = bigrams(second);
  const totalCount = firstBigrams.size + secondBigrams.size;
  if (totalCount === 0) return false;
  const sharedCount = [...firstBigrams].filter((bigram) => secondBigrams.has(bigram)).length;
  return (2 * sharedCount) / totalCount >= 0.6;
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
      distanceMeters(point, candidate) <= MATCH_METERS && isSimilarName(point.name, candidate.name)
  );
}

function isFoodStore(store) {
  return store.indsLclsNm === '음식' || (store.indsSclsNm ?? '').includes('편의점');
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
        상호: store.name,
        업종: store.category,
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
    .filter((place) => !hasMatch(place, publicStores))
    .map((place) => {
      const near = nearest(place, publicStores);
      return {
        id: place.id,
        상호: place.name,
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
  const food = raw.filter(isFoodStore);
  // 업종 이름이 바뀌면 필터가 0건이 되므로 분포를 보여 줘서 바로 알아채게 한다
  const counts = Object.groupBy(raw, (store) => store.indsLclsNm);
  const countByCategory = Object.fromEntries(
    Object.entries(counts).map(([category, stores]) => [category, stores.length])
  );
  console.log(`반경 ${radius}m 상가 ${raw.length}곳, 업종 대분류:`, countByCategory);
  if (food.length === 0)
    throw new Error('음식·편의점 업종이 0건이다. 위 대분류 이름을 보고 isFoodStore를 고친다');

  const publicStores = food.map((store) => ({
    name: store.brchNm ? `${store.bizesNm} ${store.brchNm}` : store.bizesNm,
    category: [store.indsMclsNm, store.indsSclsNm].filter(Boolean).join(' > '),
    address: store.rdnmAdr || store.lnoAdr,
    lat: Number(store.lat),
    lng: Number(store.lon),
  }));
  const { ours, missing, closed } = audit(publicStores, await fetchOurPlaces(), radius);

  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'missing.csv'), toCsv(missing));
  writeFileSync(join(outDir, 'closed.csv'), toCsv(closed));
  console.log(
    `공공데이터 음식·편의점 ${publicStores.length}곳, 우리 가게 ${ours.length}곳\n` +
      `우리에게 없는 가게 ${missing.length}곳 -> ${join(outDir, 'missing.csv')}\n` +
      `폐업·이전 후보 ${closed.length}곳 -> ${join(outDir, 'closed.csv')}`
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
