import { getCategoryMarkers } from '@/api/maps';
import {
  boundsAround,
  DEFAULT_PLACE_RADIUS_METERS,
  filterPhotosForPlace,
  type GeoPoint,
  groupPhotosNearPlace,
  type LocatedPhoto,
} from '@/lib/photo-location';
import PhotoLocationScan from '@/modules/photo-location-scan';
import { type QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import * as MediaLibrary from 'expo-media-library';
import * as React from 'react';
import { AppState } from 'react-native';

export type PlacePhoto = LocatedPhoto & { width: number; height: number };

// iOS 앱에서만 사진첩을 훑는다. 웹은 사진첩에 접근할 수 없고, 안드로이드는 Google Play 사진 권한 정책 때문에
// 시스템 선택기(+ 버튼)만 쓴다. 네이티브 모듈이 iOS에만 있어서 다른 곳에서는 null이다
export const PLACE_PHOTOS_SUPPORTED = PhotoLocationScan != null;

// 한 화면에 보여줄 최대 장수. 썸네일마다 원본 파일을 열기 때문에 너무 많으면 느려진다
const MAX_PLACE_PHOTOS = 30;

export type PlacePhotosStatus = 'unsupported' | 'loading' | 'undetermined' | 'denied' | 'granted';

// 리뷰를 남길 수 있는 학교 주변 가게 (대동명지도) 전체 좌표. 지도 핀과 장소 상세가 같은 목록으로 "어느 가게 사진인지"를 가른다
const REVIEWABLE_CATEGORY_CODE = 'daedong';
const REVIEWABLE_PLACES_QUERY_KEY = ['category-markers', REVIEWABLE_CATEGORY_CODE] as const;

export function fetchReviewablePlaces(queryClient: QueryClient) {
  return queryClient.fetchQuery({
    queryKey: REVIEWABLE_PLACES_QUERY_KEY,
    queryFn: async () => {
      const markers = await getCategoryMarkers(REVIEWABLE_CATEGORY_CODE);
      // 건물 안 시설을 건물 하나로 묶은 마커는 가게가 아니라서 뺀다
      return markers.filter((marker) => marker.type === 'PLACE' && !marker.grouped);
    },
    staleTime: Infinity,
  });
}

// 사진 권한 상태. 장소 상세·리뷰 작성·지도 핀이 같은 값을 보도록 react-query 캐시에 둔다
// (한 화면에서 권한을 허용하면 같은 화면의 다른 곳도 바로 사진을 찾기 시작한다)
const PHOTO_PERMISSION_QUERY_KEY = ['photo-permission'] as const;

export function usePhotoPermission() {
  const queryClient = useQueryClient();
  const { data: permission, refetch } = useQuery({
    queryKey: PHOTO_PERMISSION_QUERY_KEY,
    queryFn: () => MediaLibrary.getPermissionsAsync(false, ['photo']),
    enabled: PLACE_PHOTOS_SUPPORTED,
    staleTime: Infinity,
  });

  // 설정 앱에서 권한을 바꾸고 돌아오면 다시 확인한다
  React.useEffect(() => {
    if (!PLACE_PHOTOS_SUPPORTED) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refetch();
    });
    return () => subscription.remove();
  }, [refetch]);

  const requestPermission = React.useCallback(async () => {
    const response = await MediaLibrary.requestPermissionsAsync(false, ['photo']);
    queryClient.setQueryData(PHOTO_PERMISSION_QUERY_KEY, response);
    return response;
  }, [queryClient]);

  const granted = PLACE_PHOTOS_SUPPORTED && (permission?.granted ?? false);
  const status: PlacePhotosStatus = !PLACE_PHOTOS_SUPPORTED
    ? 'unsupported'
    : !permission
      ? 'loading'
      : granted
        ? 'granted'
        : permission.canAskAgain
          ? 'undetermined'
          : 'denied';

  return {
    status,
    granted,
    accessPrivileges: permission?.accessPrivileges,
    isLimited: permission?.accessPrivileges === 'limited',
    requestPermission,
  };
}

// 내 사진첩에서 이 장소 반경 안에서 찍은 사진을 방문일별로 찾는다. 리뷰 작성 화면과 장소 상세가 같은 결과(캐시)를 쓴다
export function usePlacePhotos(placeId: number, place: GeoPoint | null) {
  const queryClient = useQueryClient();
  const {
    status: permissionStatus,
    granted,
    accessPrivileges,
    isLimited,
    requestPermission,
  } = usePhotoPermission();

  const query = useQuery({
    queryKey: ['place-photos', placeId, place?.latitude, place?.longitude, accessPrivileges],
    queryFn: () => findPlacePhotos(placeId, place as GeoPoint, queryClient),
    enabled: granted && place != null,
    staleTime: Infinity,
  });
  const { refetch } = query;

  // 사진을 새로 찍거나 "사진 더 선택하기"로 허용 범위가 바뀌면 다시 찾는다
  React.useEffect(() => {
    if (!granted) return;
    const subscription = MediaLibrary.addListener(() => void refetch());
    return () => subscription.remove();
  }, [granted, refetch]);

  const status: PlacePhotosStatus = place ? permissionStatus : 'unsupported';
  const photoCount = query.data?.reduce((sum, visit) => sum + visit.photos.length, 0) ?? 0;

  return {
    status,
    isLimited,
    requestPermission,
    visits: query.data,
    photoCount,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch,
  };
}

// 사진첩 전체(기간·장수 제한 없음)에서 장소를 감싼 상자 안 사진만 네이티브로 받고, 정확한 반경은 여기서 다시 거른다
async function findPlacePhotos(placeId: number, place: GeoPoint, queryClient: QueryClient) {
  const bounds = boundsAround(place, DEFAULT_PLACE_RADIUS_METERS);
  const scanned = await PhotoLocationScan!.findPhotosInBounds(
    bounds.minLatitude,
    bounds.maxLatitude,
    bounds.minLongitude,
    bounds.maxLongitude
  );
  const located: PlacePhoto[] = scanned.map((photo) => ({
    id: photo.id,
    takenAt: photo.takenAt,
    location: { latitude: photo.latitude, longitude: photo.longitude },
    width: photo.width,
    height: photo.height,
  }));
  // 붙어 있는 옆 가게에서 찍은 사진은 뺀다 (가게 목록을 못 받으면 반경만 본다)
  const nearbyPlaces = await fetchReviewablePlaces(queryClient).catch(() => []);
  const photos = filterPhotosForPlace(located, { id: placeId, ...place }, nearbyPlaces);
  return limitPhotos(groupPhotosNearPlace(photos, place), MAX_PLACE_PHOTOS);
}

// 최근 방문부터 채워서 전체 장수를 limit 안으로 자른다
function limitPhotos<T extends { photos: unknown[] }>(visits: T[], limit: number) {
  const result: T[] = [];
  let left = limit;
  for (const visit of visits) {
    if (left <= 0) break;
    result.push({ ...visit, photos: visit.photos.slice(0, left) });
    left -= visit.photos.length;
  }
  return result;
}

// RN Image는 ph:// 주소를 못 그려서 파일 경로를 받아 쓴다. 보여주는 사진에만 부르므로 몇 장 안 된다
export function getLibraryPhotoUri(id: string) {
  return MediaLibrary.getAssetInfoAsync(id, { shouldDownloadFromNetwork: true }).then(
    (info) => info.localUri ?? null
  );
}

export function useLibraryPhotoUri(id: string) {
  return useQuery({
    queryKey: ['library-photo-uri', id],
    queryFn: () => getLibraryPhotoUri(id),
    staleTime: Infinity,
  }).data;
}
