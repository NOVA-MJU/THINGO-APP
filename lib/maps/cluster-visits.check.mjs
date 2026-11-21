// 실행: node lib/maps/cluster-visits.check.mjs
import assert from 'node:assert/strict';
import { clusterOverlappingPoints } from './cluster-visits.ts';

// 대동 상권처럼 30m 간격으로 붙은 세 곳과 400m 떨어진 한 곳
const recentBar = { name: '어나더라운드', latitude: 37.5796, longitude: 126.925 };
const nearbyNoodle = { name: '정든밤', latitude: 37.5797, longitude: 126.9253 };
const nearbyCafe = { name: '카페인중독', latitude: 37.5794, longitude: 126.9248 };
const farCafe = { name: '스타벅스', latitude: 37.5832, longitude: 126.9215 };
const visits = [recentBar, nearbyNoodle, nearbyCafe, farCafe];

// 처음 화면(줌 16): 붙은 세 곳은 하나로 묶이고 최근에 간 곳이 대표, 떨어진 곳은 따로
const atCampusZoom = clusterOverlappingPoints(visits, 16);
assert.equal(atCampusZoom.length, 2);
assert.equal(atCampusZoom[0].representative, recentBar);
assert.deepEqual(
  atCampusZoom[0].members.map((visit) => visit.name),
  ['어나더라운드', '정든밤', '카페인중독']
);
assert.deepEqual(atCampusZoom[1].members, [farCafe]);

// 크게 확대하면(줌 19) 다 풀린다
assert.equal(clusterOverlappingPoints(visits, 19).length, 4);
assert.deepEqual(clusterOverlappingPoints([], 16), []);
console.log('ok');
