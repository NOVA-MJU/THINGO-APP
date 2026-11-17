// 실행: node lib/maps/floor-plan-search.check.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { searchBuildingsFloorPlanTexts, searchFloorPlanTexts } from './floor-plan-search.ts';

const targets = JSON.parse(
  readFileSync(new URL('../../assets/map-floors/targets.json', import.meta.url), 'utf8')
);
const order = (building) =>
  Object.keys(targets[building]).sort((a, b) => {
    const level = (l) => (l.startsWith('B') ? -1 : 1) * Number(l.slice(1));
    return level(a) - level(b);
  });

// 종합관: 숫자만으로 호실 코드를 찾는다
const s1353 = searchFloorPlanTexts(targets['1'], order('1'), '1353');
assert.equal(s1353[0].key, 's1353');
assert.equal(s1353[0].floorLabel, 'F3');

// MCC관: 두 줄 이름은 코드로도, 이름으로도 찾힌다
for (const query of ['S10134', '코이노니아', '코이노니아 홀']) {
  const [first] = searchFloorPlanTexts(targets['8'], order('8'), query);
  assert.equal(first.key, 's10134코이노니아홀', query);
  assert.equal(first.text, 'S10134 코이노니아홀');
  assert.equal(first.floorLabel, 'F1');
}

// 학생회관: 이름으로 찾은 두 줄 라벨
assert.equal(searchFloorPlanTexts(targets['2'], order('2'), '소강당')[0].key, 's2111소강당');

// 다른 건물: 학생회관 시트에서 '1353'을 치면 종합관 3층으로 알려 준다
const all = Object.keys(targets).map((buildingId) => ({
  buildingId,
  floors: targets[buildingId],
  floorOrder: order(buildingId),
}));
assert.deepEqual(searchFloorPlanTexts(targets['2'], order('2'), '1353'), []);
const [other] = searchBuildingsFloorPlanTexts(all, '1353');
assert.equal(other.buildingId, '1');
assert.equal(other.floorLabel, 'F3');
assert.equal(other.key, 's1353');

// 빈 검색어, 없는 이름
assert.deepEqual(searchFloorPlanTexts(targets['1'], order('1'), '  '), []);
assert.deepEqual(searchFloorPlanTexts(targets['1'], order('1'), '없는호실이름'), []);

console.log('ok');
