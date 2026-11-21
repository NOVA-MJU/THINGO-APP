// 실행: node lib/maps/match-symbol.check.mjs
import assert from 'node:assert/strict';
import { findSymbolMatch, isSimilarName } from './match-symbol.ts';

assert.ok(isSimilarName('스타벅스 명지대점', '스타벅스'));
assert.ok(isSimilarName('명지대학교 인문캠퍼스 학생회관', '학생회관'));
assert.ok(!isSimilarName('호랑마라', '탄뽀뽀'));
assert.ok(!isSimilarName('GS25', 'CU'));

const near = { name: '삼정식당', latitude: 37.5799, longitude: 126.9252 };
const far = { name: '삼정식당', latitude: 37.585, longitude: 126.9252 };
const other = { name: '대명식당', latitude: 37.5797, longitude: 126.9251 };
const symbol = { caption: '삼정식당', latitude: 37.5796415, longitude: 126.9250425 };
assert.equal(findSymbolMatch(symbol, [far, other, near]), near);
assert.equal(findSymbolMatch(symbol, [far, other]), null);
console.log('ok');
