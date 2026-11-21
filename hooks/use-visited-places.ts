import {
  fetchReviewablePlaces,
  matchUploadedReviewPhotos,
  PLACE_PHOTOS_QUERY_KEY,
  usePhotoPermission,
} from '@/hooks/use-place-photos';
import { dismissPlacePhotos, getDismissedPlacePhotos } from '@/lib/maps/dismissed-place-photos';
import { getUploadedPhotoIds } from '@/lib/maps/uploaded-review-photos';
import { MY_PLACE_REVIEWS_QUERY_KEY } from '@/hooks/use-my-place-reviews';
import { showAlert } from '@/lib/alert';
import { getReviewedPlaceIds } from '@/lib/maps/reviewed-places';
import { categoryHints, isFoodPhoto, narrowCandidatesByFood } from '@/lib/photo-food';
import { getPhotoLabels } from '@/lib/photo-labels';
import {
  boundsAroundAll,
  buildingKeyOf,
  DEFAULT_PLACE_RADIUS_METERS,
  groupVisitedPlaces,
} from '@/lib/photo-location';
import PhotoLocationScan from '@/modules/photo-location-scan';
import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as MediaLibrary from 'expo-media-library';
import * as React from 'react';

type ReviewablePlace = Awaited<ReturnType<typeof fetchReviewablePlaces>>[number];

// 지도에 띄울 최대 핀 수. 핀마다 라벨 뷰를 이미지로 그려서 너무 많으면 지도가 느려진다
const MAX_VISITED_PLACES = 20;
// 방문 하나에서 음식 사진인지 분류해 볼 최대 장수, 살펴볼 최대 방문 수 (처음 한 번만 분류하고 결과는 기기에 기억한다)
const MAX_CLASSIFIED_PHOTOS_PER_VISIT = 12;
const MAX_CHECKED_VISITS = 60;
// 이 기기에서 리뷰를 쓴 가게 하나에서 예전 리뷰 사진과 비교해 볼 최대 사진 수
const MAX_MATCHED_PHOTOS_PER_PLACE = 60;

export const VISITED_PLACES_QUERY_KEY = ['visited-places'] as const;

export type VisitedPlaceCandidate = {
  id: number;
  name: string;
  categoryCode: string;
  latitude: number;
  longitude: number;
  // 이 방문 사진 중 가장 가까운 사진과의 거리
  distanceMeters: number;
  // 핀 건물 안 가게인지 (아니면 GPS 오차로 같이 걸린 옆 건물 가게)
  inBuilding: boolean;
};

export type VisitedPhoto = { id: string; takenAt: number };

// 지도 핀 하나 = 건물 하나 (그 건물 근처에서 찍은 아직 리뷰에 안 올린 음식 사진 묶음).
// 실내 GPS 오차로 붙어 있는 가게는 가릴 수 없지만 건물 정도는 맞아서, 사진을 건물 단위로 묶고
// 어느 가게인지는 사용자가 사진을 보고 그 건물 가게 중에서 고르게 한다
export type VisitedPlace = {
  // 건물 키 (buildingKeyOf)
  key: string;
  // 건물 도로명 주소. 없으면 null
  address: string | null;
  // 핀 자리 (건물 안 가게들의 가운데)
  latitude: number;
  longitude: number;
  // 이 건물 가게(사진 음식에 맞는 곳 먼저), 그 뒤에 옆 건물 가게(가까운 순)
  candidates: VisitedPlaceCandidate[];
  // 최근에 찍은 사진부터
  photos: VisitedPhoto[];
  lastVisitAt: number;
};

