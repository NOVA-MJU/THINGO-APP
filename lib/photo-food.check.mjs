// 실행: node lib/photo-food.check.mjs
import assert from 'node:assert/strict';
import { categoryHints, isFoodPhoto, narrowCandidatesByFood } from './photo-food.ts';

assert.ok(isFoodPhoto(['food', 'ramen']));
assert.ok(isFoodPhoto(['coffee']));
assert.ok(!isFoodPhoto(['people', 'adult', 'restaurant']));
assert.ok(!isFoodPhoto([]));

const hints = categoryHints([
  ['food', 'coffee'],
  ['dessert', 'cake'],
]);
assert.deepEqual([...hints], ['daedong-cafe']);

const candidates = [
  { id: 1, categoryCode: 'daedong-bar' },
  { id: 2, categoryCode: 'daedong-cafe' },
  { id: 3, categoryCode: 'daedong-kr' },
];
assert.deepEqual(
  narrowCandidatesByFood(candidates, hints).map((c) => c.id),
  [2]
);
// 맞는 카테고리가 없으면 후보를 그대로 둔다
assert.deepEqual(
  narrowCandidatesByFood(candidates, new Set(['daedong-jp'])).map((c) => c.id),
  [1, 2, 3]
);
assert.deepEqual(
  narrowCandidatesByFood(candidates, new Set()).map((c) => c.id),
  [1, 2, 3]
);
console.log('ok');
