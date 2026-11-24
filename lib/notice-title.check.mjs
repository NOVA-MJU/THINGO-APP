// 실행: node lib/notice-title.check.mjs
import assert from 'node:assert/strict';
import { stripNoticeTitleTags } from './notice-title.ts';

assert.equal(
  stripNoticeTitleTags('[한국장학재단] 2027년도 1학기 국가장학금 신청 안내'),
  '2027년도 1학기 국가장학금 신청 안내'
);
assert.equal(stripNoticeTitleTags('[학부·대학원] [자연캠퍼스] 성적 입력 안내'), '성적 입력 안내');
assert.equal(
  stripNoticeTitleTags(
    '[MJ대학일자리플러스센터] 2026 동계 거점형 특화프로그램 [반도체공정실습] 참여자모집'
  ),
  '2026 동계 거점형 특화프로그램 [반도체공정실습] 참여자모집'
);
assert.equal(stripNoticeTitleTags('교섭 요구 사실 공고문'), '교섭 요구 사실 공고문');
assert.equal(stripNoticeTitleTags('[공지]'), '[공지]');
console.log('ok');
