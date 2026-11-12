// 실행: node lib/photo-location.check.mjs
import assert from 'node:assert/strict';
import { distanceMeters, groupPhotosNearPlace } from './photo-location.ts';

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
console.log('ok');
