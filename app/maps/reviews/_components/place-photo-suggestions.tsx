import { uploadImage } from '@/api/upload';
import { formatPhotoDay } from '@/lib/maps/format';
import { LocationIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { showAlert } from '@/lib/alert';
import { compressImageToJpeg } from '@/lib/compress-image';
import type { PlaceReviewMediaItem } from '@/lib/maps/place-reviews';
import {
  getLibraryPhotoUri,
  type PlacePhoto,
  useLibraryPhotoUri,
  usePlacePhotos,
} from '@/hooks/use-place-photos';
import type { GeoPoint } from '@/lib/photo-location';
import { cn } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import * as MediaLibrary from 'expo-media-library';
import * as React from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

type Props = {
  placeId: number;
  placeName: string;
  place: GeoPoint;
  mediaItems: PlaceReviewMediaItem[];
  maxCount: number;
  // 장소 상세에서 미리 골라 온 사진 (사진첩 id). 화면이 열리면 자동으로 올린다
  initialPhotoIds?: string[];
  onAdd: (item: PlaceReviewMediaItem) => void;
  onRemove: (id: string) => void;
  // 업로드 중에 리뷰를 등록하면 사진이 빠지므로 부모가 등록 버튼을 막을 수 있게 알린다
  onUploadingChange: (uploading: boolean) => void;
};

// iOS 전용. 안드로이드는 Google Play 사진 권한 정책 때문에 사진첩 전체를 읽지 않고 + 버튼(시스템 선택기)만 쓴다
export default function PlacePhotoSuggestions(props: Props) {
  if (Platform.OS !== 'ios') return null;
  // 여백도 iOS에서만 생기도록 여기서 준다 (웹·안드로이드에서 빈 간격이 남지 않게)
  return (
    <View className="mt-7">
      <PlacePhotoSuggestionsIos {...props} />
    </View>
  );
}

function PlacePhotoSuggestionsIos({
  placeId,
  placeName,
  place,
  mediaItems,
  maxCount,
  initialPhotoIds,
  onAdd,
  onRemove,
  onUploadingChange,
}: Props) {
  const { status, isLimited, requestPermission, visits, photoCount, isFetching, isError, refetch } =
    usePlacePhotos(placeId, place);

  // 추천 사진 id -> 올린 미디어 항목 id. 위쪽 목록에서 X로 지워도 선택 표시가 같이 풀리도록 mediaItems로 확인한다
  const [pickedIds, setPickedIds] = React.useState<Record<string, string>>({});
  const upload = useMutation({
    mutationFn: uploadLibraryPhoto,
    onSuccess: (url, photo) => {
      const id = `${Date.now()}-${photo.id}`;
      setPickedIds((previous) => ({ ...previous, [photo.id]: id }));
      onAdd({ id, url, type: 'image', libraryPhotoId: photo.id });
    },
    onError: (error) =>
      showAlert(
        '사진을 올리지 못했어요',
        error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.'
      ),
  });
  const [isAutoUploading, setIsAutoUploading] = React.useState(false);

  React.useEffect(() => {
    onUploadingChange(upload.isPending || isAutoUploading);
  }, [upload.isPending, isAutoUploading, onUploadingChange]);

  // 장소 상세나 지도 사진 시트에서 고른 사진으로 들어오면 그 사진을 순서대로 한 번만 올린다.
  // 지도 시트에서 이름으로 찾은 먼 가게를 고르면 사진이 이 가게 근처 사진(visits)에 없어서, 그때는 사진첩에서 바로 읽어 올린다
  const autoUploadStartedRef = React.useRef(false);
  React.useEffect(() => {
    if (autoUploadStartedRef.current || !visits || !initialPhotoIds?.length) return;
    autoUploadStartedRef.current = true;
    const photos = visits.flatMap((visit) => visit.photos);
    setIsAutoUploading(true);
    void (async () => {
      const targets = await Promise.all(
        initialPhotoIds
          .slice(0, maxCount)
          .map((id) => photos.find((photo) => photo.id === id) ?? readLibraryPhoto(id))
      );
      for (const photo of targets) {
        if (photo) await upload.mutateAsync(photo).catch(() => undefined);
      }
      setIsAutoUploading(false);
    })();
  }, [visits, initialPhotoIds, maxCount, upload]);

  function togglePhoto(photo: PlacePhoto) {
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

  if (status === 'unsupported' || status === 'loading') return null;

  if (status === 'undetermined') {
    return <PermissionInvite placeName={placeName} onAllow={() => void requestPermission()} />;
  }

  if (status === 'denied') {
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
              <Text className="text-grey-60 text-caption01">{formatPhotoDay(visit.day)}</Text>
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
  photo: PlacePhoto;
  order: number;
  uploading: boolean;
  onPress: () => void;
}) {
  const thumbnailUri = useLibraryPhotoUri(photo.id);
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

// 근처 사진 목록에 없는 사진첩 사진을 id로 읽는다 (올릴 때 크기가 필요하다). 지워졌거나 못 읽으면 null
async function readLibraryPhoto(id: string): Promise<PlacePhoto | null> {
  const info = await MediaLibrary.getAssetInfoAsync(id).catch(() => null);
  if (!info) return null;
  return {
    id,
    takenAt: info.creationTime,
    location: {
      latitude: info.location?.latitude ?? 0,
      longitude: info.location?.longitude ?? 0,
    },
    width: info.width,
    height: info.height,
  };
}

// 압축(다시 인코딩) 과정에서 원본 EXIF가 빠져 사진 위치가 서버로 올라가지 않는다
async function uploadLibraryPhoto(photo: PlacePhoto) {
  const uri = await getLibraryPhotoUri(photo.id);
  if (!uri)
    throw new Error('사진 원본을 불러오지 못했어요. iCloud 사진이면 잠시 후 다시 시도해주세요.');
  const compressed = await compressImageToJpeg(uri, { width: photo.width, height: photo.height });
  return uploadImage(compressed.uri, 'REVIEW_MEDIA');
}
