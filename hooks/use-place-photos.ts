import { getCategoryMarkers } from '@/api/maps';
import {
  assignPhotosToUploadedPlaces,
  boundsAround,
  DEFAULT_PLACE_RADIUS_METERS,
  filterPhotosForPlace,
  type GeoPoint,
  groupPhotosNearPlace,
  type LocatedPhoto,
} from '@/lib/photo-location';
import { getDismissedPlacePhotos } from '@/lib/maps/dismissed-place-photos';
import {
  addMatchedReviewPhotos,
  getCheckedReviewImageUrls,
  getUploadedPhotoPlaces,
  markReviewImagesChecked,
} from '@/lib/maps/uploaded-review-photos';
import { getPlaceReviews } from '@/lib/maps/place-reviews';
import { isFoodPhoto } from '@/lib/photo-food';
import { getPhotoLabels } from '@/lib/photo-labels';
import PhotoLocationScan from '@/modules/photo-location-scan';
import { type QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import * as MediaLibrary from 'expo-media-library';
import * as React from 'react';
import { AppState } from 'react-native';

export type PlacePhoto = LocatedPhoto & { width: number; height: number };

// 장소별 내 사진 쿼리의 앞부분 (사진을 숨기면 다녀온 곳 핀과 같이 다시 찾는다)
export const PLACE_PHOTOS_QUERY_KEY = ['place-photos'] as const;

// iOS 앱에서만 사진첩을 훑는다. 웹은 사진첩에 접근할 수 없고, 안드로이드는 Google Play 사진 권한 정책 때문에
// 시스템 선택기(+ 버튼)만 쓴다. 네이티브 모듈이 iOS에만 있어서 다른 곳에서는 null이다
export const PLACE_PHOTOS_SUPPORTED = PhotoLocationScan != null;

// 한 화면에 보여줄 최대 장수. 썸네일마다 원본 파일을 열기 때문에 너무 많으면 느려진다
const MAX_PLACE_PHOTOS = 30;
// 음식 사진인지 분류해 볼 최대 장수 (최근 사진부터). 처음 한 번만 분류하고 결과는 기기에 기억한다
const MAX_CLASSIFIED_PLACE_PHOTOS = 60;

export type PlacePhotosStatus = 'unsupported' | 'loading' | 'undetermined' | 'denied' | 'granted';

// 리뷰를 남길 수 있는 학교 주변 가게 (대동명지도) 전체 좌표. 지도 핀과 장소 상세가 같은 목록으로 "어느 가게 사진인지"를 가른다
const REVIEWABLE_CATEGORY_CODE = 'daedong';
const REVIEWABLE_PLACES_QUERY_KEY = ['category-markers', REVIEWABLE_CATEGORY_CODE] as const;

const reviewablePlacesQuery = {
  queryKey: REVIEWABLE_PLACES_QUERY_KEY,
  queryFn: async () => {
    const markers = await getCategoryMarkers(REVIEWABLE_CATEGORY_CODE);
    // 건물 안 시설을 건물 하나로 묶은 마커는 가게가 아니라서 뺀다
    return markers.filter((marker) => marker.type === 'PLACE' && !marker.grouped);
  },
  staleTime: Infinity,
};

export function fetchReviewablePlaces(queryClient: QueryClient) {
  return queryClient.fetchQuery(reviewablePlacesQuery);
}

// 같은 목록을 화면에서 쓸 때 (다녀온 곳 시트의 "목록에 없어요" 가게 이름 찾기)
export function useReviewablePlaces() {
  return useQuery(reviewablePlacesQuery).data ?? [];
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
    queryKey: [
      ...PLACE_PHOTOS_QUERY_KEY,
      placeId,
      place?.latitude,
      place?.longitude,
      accessPrivileges,
    ],
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
  const photosByLocation = filterPhotosForPlace(located, { id: placeId, ...place }, nearbyPlaces);
  // 사용자가 X로 숨긴 사진(다른 가게, 지금은 없어진 예전 가게)은 뺀다
  const dismissedIds = (await getDismissedPlacePhotos())[String(placeId)] ?? [];
  // 예전 리뷰 사진을 사진첩과 비교해 둔다. 비교하지 못하면(리뷰 조회 실패 등) 그대로 보여주고 다음에 다시 비교한다
  await matchUploadedReviewPhotos(
    placeId,
    photosByLocation
      .filter((photo) => !dismissedIds.includes(photo.id))
      .slice(0, MAX_CLASSIFIED_PLACE_PHOTOS)
      .map((photo) => photo.id)
  ).catch(() => undefined);
  // 리뷰에 올린 사진과 같은 방문에 찍은 사진은 그 리뷰의 가게 사진으로 본다. 그래서 이 가게에 올린 사진과 같이 찍었으면
  // 위치가 옆 가게에 더 가까워도 넣고, 다른 가게에 올린 사진과 같이 찍었으면 위치가 이 가게여도 뺀다
  const uploadedPlaces = await getUploadedPhotoPlaces();
  const assignedPlaces = assignPhotosToUploadedPlaces(
    located,
    located
      .filter((photo) => uploadedPlaces.has(photo.id))
      .map((photo) => ({ ...photo, placeId: uploadedPlaces.get(photo.id)! }))
  );
  // 가게 근처에서 찍었어도 음식·음료 사진만 보여준다 (셀카·풍경 같은 관련 없는 사진이 섞이지 않게)
  // 리뷰에 이미 올린 내 사진도 뺀다 (리뷰를 고쳐 사진을 빼거나 리뷰를 지우면 다시 나온다)
  const recent = located
    .filter(
      (photo) =>
        (assignedPlaces.get(photo.id) ?? (photosByLocation.includes(photo) ? placeId : null)) ===
          placeId &&
        !dismissedIds.includes(photo.id) &&
        !uploadedPlaces.has(photo.id)
    )
    .slice(0, MAX_CLASSIFIED_PLACE_PHOTOS);
  const labels = await getPhotoLabels(recent.map((photo) => photo.id));
  const foodPhotos = recent.filter((photo) => isFoodPhoto(labels[photo.id] ?? []));
  return limitPhotos(groupPhotosNearPlace(foodPhotos, place), MAX_PLACE_PHOTOS);
}

// 리뷰를 쓸 때 고른 사진은 쓰기 화면이 바로 기억하지만(app/maps/reviews/write.tsx), 다른 기기에서 썼거나
// 기억하기 전에 올린 리뷰 사진은 모른다. 그래서 이 장소의 내 리뷰 이미지를 사진첩 사진과 기기 안에서 그림으로 비교해 찾고,
// 찾은 사진을 그 리뷰에 올린 사진으로 기억한다. 비교한 이미지 주소도 기억해 다음부터는 새로 올라온 이미지만 비교한다.
// 다녀온 곳 핀(hooks/use-visited-places.ts)도 이 기기에서 리뷰를 쓴 가게에 대해 같은 비교를 한다
export async function matchUploadedReviewPhotos(placeId: number, photoIds: string[]) {
  if (!PhotoLocationScan?.findPhotosMatchingImages || !photoIds.length) return;
  const [reviews, checkedUrls] = await Promise.all([
    getPlaceReviews(placeId),
    getCheckedReviewImageUrls(),
  ]);
  const myReviews = reviews.filter((review) => review.isMine);
  const imageUrls = myReviews
    .flatMap((review) => review.imageUrls)
    .filter((url) => !checkedUrls.includes(url));
  if (!imageUrls.length) return;
  const matchedIdByUrl = await PhotoLocationScan.findPhotosMatchingImages(photoIds, imageUrls);
  for (const review of myReviews) {
    await addMatchedReviewPhotos(
      review.id,
      placeId,
      review.imageUrls
        .filter((url) => matchedIdByUrl[url])
        .map((url) => ({ photoId: matchedIdByUrl[url], url }))
    );
  }
  await markReviewImagesChecked(imageUrls);
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
