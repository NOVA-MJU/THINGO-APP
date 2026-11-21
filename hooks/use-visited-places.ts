import {
  fetchReviewablePlaces,
  matchUploadedReviewPhotos,
  PLACE_PHOTOS_QUERY_KEY,
  usePhotoPermission,
} from '@/hooks/use-place-photos';
import { dismissPlacePhotos, getDismissedPlacePhotos } from '@/lib/maps/dismissed-place-photos';
import { getUploadedPhotoIds } from '@/lib/maps/uploaded-review-photos';
import { showAlert } from '@/lib/alert';
import { getReviewedPlaceIds } from '@/lib/maps/reviewed-places';
import { categoryHints, isFoodPhoto, narrowCandidatesByFood } from '@/lib/photo-food';
import { getPhotoLabels } from '@/lib/photo-labels';
import {
  boundsAroundAll,
  DEFAULT_PLACE_RADIUS_METERS,
  groupVisitedPlaces,
} from '@/lib/photo-location';
import PhotoLocationScan from '@/modules/photo-location-scan';
import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as MediaLibrary from 'expo-media-library';
import * as React from 'react';

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
};

export type VisitedPhoto = { id: string; takenAt: number };

// 지도 핀 하나 (한 자리에서 찍은 아직 리뷰에 안 올린 음식 사진 묶음). 사진 위치는 실내 GPS 오차가 커서
// 어느 가게인지는 사용자가 사진을 보고 고르게 하고, 가까운 가게를 후보로 둔다
export type VisitedPlace = {
  key: string;
  // 첫 번째가 핀 위치(사진에서 가장 가까운 가게)
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
  const visited: VisitedPlace[] = [];
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
    // 사진 음식으로 붙어 있는 가게 후보를 좁힌다 (커피 사진이면 카페만)
    const hints = categoryHints(foodIds.map((id) => labels[id]));

    // 리뷰를 쓴 가게도 후보로 둔다 (다시 가서 찍은 사진일 수 있다. 이미 올린 사진은 위에서 뺐다)
    const candidates = narrowCandidatesByFood(
      group.candidates.map((candidate) => {
        const place = placeById.get(candidate.placeId)!;
        return {
          id: place.id,
          name: place.title,
          categoryCode: place.categoryCode,
          latitude: place.latitude,
          longitude: place.longitude,
          distanceMeters: candidate.distanceMeters,
        };
      }),
      hints
    );
    if (!candidates.length) continue;
    visited.push({
      // 묶음 기준 가게(리뷰해서 후보에서 빠졌어도)로 핀마다 다른 키를 만든다
      key: String(group.candidates[0].placeId),
      candidates,
      photos: foodIds
        .map((id) => ({ id, takenAt: takenAtById.get(id) ?? group.lastVisitAt }))
        .sort((first, second) => second.takenAt - first.takenAt),
      lastVisitAt: group.lastVisitAt,
    });
    if (visited.length >= MAX_VISITED_PLACES) break;
  }
  return visited;
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

// 내 사진 제안(장소의 "여기서 찍은 내 사진", 다녀온 곳 핀)을 다시 찾는다. 사진을 숨기거나 리뷰를 쓰고·고치고·지운 뒤 부른다
export function refreshMyPhotoSuggestions(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: PLACE_PHOTOS_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: VISITED_PLACES_QUERY_KEY });
}
