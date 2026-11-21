// 실행: node lib/maps/cluster-visits.check.mjs
import assert from 'node:assert/strict';
import { clusterByGridCell } from './cluster-visits.ts';

// 대동 상권처럼 수십 m 간격으로 붙은 곳들과 400m 떨어진 한 곳 (앞쪽이 최근에 간 곳)
const recentBar = { name: '어나더라운드', latitude: 37.5796, longitude: 126.925 };
const nearbyNoodle = { name: '정든밤', latitude: 37.5797, longitude: 126.9253 };
const nearbyCafe = { name: '카페인중독', latitude: 37.5794, longitude: 126.9248 };
const farCafe = { name: '스타벅스', latitude: 37.5832, longitude: 126.9215 };
const visits = [recentBar, nearbyNoodle, nearbyCafe, farCafe];

// 처음 화면(줌 16): 모든 곳이 정확히 한 구역에 들어가고, 멀리 떨어진 곳은 따로 묶인다
const atCampusZoom = clusterByGridCell(visits, 16);
assert.equal(atCampusZoom.flatMap((cluster) => cluster.members).length, visits.length);
assert.ok(atCampusZoom.length < visits.length);
const farCluster = atCampusZoom.find((cluster) => cluster.members.includes(farCafe));
assert.deepEqual(farCluster.members, [farCafe]);
assert.equal(farCluster.position, farCafe);

// 구역 대표는 그 구역에서 가장 앞(최근)에 온 곳이고, 여러 곳이면 핀은 구역 안 곳들의 가운데다
atCampusZoom.forEach((cluster) => assert.equal(cluster.representative, cluster.members[0]));
const groupedCluster = atCampusZoom.find((cluster) => cluster.members.length > 1);
const averageLatitude =
  groupedCluster.members.reduce((sum, member) => sum + member.latitude, 0) /
  groupedCluster.members.length;
assert.ok(Math.abs(groupedCluster.position.latitude - averageLatitude) < 1e-9);

// 같은 점들은 몇 번을 계산해도 같은 구역으로 묶인다 (지도를 옮겨도 핀이 튀지 않는다)
assert.deepEqual(
  clusterByGridCell(visits, 16).map((cluster) => cluster.members.map((member) => member.name)),
  atCampusZoom.map((cluster) => cluster.members.map((member) => member.name))
);

// 크게 확대하면(줌 20) 다 풀린다
assert.equal(clusterByGridCell(visits, 20).length, 4);
assert.deepEqual(clusterByGridCell([], 16), []);
console.log('ok');