// 내 사진첩 전체에서 학교 주변 가게 근처에서 찍은 사진을 찾아 "다녀온 곳"을 만든다 (iOS, 사진 권한이 있을 때만)
// 사진 위치는 기기 안에서만 비교하고, 리뷰에 이미 올린 사진은 뺀다 (리뷰를 고쳐 빼거나 지우면 다시 나온다)
export function useVisitedPlaces() {
  const permission = usePhotoPermission();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: [...VISITED_PLACES_QUERY_KEY, permission.accessPrivileges],
    queryFn: () => findVisitedPlaces(queryClient),
    enabled: permission.granted,
    staleTime: Infinity,
  });
  const { refetch } = query;

  // 사진을 새로 찍거나 허용 범위가 바뀌면 다시 찾는다
  React.useEffect(() => {
    if (!permission.granted) return;
    const subscription = MediaLibrary.addListener(() => void refetch());
    return () => subscription.remove();
  }, [permission.granted, refetch]);

  return {
    status: permission.status,
    requestPermission: permission.requestPermission,
    places: permission.granted ? (query.data ?? []) : [],
    isFetching: query.isFetching,
  };
}

async function findVisitedPlaces(queryClient: QueryClient): Promise<VisitedPlace[]> {
  const [places, reviewedIds, dismissedPhotos] = await Promise.all([
    fetchReviewablePlaces(queryClient),
    getReviewedPlaceIds(),
    getDismissedPlacePhotos(),
  ]);
  if (!places.length) return [];

  const bounds = boundsAroundAll(places, DEFAULT_PLACE_RADIUS_METERS);
  const scanned = await PhotoLocationScan!.findPhotosInBounds(
    bounds.minLatitude,
    bounds.maxLatitude,
    bounds.minLongitude,
    bounds.maxLongitude
  );
  const groups = groupVisitedPlaces(
    scanned.map((photo) => ({
      id: photo.id,
      takenAt: photo.takenAt,
      location: { latitude: photo.latitude, longitude: photo.longitude },
    })),
    places
  );
  const takenAtById = new Map(scanned.map((photo) => [photo.id, photo.takenAt]));

  // 이 기기에서 리뷰를 쓴 가게는 예전에 올린 리뷰 사진을 사진첩과 비교해 찾아 둔다 (한 번 비교한 이미지는 다시 받지 않는다).
  // 비교하지 못하면(리뷰 조회 실패 등) 그 사진이 핀에 남을 뿐이라 넘어간다
  await Promise.all(
    reviewedIds.map((placeId) =>
      matchUploadedReviewPhotos(
        placeId,
        groups
          .filter((group) => group.candidates.some((candidate) => candidate.placeId === placeId))
          .flatMap((group) => group.photoIds)
          // 사진마다 그림 특징값을 계산해서 오래 걸린다. 최근 사진만 비교한다 (장소 상세와 같은 장수)
          .slice(0, MAX_MATCHED_PHOTOS_PER_PLACE)
      ).catch(() => undefined)
    )
  );
  const uploadedIds = await getUploadedPhotoIds();

  const placeById = new Map(places.map((place) => [place.id, place]));
  const placesByBuilding = places.reduce((grouped, place) => {
    const key = buildingKeyOf(place.location, place.id);
    return grouped.set(key, [...(grouped.get(key) ?? []), place]);
  }, new Map<string, ReviewablePlace[]>());

  // 사진 묶음(가장 가까운 가게 기준)을 그 가게가 있는 건물로 모은다. Map은 넣은 순서를 지켜서 최근에 간 건물이 앞이다
  const buildings = new Map<
    string,
    { photoIds: string[]; labels: string[][]; nearby: Map<number, number>; lastVisitAt: number }
  >();
  for (const group of groups.slice(0, MAX_CHECKED_VISITS)) {
    // 가게 근처에서 찍었어도 음식·음료 사진이 없으면 다녀온 곳으로 보지 않는다 (지나가며 찍은 사진, 셀카 등)
    // 후보 가게 중 한 곳에서라도 X로 숨긴 사진은 뺀다 (지금은 없어진 예전 가게 사진이 새 가게에 붙지 않게)
    const dismissedIds = group.candidates.flatMap(
      (candidate) => dismissedPhotos[String(candidate.placeId)] ?? []
    );
    const recentIds = group.photoIds
      .filter((id) => !dismissedIds.includes(id) && !uploadedIds.includes(id))
      .slice(0, MAX_CLASSIFIED_PHOTOS_PER_VISIT);
    const labels = await getPhotoLabels(recentIds);
    const foodIds = recentIds.filter((id) => isFoodPhoto(labels[id] ?? []));
    if (!foodIds.length) continue;

    const anchor = placeById.get(group.candidates[0].placeId)!;
    const key = buildingKeyOf(anchor.location, anchor.id);
    if (!buildings.has(key) && buildings.size >= MAX_VISITED_PLACES) continue;
    const building = buildings.get(key) ?? {
      photoIds: [],
      labels: [],
      nearby: new Map<number, number>(),
      lastVisitAt: 0,
    };
    // 리뷰를 쓴 가게도 후보로 둔다 (다시 가서 찍은 사진일 수 있다. 이미 올린 사진은 위에서 뺐다)
    group.candidates.forEach((candidate) =>
      building.nearby.set(
        candidate.placeId,
        Math.min(building.nearby.get(candidate.placeId) ?? Infinity, candidate.distanceMeters)
      )
    );
    buildings.set(key, {
      ...building,
      photoIds: [...building.photoIds, ...foodIds],
      labels: [...building.labels, ...foodIds.map((id) => labels[id] ?? [])],
      lastVisitAt: Math.max(building.lastVisitAt, group.lastVisitAt),
    });
  }

  return [...buildings.entries()].map(([key, building]) => {
    const buildingPlaces = placesByBuilding.get(key) ?? [];
    const toCandidate = (place: ReviewablePlace, inBuilding: boolean) => ({
      id: place.id,
      name: place.title,
      categoryCode: place.categoryCode,
      latitude: place.latitude,
      longitude: place.longitude,
      distanceMeters: building.nearby.get(place.id) ?? 0,
      inBuilding,
    });
    // 사진 음식에 맞는 가게를 앞에 둔다 (커피 사진이면 카페 먼저). 나머지도 빼지 않고 뒤에 둔다
    const preferredPlaces = narrowCandidatesByFood(buildingPlaces, categoryHints(building.labels));
    const buildingCandidates = [
      ...preferredPlaces,
      ...buildingPlaces.filter((place) => !preferredPlaces.includes(place)),
    ].map((place) => toCandidate(place, true));
    const nearbyCandidates = [...building.nearby.entries()]
      .filter(([placeId]) => !buildingPlaces.some((place) => place.id === placeId))
      .sort(([, first], [, second]) => first - second)
      .map(([placeId]) => toCandidate(placeById.get(placeId)!, false));
    return {
      key,
      address: buildingPlaces[0]?.location ?? null,
      latitude: average(buildingPlaces.map((place) => place.latitude)),
      longitude: average(buildingPlaces.map((place) => place.longitude)),
      candidates: [...buildingCandidates, ...nearbyCandidates],
      photos: building.photoIds
        .map((id) => ({ id, takenAt: takenAtById.get(id) ?? building.lastVisitAt }))
        .sort((first, second) => second.takenAt - first.takenAt),
      lastVisitAt: building.lastVisitAt,
    };
  });
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

// "여기서 찍은 내 사진" 제안의 X: 그 장소(들)에서 이 사진들을 숨기고, 장소 사진과 다녀온 곳 핀을 다시 찾는다
export function useDismissPlacePhotos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ placeIds, photoIds }: { placeIds: number[]; photoIds: string[] }) =>
      dismissPlacePhotos(placeIds, photoIds),
    onSuccess: () => refreshMyPhotoSuggestions(queryClient),
    onError: () => showAlert('사진을 숨기지 못했어요', '잠시 후 다시 시도해주세요.'),
  });
}

// 내 사진 제안(장소의 "여기서 찍은 내 사진", 다녀온 곳 핀)과 내가 쓴 리뷰 목록을 다시 찾는다.
// 사진을 숨기거나 리뷰를 쓰고·고치고·지운 뒤 부른다
export function refreshMyPhotoSuggestions(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: MY_PLACE_REVIEWS_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: PLACE_PHOTOS_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: VISITED_PLACES_QUERY_KEY });
}
