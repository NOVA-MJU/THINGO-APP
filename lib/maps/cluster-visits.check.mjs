// 실행: node lib/maps/cluster-visits.check.mjs
import assert from 'node:assert/strict';
import { clusterOverlappingPins, zoomToFit, zoomToSplit } from './cluster-visits.ts';

// 대동 상권처럼 수십 m 간격으로 붙은 곳들과 400m 떨어진 한 곳 (앞쪽이 최근에 간 곳)
const recentBar = { name: '어나더라운드', latitude: 37.5796, longitude: 126.925 };
const nearbyNoodle = { name: '정든밤', latitude: 37.5797, longitude: 126.9253 };
const nearbyCafe = { name: '카페인중독', latitude: 37.5794, longitude: 126.9248 };
const farCafe = { name: '스타벅스', latitude: 37.5832, longitude: 126.9215 };
const visits = [recentBar, nearbyNoodle, nearbyCafe, farCafe];

// 처음 화면(줌 16): 모든 곳이 정확히 한 구역에 들어가고, 멀리 떨어진 곳은 따로 묶인다
const atCampusZoom = clusterOverlappingPins(visits, 16);
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
  clusterOverlappingPins(visits, 16).map((cluster) => cluster.members.map((member) => member.name)),
  atCampusZoom.map((cluster) => cluster.members.map((member) => member.name))
);

// 크게 확대하면(줌 20) 다 풀린다
assert.equal(clusterOverlappingPins(visits, 20).length, 4);
assert.deepEqual(clusterOverlappingPins([], 16), []);

// 묶음 핀 확대: 처음 나뉘는 줌까지만 키운다 (그 줌에서는 둘 이상, 바로 전 줌에서는 하나)
const nearbyThree = [recentBar, nearbyNoodle, nearbyCafe];
const splitZoom = zoomToSplit(nearbyThree, 15, 19);
assert.ok(splitZoom > 15 && splitZoom <= 19);
assert.ok(clusterOverlappingPins(nearbyThree, splitZoom).length > 1);
assert.equal(clusterOverlappingPins(nearbyThree, splitZoom - 0.5).length, 1);
// 같은 자리 두 곳은 끝까지 안 나뉘어 최대 줌
assert.equal(zoomToSplit([recentBar, { ...recentBar, name: '같은 건물' }], 15, 19), 19);
// 화면에 다 들어오는 줌: 붙어 있는 곳들은 크게, 멀리 떨어진 곳까지 넣으면 작게. 한 점이면 최대 줌
const fitNear = zoomToFit(nearbyThree, 340, 250, 19);
const fitWithFar = zoomToFit(visits, 340, 250, 19);
assert.ok(fitWithFar < fitNear);
assert.equal(zoomToFit([farCafe], 340, 250, 19), 19);
// 그 줌에서 점들의 폭이 보이는 영역을 넘지 않는다
const metersPerPixelAt = (zoom) => (156543.03392 * Math.cos((37.58 * Math.PI) / 180)) / 2 ** zoom;
const spanMeters =
  (Math.max(...visits.map((v) => v.latitude)) - Math.min(...visits.map((v) => v.latitude))) *
  111320;
assert.ok(spanMeters / metersPerPixelAt(fitWithFar) <= 250 + 1);
console.log('ok');
