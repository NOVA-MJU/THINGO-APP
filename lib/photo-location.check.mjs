// 실행: node lib/photo-location.check.mjs
import assert from 'node:assert/strict';
import {
  boundsAround,
  boundsAroundAll,
  distanceMeters,
  assignPhotosToUploadedPlaces,
  buildingKeyOf,
  groupPhotosByDay,
  groupPhotosNearPlace,
  filterPhotosForPlace,
  groupVisitedPlaces,
} from './photo-location.ts';

const place = { latitude: 37.5770104, longitude: 126.9231148 }; // 백련순대국
const neighbor = { latitude: 37.5769333, longitude: 126.9227346 }; // 백련팥죽
const campus = { latitude: 37.5803, longitude: 126.9236 };

const d = distanceMeters(place, neighbor);
assert.ok(d > 30 && d < 40, `neighbor distance ${d}`);
assert.equal(Math.round(distanceMeters(place, place)), 0);

const at = (s) => new Date(s).getTime();
const photos = [
  { id: 'a', takenAt: at('2026-10-24T12:40:00'), location: place },
  { id: 'b', takenAt: at('2026-10-24T12:10:00'), location: place },
  { id: 'c', takenAt: at('2026-09-30T18:20:00'), location: neighbor },
  { id: 'd', takenAt: at('2026-10-01T09:00:00'), location: campus },
];

const visits = groupPhotosNearPlace(photos, place);
assert.deepEqual(
  visits.map((v) => [v.day, v.photos.map((p) => p.id)]),
  [
    ['2026-10-24', ['b', 'a']],
    ['2026-09-30', ['c']],
  ]
);
assert.deepEqual(
  groupPhotosNearPlace(photos, place, 20).map((v) => v.day),
  ['2026-10-24']
);
assert.deepEqual(groupPhotosNearPlace([], place), []);

// 상자는 반경 원을 다 덮어야 한다 (모서리 방향은 원보다 넓다)
const box = boundsAround(place, 70);
const inBox = (p) =>
  p.latitude >= box.minLatitude &&
  p.latitude <= box.maxLatitude &&
  p.longitude >= box.minLongitude &&
  p.longitude <= box.maxLongitude;
assert.ok(inBox(neighbor), 'neighbor (35m) inside box');
assert.ok(!inBox(campus), 'campus (~370m) outside box');
for (const [dLat, dLng] of [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]) {
  const edge = {
    latitude: place.latitude + ((dLat * (box.maxLatitude - box.minLatitude)) / 2) * 0.999,
    longitude: place.longitude + ((dLng * (box.maxLongitude - box.minLongitude)) / 2) * 0.999,
  };
  const d = distanceMeters(place, edge);
  assert.ok(d > 69 && d < 70, `box edge distance ${d}`);
}
// 모래내곱창(서버 좌표)과 사용자가 그곳에서 찍은 사진 좌표 (19m)
const gopchang = { latitude: 37.5784187, longitude: 126.9236604 };
const gopchangPhoto = { latitude: 37.57857, longitude: 126.92376 };
assert.ok(distanceMeters(gopchang, gopchangPhoto) < 25);
assert.equal(
  groupPhotosNearPlace(
    [{ id: 'g', takenAt: at('2025-05-20T19:00:00'), location: gopchangPhoto }],
    gopchang
  ).length,
  1
);

