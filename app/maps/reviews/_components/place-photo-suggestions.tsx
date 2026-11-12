import { uploadImage } from '@/api/upload';
import { LocationIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { showAlert } from '@/lib/alert';
import { compressImageToJpeg } from '@/lib/compress-image';
import type { PlaceReviewMediaItem } from '@/lib/maps/place-reviews';
import { type GeoPoint, groupPhotosNearPlace, type LocatedPhoto } from '@/lib/photo-location';
import { cn } from '@/lib/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as MediaLibrary from 'expo-media-library';
import * as React from 'react';
import {
  ActivityIndicator,
  AppState,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

// 최근 1년, 최대 400장만 본다. 사진이 수만 장인 폰에서도 몇 초 안에 끝나게 하려는 상한
const SCAN_WINDOW_MS = 365 * 24 * 60 * 60 * 1000;
const SCAN_PAGE_SIZE = 100;
const SCAN_MAX_PHOTOS = 400;
const LOCATION_READ_CONCURRENCY = 16;
// 추천 줄에 보여줄 최대 장수. 썸네일마다 원본 파일을 열기 때문에 너무 많으면 느려진다
const MAX_SUGGESTED_PHOTOS = 30;

// 사진 위치는 바뀌지 않으므로 앱이 켜져 있는 동안 기억해 두고 다시 읽지 않는다 (사진 id -> 위치, 위치 없음은 null)
const locationCache = new Map<string, GeoPoint | null>();

type SuggestedPhoto = LocatedPhoto & { width: number; height: number };

type Props = {
  placeId: number;
  placeName: string;
  place: GeoPoint;
  mediaItems: PlaceReviewMediaItem[];
  maxCount: number;
  onAdd: (item: PlaceReviewMediaItem) => void;
  onRemove: (id: string) => void;
  // 업로드 중에 리뷰를 등록하면 사진이 빠지므로 부모가 등록 버튼을 막을 수 있게 알린다
  onUploadingChange: (uploading: boolean) => void;
};

// iOS 전용. 안드로이드는 Google Play 사진 권한 정책 때문에 사진첩 전체를 읽지 않고 + 버튼(시스템 선택기)만 쓴다
export default function PlacePhotoSuggestions(props: Props) {
  if (Platform.OS !== 'ios') return null;
  return <PlacePhotoSuggestionsIos {...props} />;
}

function PlacePhotoSuggestionsIos({
  placeId,
  placeName,
  place,
  mediaItems,
  maxCount,
  onAdd,
  onRemove,
  onUploadingChange,
}: Props) {
  const [permission, requestPermission, getPermission] = MediaLibrary.usePermissions({
    granularPermissions: ['photo'],
  });
  const granted = permission?.granted ?? false;

  // 설정 앱에서 권한을 바꾸고 돌아오면 다시 확인한다
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void getPermission();
    });
    return () => subscription.remove();
  }, [getPermission]);

  const {
    data: visits,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['place-photo-suggestions', placeId, permission?.accessPrivileges],
    queryFn: () => findPhotosNearPlace(place),
    enabled: granted,
    staleTime: Infinity,
  });

  // 사진을 새로 찍거나 "사진 더 선택하기"로 허용 범위가 바뀌면 다시 찾는다
  React.useEffect(() => {
    if (!granted) return;
    const subscription = MediaLibrary.addListener(() => void refetch());
    return () => subscription.remove();
  }, [granted, refetch]);

  // 추천 사진 id -> 올린 미디어 항목 id. 위쪽 목록에서 X로 지워도 선택 표시가 같이 풀리도록 mediaItems로 확인한다
  const [pickedIds, setPickedIds] = React.useState<Record<string, string>>({});
  const upload = useMutation({
    mutationFn: uploadLibraryPhoto,
    onSuccess: (url, photo) => {
      const id = `${Date.now()}-${photo.id}`;
      setPickedIds((previous) => ({ ...previous, [photo.id]: id }));
      onAdd({ id, url, type: 'image' });
    },
    onError: (error) =>
      showAlert(
        '사진을 올리지 못했어요',
        error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.'
      ),
  });

  React.useEffect(() => {
    onUploadingChange(upload.isPending);
  }, [upload.isPending, onUploadingChange]);

  function togglePhoto(photo: SuggestedPhoto) {
    const mediaId = pickedIds[photo.id];
    if (mediaId && mediaItems.some((item) => item.id === mediaId)) {
      onRemove(mediaId);
      return;
    }
    if (upload.isPending) return;
    if (mediaItems.length >= maxCount) {
      showAlert(`사진은 최대 ${maxCount}개까지 올릴 수 있어요`);
      return;
    }
    upload.mutate(photo);
  }

  if (!permission) return null;

  if (!granted && permission.canAskAgain) {
    return <PermissionInvite placeName={placeName} onAllow={() => void requestPermission()} />;
  }

  if (!granted) {
    return (
      <View className="mx-4 flex-row flex-wrap items-center gap-x-1">
        <Text className="text-grey-60 text-caption02">
          사진 접근이 꺼져 있어 이 장소 사진을 못 찾았어요.
        </Text>
        <Pressable onPress={() => void Linking.openSettings()} hitSlop={8}>
          <Text className="text-mju-primary underline text-caption01">설정에서 켜기</Text>
        </Pressable>
      </View>
    );
  }

  const photoCount = visits?.reduce((sum, visit) => sum + visit.photos.length, 0) ?? 0;
  const isLimited = permission.accessPrivileges === 'limited';

  return (
    <View style={{ gap: 14 }}>
      <View className="flex-row items-center px-4">
        <View className="flex-1 flex-row items-center gap-1">
          <LocationIcon size={16} className="text-mju-primary" />
          <Text className="text-black text-body04">여기서 찍은 사진</Text>
          {photoCount > 0 && <Text className="text-mju-primary text-body04">{photoCount}</Text>}
        </View>
        {isLimited ? (
          <Pressable
            onPress={() => void MediaLibrary.presentPermissionsPickerAsync(['photo'])}
            hitSlop={8}
          >
            <Text className="text-grey-60 underline text-caption02">사진 더 선택하기</Text>
          </Pressable>
        ) : (
          photoCount > 0 && <Text className="text-grey-40 text-caption02">탭해서 추가</Text>
        )}
      </View>

      {isFetching && !visits ? (
        <View className="mx-4 flex-row items-center gap-2 rounded-xl bg-grey-02 px-4 py-4">
          <ActivityIndicator size="small" />
          <Text className="text-grey-60 text-caption02">
            사진첩에서 {placeName} 사진을 찾고 있어요
          </Text>
        </View>
      ) : isError ? (
        <View className="mx-4 flex-row items-center rounded-xl bg-grey-02 px-4 py-4">
          <Text className="flex-1 text-grey-60 text-caption02">사진첩을 읽지 못했어요.</Text>
          <Pressable onPress={() => void refetch()} hitSlop={8}>
            <Text className="text-mju-primary underline text-caption01">다시 시도</Text>
          </Pressable>
        </View>
      ) : photoCount === 0 ? (
        <View className="mx-4 rounded-xl bg-grey-02 px-4 py-4" style={{ gap: 2 }}>
          <Text className="text-grey-80 text-caption01">이 장소에서 찍은 사진이 없어요</Text>
          <Text className="text-grey-40 text-caption02">
            {'실내 사진은 위치가 안 잡힐 수 있어요.\n위의 + 버튼으로 골라주세요.'}
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 24, paddingHorizontal: 16 }}
        >
          {visits?.map((visit) => (
            <View key={visit.day} style={{ gap: 8 }}>
              <Text className="text-grey-60 text-caption01">{formatVisitDay(visit.day)}</Text>
              <View className="flex-row" style={{ gap: 8 }}>
                {visit.photos.map((photo) => {
                  const mediaId = pickedIds[photo.id];
                  const order = mediaId
                    ? mediaItems.findIndex((item) => item.id === mediaId) + 1
                    : 0;
                  return (
                    <SuggestedPhotoTile
                      key={photo.id}
                      photo={photo}
                      order={order}
                      uploading={upload.isPending && upload.variables?.id === photo.id}
                      onPress={() => togglePhoto(photo)}
                    />
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function PermissionInvite({ placeName, onAllow }: { placeName: string; onAllow: () => void }) {
  return (
    <View className="mx-4 flex-row rounded-2xl bg-blue-02 px-4 py-4" style={{ gap: 12 }}>
      <View className="h-9 w-9 items-center justify-center rounded-full bg-white">
        <LocationIcon size={18} className="text-mju-primary" />
      </View>
      <View className="flex-1" style={{ gap: 10 }}>
        <View style={{ gap: 2 }}>
          <Text className="text-black text-body04">여기서 찍은 사진, 바로 찾아드릴까요?</Text>
          <Text className="text-grey-60 text-caption02">
            {`사진 위치로 ${placeName} 사진만 골라드려요.\n위치 정보는 폰 밖으로 나가지 않아요.`}
          </Text>
        </View>
        <Pressable
          onPress={onAllow}
          className="self-start rounded-full bg-mju-primary px-4 py-2"
          accessibilityRole="button"
        >
          <Text className="text-white text-caption01">사진 찾아보기</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SuggestedPhotoTile({
  photo,
  order,
  uploading,
  onPress,
}: {
  photo: SuggestedPhoto;
  order: number;
  uploading: boolean;
  onPress: () => void;
}) {
  const { data: thumbnailUri } = useQuery({
    queryKey: ['library-photo-uri', photo.id],
    queryFn: () => getLocalUri(photo.id),
    staleTime: Infinity,
  });
  const selected = order > 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={selected ? `선택된 사진 ${order}번` : '사진 선택'}
      className={cn(
        'h-24 w-24 overflow-hidden rounded-xl bg-grey-10',
        selected && 'border-2 border-mju-primary'
      )}
    >
      {thumbnailUri && (
        <Image source={{ uri: thumbnailUri }} className="h-full w-full" resizeMode="cover" />
      )}
      <View
        className={cn(
          'absolute right-1.5 top-1.5 h-[22px] w-[22px] items-center justify-center rounded-full border-[1.5px] border-white',
          selected ? 'bg-mju-primary' : 'bg-black/25'
        )}
      >
        {selected && <Text className="text-white text-caption01">{order}</Text>}
      </View>
      {uploading && (
        <View className="absolute inset-0 items-center justify-center bg-white/60">
          <ActivityIndicator size="small" />
        </View>
      )}
    </Pressable>
  );
}

async function findPhotosNearPlace(place: GeoPoint) {
  const photos: SuggestedPhoto[] = [];
  let after: string | undefined;
  for (let scanned = 0; scanned < SCAN_MAX_PHOTOS; scanned += SCAN_PAGE_SIZE) {
    const page = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.photo,
      sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      createdAfter: Date.now() - SCAN_WINDOW_MS,
      first: SCAN_PAGE_SIZE,
      after,
    });
    for (let i = 0; i < page.assets.length; i += LOCATION_READ_CONCURRENCY) {
      const chunk = page.assets.slice(i, i + LOCATION_READ_CONCURRENCY);
      const locations = await Promise.all(chunk.map((asset) => readLocation(asset.id, asset.uri)));
      chunk.forEach((asset, index) => {
        const location = locations[index];
        if (location) {
          photos.push({
            id: asset.id,
            takenAt: asset.creationTime,
            location,
            width: asset.width,
            height: asset.height,
          });
        }
      });
    }
    if (!page.hasNextPage) break;
    after = page.endCursor;
  }
  return limitPhotos(groupPhotosNearPlace(photos, place), MAX_SUGGESTED_PHOTOS);
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

// 위치만 필요해서 사진 원본을 열지 않는 next API를 쓴다 (기존 getAssetInfoAsync는 원본 파일과 EXIF까지 읽어 느림)
// next API의 Asset은 id가 아니라 'ph://<id>' 형태(기존 API의 asset.uri)를 받는다
async function readLocation(id: string, uri: string) {
  const cached = locationCache.get(id);
  if (cached !== undefined) return cached;
  // next 모듈은 불러오는 순간 네이티브 모듈을 찾아서 웹 빌드에서 터지므로 iOS에서 쓸 때만 불러온다
  const { Asset } = await import('expo-media-library/next');
  const location = await new Asset(uri).getLocation().catch(() => null);
  const point = location ? { latitude: location.latitude, longitude: location.longitude } : null;
  locationCache.set(id, point);
  return point;
}

// RN Image는 ph:// 주소를 못 그려서 파일 경로를 받아 쓴다. 추천된 사진에만 부르므로 몇 장 안 된다
async function getLocalUri(id: string) {
  const info = await MediaLibrary.getAssetInfoAsync(id, { shouldDownloadFromNetwork: true });
  return info.localUri ?? null;
}

// 압축(다시 인코딩) 과정에서 원본 EXIF가 빠져 사진 위치가 서버로 올라가지 않는다
async function uploadLibraryPhoto(photo: SuggestedPhoto) {
  const uri = await getLocalUri(photo.id);
  if (!uri)
    throw new Error('사진 원본을 불러오지 못했어요. iCloud 사진이면 잠시 후 다시 시도해주세요.');
  const compressed = await compressImageToJpeg(uri, { width: photo.width, height: photo.height });
  return uploadImage(compressed.uri, 'REVIEW_MEDIA');
}

function formatVisitDay(day: string) {
  const [year, month, date] = day.split('-').map(Number);
  const prefix = year === new Date().getFullYear() ? '' : `${year}년 `;
  return `${prefix}${month}월 ${date}일 방문`;
}
