// 실행: node lib/maps/guess-place-category.check.mjs
import assert from 'node:assert/strict';
import { guessPlaceCategory } from './guess-place-category.ts';

assert.equal(guessPlaceCategory('엔드베이커리'), 'daedong-cafe');
assert.equal(guessPlaceCategory('스타벅스 커피 명지대점'), 'daedong-cafe');
assert.equal(guessPlaceCategory('카페 바닐라'), 'daedong-cafe');
assert.equal(guessPlaceCategory('홍대포차'), 'daedong-bar');
assert.equal(guessPlaceCategory('멘야 라멘'), 'daedong-jp');
assert.equal(guessPlaceCategory('홍콩반점0410'), 'daedong-cn');
assert.equal(guessPlaceCategory('명륜진사갈비'), 'daedong-meat');
assert.equal(guessPlaceCategory('엽기떡볶이'), 'daedong-snack');
assert.equal(guessPlaceCategory('순대국밥'), 'daedong-kr');
assert.equal(guessPlaceCategory('또또'), null);
console.log('ok');
