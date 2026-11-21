// 전수조사(scripts/audit-places.mjs)의 missing.csv에서 사람이 확인하고 "추가" 칸에 O를 적은 가게만 서버 장소로 올린다.
// 서버 동기화 API(POST /api/v1/map/sync/map)는 code로 덮어쓰기(upsert)하므로 공공데이터 상가업소번호로 code를 만들어
// 같은 파일을 다시 올려도 가게가 두 번 생기지 않는다. 올린 가게는 네이버 글자 대조(GET /map/symbol-match)에서 바로 찾힌다.
//
// 카테고리 칸이 빈 가게(약국·문구점 같은 새 카테고리 후보)는 서버에 그 카테고리를 먼저 만든 뒤 칸을 채워야 올라간다.
// 1) JSON만 만들기: node scripts/audit-to-sync.mjs place-audit/missing.csv > place-audit/sync.json
// 2) 서버에 올리기: THINGO_SYNC_TOKEN=<백엔드 sync 토큰> node scripts/audit-to-sync.mjs place-audit/missing.csv --upload
// 확인: node scripts/audit-to-sync.mjs --check
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const SYNC_URL = process.env.THINGO_SYNC_URL ?? 'https://api.thingo.kr/api/v1/sync/map';

// 따옴표로 감싼 CSV(audit-places.mjs가 만든 형식, 엑셀 BOM 포함)를 줄마다 객체로 읽는다
export function parseCsv(text) {
  const rows = text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) =>
      [...line.matchAll(/"((?:[^"]|"")*)"|([^,]+)|(?<=,|^)(?=,|$)/g)].map((cell) =>
        (cell[1] ?? cell[2] ?? '').replace(/""/g, '"')
      )
    );
  const [header = [], ...body] = rows;
  return body.map((cells) =>
    Object.fromEntries(header.map((column, index) => [column, cells[index] ?? '']))
  );
}

export function toSyncPlaces(rows) {
  return (
    rows
      // 카테고리는 audit-places.mjs가 업종으로 정해 둔다. 비어 있으면(새 카테고리 후보) 서버에 그 카테고리가 없어 올리지 않는다
      .filter((row) => row.추가?.trim().toUpperCase() === 'O' && row.상가업소번호 && row.카테고리)
      .map((row) => ({
        code: `semas-${row.상가업소번호}`,
        categoryCode: row.카테고리,
        name: row.상호,
        latitude: Number(row.위도),
        longitude: Number(row.경도),
        address: row.주소,
      }))
  );
}

function selfCheck() {
  const header =
    '추가,상가업소번호,상호,업종,카테고리,새카테고리후보,주소,학교에서m,같은자리우리가게,위도,경도';
  const rows = [
    'O,MA0101,호랑마라,중식 > 마라탕,restaurant,,서울 서대문구 1,120,,37.58,126.923',
    ',MA0102,탄뽀뽀,일식 > 돈가스,restaurant,,서울 서대문구 2,150,,37.581,126.924',
    'O,MA0103,온누리약국,의약·화장품 소매 > 약국,,약국,서울 서대문구 3,90,,37.579,126.922',
  ];
  // audit-places.mjs가 쓰는 형식대로 엑셀 BOM과 따옴표를 붙인다
  const quote = (line) =>
    line
      .split(',')
      .map((cell) => `"${cell}"`)
      .join(',');
  const csv = '\uFEFF' + [header, ...rows].map(quote).join('\n');
  assert.deepEqual(toSyncPlaces(parseCsv(csv)), [
    {
      code: 'semas-MA0101',
      categoryCode: 'restaurant',
      name: '호랑마라',
      latitude: 37.58,
      longitude: 126.923,
      address: '서울 서대문구 1',
    },
  ]);
  console.log('ok');
}

async function main() {
  if (process.argv.includes('--check')) return selfCheck();
  const csvPath = process.argv[2];
  if (!csvPath) throw new Error('missing.csv 경로를 넘겨야 한다');
  const places = toSyncPlaces(parseCsv(readFileSync(csvPath, 'utf8')));
  if (!places.length) throw new Error('"추가" 칸에 O를 적은 가게가 없다');
  const payload = { places };

  if (!process.argv.includes('--upload')) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  const token = process.env.THINGO_SYNC_TOKEN;
  if (!token) throw new Error('THINGO_SYNC_TOKEN 환경변수에 백엔드 sync 토큰을 넣어야 한다');
  const response = await fetch(SYNC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Sync-Token': token },
    body: JSON.stringify(payload),
  });
  console.log(`서버 응답 ${response.status}: ${(await response.text()).slice(0, 300)}`);
  if (!response.ok) process.exit(1);
  console.log(`가게 ${places.length}곳을 올렸다`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