// 사진은 가장 가까운 가게 기준으로 묶이고, 거리가 비슷한(10m 안) 가게는 후보로 같이 들어간다
// 백련순대국 자리 사진(0m)에 35m 옆 백련팥죽은 후보가 아니고, 백련팥죽 자리 사진(0m)도 마찬가지
const groups = groupVisitedPlaces(photos, [
  { id: 1, ...place },
  { id: 2, ...neighbor },
  { id: 3, ...gopchang },
]);
assert.deepEqual(
  groups.map((g) => [g.candidates.map((c) => c.placeId), g.photoIds]),
  [
    [[1], ['a', 'b']],
    [[2], ['c']],
  ]
);
assert.equal(groups[0].lastVisitAt, at('2026-10-24T12:40:00'));
// 실제 대동 상권: 곱창 사진에서 킹콩부대찌개·아쯔다무라 18m, 모래내곱창 19m -> 셋 다 후보, 가까운 순
const dense = groupVisitedPlaces(
  [{ id: 'g', takenAt: at('2025-05-20T19:00:00'), location: gopchangPhoto }],
  [
    { id: 145, ...gopchang },
    { id: 55, latitude: 37.5785213, longitude: 126.9235679 },
    { id: 79, latitude: 37.5786694, longitude: 126.9235987 },
    { id: 900, latitude: 37.5795, longitude: 126.925 },
  ]
);
assert.equal(dense.length, 1);
assert.deepEqual(
  dense[0].candidates.map((c) => c.placeId).sort(),
  [145, 55, 79].sort(),
  'kingkong, atsudamura, gopchang are all candidates'
);
assert.ok(!dense[0].candidates.some((c) => c.placeId === 900), 'far place is not a candidate');
// 같은 식사 사진 두 장(실제 시뮬레이터 테스트 좌표)의 가장 가까운 가게가 갈려도(킹콩 / 아쯔다무라) 핀 하나로 합친다
const shops = [
  { id: 145, ...gopchang },
  { id: 55, latitude: 37.5785213, longitude: 126.9235679 },
  { id: 79, latitude: 37.5786694, longitude: 126.9235987 },
];
const merged = groupVisitedPlaces(
  [
    {
      id: 'g1',
      takenAt: at('2025-05-20T19:10:00'),
      location: { latitude: 37.57857, longitude: 126.92376 },
    },
    {
      id: 'g2',
      takenAt: at('2025-05-20T19:11:00'),
      location: { latitude: 37.57858, longitude: 126.92377 },
    },
  ],
  shops
);
assert.equal(merged.length, 1, `merged into one pin, got ${merged.length}`);
assert.deepEqual(merged[0].photoIds.sort(), ['g1', 'g2']);
// 장소 상세도 핀과 같은 기준: 백련팥죽 상세에는 35m 옆 백련순대국 자리 사진이 빠진다
const both = [
  { id: 1, ...place },
  { id: 2, ...neighbor },
];
assert.deepEqual(
  filterPhotosForPlace(photos, { id: 2, ...neighbor }, both).map((p) => p.id),
  ['c']
);
assert.deepEqual(
  filterPhotosForPlace(photos, { id: 1, ...place }, both).map((p) => p.id),
  ['a', 'b']
);
// 모래내곱창 상세에는 곱창 사진 두 장이 모두 나온다 (킹콩·아쯔다무라와 거리 차가 10m 안)
assert.deepEqual(
  filterPhotosForPlace(
    [
      { id: 'g1', takenAt: 0, location: { latitude: 37.57857, longitude: 126.92376 } },
      { id: 'g2', takenAt: 0, location: { latitude: 37.57858, longitude: 126.92377 } },
    ],
    { id: 145, ...gopchang },
    shops
  ).map((p) => p.id),
  ['g1', 'g2']
);
const all = boundsAroundAll([place, gopchang], 70);
assert.ok(all.minLatitude < place.latitude && all.maxLatitude > gopchang.latitude);
// 날짜별 묶음: 최근 날이 먼저, 같은 날 안에서는 찍은 순서
assert.deepEqual(
  groupPhotosByDay(photos).map((day) => [day.day, day.photos.map((photo) => photo.id)]),
  [
    ['2026-10-24', ['b', 'a']],
    ['2026-10-01', ['d']],
    ['2026-09-30', ['c']],
  ]
);

// 건물 키: 층·호수·괄호를 떼고, 주소가 없으면 가게 하나가 건물 하나
assert.equal(buildingKeyOf('서울 서대문구 증가로 150 2층', 1), '서울 서대문구 증가로 150');
assert.equal(buildingKeyOf('서울 서대문구 거북골로 84 (남가좌동)', 2), '서울 서대문구 거북골로 84');
assert.equal(buildingKeyOf('서울 서대문구 명지대길 54 지하 1층', 3), '서울 서대문구 명지대길 54');
assert.equal(buildingKeyOf('서울 서대문구 거북골로 25-8', 4), '서울 서대문구 거북골로 25-8');
assert.equal(buildingKeyOf(null, 5), 'place:5');

// 리뷰에 올린 사진과 같은 날 3시간·100m 안에서 찍은 사진은 그 가게로 (GPS가 옆 가게를 가리켜도)
const uploadedAtPlace = {
  id: 'a',
  takenAt: at('2026-10-24T12:40:00'),
  location: place,
  placeId: 7,
};
const assigned = assignPhotosToUploadedPlaces(photos, [uploadedAtPlace]);
assert.equal(assigned.get('b'), 7); // 같은 날 30분 전, 같은 자리
assert.equal(assigned.has('a'), false); // 올린 사진 자신은 빼고
assert.equal(assigned.has('c'), false); // 다른 날
assert.equal(assigned.has('d'), false); // 다른 날, 다른 곳
const laterSameDayFar = { id: 'e', takenAt: at('2026-10-24T13:00:00'), location: campus };
assert.equal(assignPhotosToUploadedPlaces([laterSameDayFar], [uploadedAtPlace]).size, 0); // 같은 날이어도 100m 밖

console.log('ok');
