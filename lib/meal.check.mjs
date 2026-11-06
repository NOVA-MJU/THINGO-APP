// 실행: node lib/meal.check.mjs
import assert from 'node:assert/strict';
import { cleanMeals } from './meal.ts';

assert.deepEqual(cleanMeals(['돈육김치볶음&온두부', ' 쌀밥 ', '']), [
  '돈육김치볶음&온두부',
  '쌀밥',
]);
assert.deepEqual(cleanMeals(['[일품DAY]', '돈육김치덮밥']), ['[일품DAY]', '돈육김치덮밥']);
assert.deepEqual(cleanMeals(['등록된 식단 내용이 없습니다.']), []);
assert.deepEqual(cleanMeals([]), []);
console.log('ok');
