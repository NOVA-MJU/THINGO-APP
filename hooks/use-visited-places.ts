import {
  fetchReviewablePlaces,
  PLACE_PHOTOS_SUPPORTED,
  usePhotoPermission,
} from '@/hooks/use-place-photos';
import { getReviewedPlaceIds } from '@/lib/maps/reviewed-places';
import {
  boundsAroundAll,
  DEFAULT_PLACE_RADIUS_METERS,
  groupVisitedPlaces,
} from '@/lib/photo-location';
import PhotoLocationScan from '@/modules/photo-location-scan';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import * as MediaLibrary from 'expo-media-library';
import * as React from 'react';

// 지도에 띄울 최대 핀 수. 핀마다 라벨 뷰를 이미지로 그려서 너무 많으면 지도가 느려진다
const MAX_VISITED_PLACES = 20;

export const VISITED_PLACES_QUERY_KEY = ['visited-places'] as const;

// 지도에서 "다녀온 곳" 핀을 끈 상태를 이 기기에 기억한다
const VISITED_PINS_HIDDEN_KEY = 'thingo.visitedPinsHidden';
const VISITED_PINS_HIDDEN_QUERY_KEY = ['visited-pins-hidden'] as const;

export type VisitedPlaceCandidate = {
  id: number;
  name: string;
  categoryCode: string;
  latitude: number;
  longitude: number;
  // 이 방문 사진 중 가장 가까운 사진과의 거리
  distanceMeters: number;
};

// 지도 핀 하나. 붙어 있는 가게라 어느 곳인지 사진만으로 정할 수 없으면 후보가 여러 곳이다
export type VisitedPlace = {
  key: string;
  // 첫 번째가 핀 위치(사진에서 가장 가까운 가게)
  candidates: VisitedPlaceCandidate[];
  photoIds: string[];
  lastVisitAt: number;
};

// 내 사진첩 전체에서 학교 주변 가게 근처에서 찍은 사진을 찾아 "다녀온 곳"을 만든다 (iOS, 사진 권한이 있을 때만)
// 사진 위치는 기기 안에서만 비교하고, 이미 이 기기에서 리뷰를 쓴 곳은 뺀다
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

  const { data: hiddenSetting } = useQuery({
    queryKey: VISITED_PINS_HIDDEN_QUERY_KEY,
    queryFn: async () => (await AsyncStorage.getItem(VISITED_PINS_HIDDEN_KEY)) === 'true',
    enabled: PLACE_PHOTOS_SUPPORTED,
    staleTime: Infinity,
  });
  const setPinsHidden = React.useCallback(
    (hidden: boolean) => {
      queryClient.setQueryData(VISITED_PINS_HIDDEN_QUERY_KEY, hidden);
      // 저장에 실패해도 이번 실행 동안은 바꾼 대로 보인다
      AsyncStorage.setItem(VISITED_PINS_HIDDEN_KEY, String(hidden)).catch(() => {});
    },
    [queryClient]
  );

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
    // 저장된 설정을 읽기 전에는 핀이 잠깐 떴다 사라지지 않게 숨김으로 본다
    pinsHidden: hiddenSetting !== false,
    setPinsHidden,
  };
}

async function findVisitedPlaces(queryClient: QueryClient): Promise<VisitedPlace[]> {
  const [places, reviewedIds] = await Promise.all([
    fetchReviewablePlaces(queryClient),
    getReviewedPlaceIds(),
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

  const placeById = new Map(places.map((place) => [place.id, place]));
  const visited: VisitedPlace[] = [];
  for (const group of groups) {
    // 이미 리뷰를 쓴 가게는 후보에서 뺀다 (후보가 다 빠지면 핀도 뺀다)
    const candidates = group.candidates
      .filter((candidate) => !reviewedIds.includes(candidate.placeId))
      .map((candidate) => {
        const place = placeById.get(candidate.placeId)!;
        return {
          id: place.id,
          name: place.title,
          categoryCode: place.categoryCode,
          latitude: place.latitude,
          longitude: place.longitude,
          distanceMeters: candidate.distanceMeters,
        };
      });
    if (!candidates.length) continue;
    visited.push({
      // 묶음 기준 가게(리뷰해서 후보에서 빠졌어도)로 핀마다 다른 키를 만든다
      key: String(group.candidates[0].placeId),
      candidates,
      photoIds: group.photoIds,
      lastVisitAt: group.lastVisitAt,
    });
    if (visited.length >= MAX_VISITED_PLACES) break;
  }
  return visited;
}
