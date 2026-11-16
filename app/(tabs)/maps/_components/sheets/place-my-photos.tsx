import { LocationIcon } from '@/components/icons';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { type PlacePhoto, useLibraryPhotoUri } from '@/hooks/use-place-photos';
import type { PhotoVisit } from '@/lib/photo-location';
import { cn } from '@/lib/utils';
import { Check, ChevronRight, ImagePlus, Lock, PencilLine, Plus } from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, View } from 'react-native';
import { NativeViewGestureHandler } from 'react-native-gesture-handler';

// 리뷰 작성 화면의 최대 첨부 수와 같다
const MAX_PICK_COUNT = 10;

// 장소에 사진이 하나도 없고, 내 사진첩에 여기서 찍은 사진이 있을 때 (iOS)
// 가장 최근 방문 사진을 미리 골라두고, 누르면 그 사진이 올라간 상태로 리뷰 작성 화면을 연다
export function MyPlacePhotosCard({
  visits,
  photoCount,
  onWriteReview,
}: {
  visits: PhotoVisit<PlacePhoto>[];
  photoCount: number;
  onWriteReview: (photoIds: string[]) => void;
}) {
  const photos = React.useMemo(() => visits.flatMap((visit) => visit.photos), [visits]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>(() =>
    (visits[0]?.photos ?? []).slice(0, MAX_PICK_COUNT).map((photo) => photo.id)
  );

  function togglePhoto(id: string) {
    setSelectedIds((previous) => {
      if (previous.includes(id)) return previous.filter((selectedId) => selectedId !== id);
      if (previous.length >= MAX_PICK_COUNT) return previous;
      return [...previous, id];
    });
  }

  // 화면에 보이는 순서대로 넘긴다
  const orderedSelectedIds = photos
    .map((photo) => photo.id)
    .filter((id) => selectedIds.includes(id));

  return (
    <View className="mx-4 mt-4 rounded-2xl bg-blue-02 py-4" style={{ gap: 14 }}>
      <View className="flex-row items-center px-4">
        <View className="flex-1 flex-row items-center gap-1">
          <LocationIcon size={16} className="text-mju-primary" />
          <Text className="text-black text-body04">여기서 찍은 내 사진 {photoCount}장</Text>
        </View>
        <View className="flex-row items-center gap-0.5">
          <Icon as={Lock} size={12} className="text-grey-40" />
          <Text className="text-grey-40 text-caption02">나만 보여요</Text>
        </View>
      </View>

      <NativeViewGestureHandler disallowInterruption>
        <ScrollView
          horizontal
          nestedScrollEnabled
          directionalLockEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
        >
          {photos.map((photo) => (
            <MyPhotoTile
              key={photo.id}
              id={photo.id}
              selected={selectedIds.includes(photo.id)}
              onPress={() => togglePhoto(photo.id)}
            />
          ))}
        </ScrollView>
      </NativeViewGestureHandler>

      <View className="px-4">
        <Pressable
          onPress={() => onWriteReview(orderedSelectedIds)}
          accessibilityRole="button"
          className="h-12 flex-row items-center justify-center gap-1.5 rounded-xl bg-mju-primary"
        >
          <Icon as={PencilLine} size={16} className="text-white" />
          <Text className="text-white text-body04">
            {orderedSelectedIds.length > 0
              ? `사진 ${orderedSelectedIds.length}장으로 리뷰 쓰기`
              : '리뷰 쓰기'}
          </Text>
        </Pressable>
        <Text className="mt-2 text-center text-grey-40 text-caption02">
          사진 위치로 찾았어요. 리뷰에 올린 사진만 다른 사람에게 보여요.
        </Text>
      </View>
    </View>
  );
}

function MyPhotoTile({
  id,
  selected,
  onPress,
}: {
  id: string;
  selected: boolean;
  onPress: () => void;
}) {
  const uri = useLibraryPhotoUri(id);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel="내 사진"
      className="h-24 w-24 overflow-hidden rounded-xl bg-grey-10"
    >
      {uri && <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />}
      <View
        className={cn(
          'absolute right-1.5 top-1.5 h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-white',
          selected ? 'bg-mju-primary' : 'bg-black/25'
        )}
      >
        {selected && <Icon as={Check} size={12} className="text-white" strokeWidth={3} />}
      </View>
    </Pressable>
  );
}

// 장소에 사진이 하나도 없을 때. 회색 빈 칸 대신 첫 사진을 올리도록 안내한다
// onFindMine: iOS에서 아직 사진 권한을 묻지 않았을 때만 넘긴다 (상세를 열자마자 권한 팝업을 띄우지 않으려고 링크로 둔다)
export function EmptyPlaceMedia({
  searching,
  onAddPhoto,
  onFindMine,
}: {
  searching: boolean;
  onAddPhoto: () => void;
  onFindMine?: () => void;
}) {
  return (
    <View className="mx-4 mt-4">
      <View className="items-center rounded-2xl bg-grey-02 px-5 pb-6 pt-7">
        <View className="h-[52px] w-[52px] items-center justify-center rounded-full bg-white">
          <Icon as={ImagePlus} size={24} className="text-mju-primary" />
        </View>
        <Text className="mt-3.5 text-grey-80 text-body04">아직 등록된 사진이 없어요</Text>
        <Text className="mt-1 text-grey-40 text-caption02">
          메뉴, 음식, 가게 분위기 무엇이든 좋아요
        </Text>
        <Pressable
          onPress={onAddPhoto}
          accessibilityRole="button"
          className="mt-4 flex-row items-center gap-1 rounded-full bg-mju-primary px-[18px] py-2.5"
        >
          <Icon as={Plus} size={16} className="text-white" />
          <Text className="text-white text-body05">첫 사진 올리고 리뷰 쓰기</Text>
        </Pressable>
      </View>
      {searching ? (
        <View className="mt-3 flex-row items-center justify-center gap-1.5">
          <ActivityIndicator size="small" />
          <Text className="text-grey-60 text-caption02">
            내 사진첩에서 여기서 찍은 사진을 찾는 중
          </Text>
        </View>
      ) : onFindMine ? (
        <Pressable
          onPress={onFindMine}
          hitSlop={8}
          className="mt-3 flex-row items-center justify-center gap-1"
        >
          <LocationIcon size={14} className="text-grey-60" />
          <Text className="text-grey-60 underline text-caption01">
            내 사진첩에서 여기서 찍은 사진 찾기
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// 장소에 다른 사람 사진이 있고, 내 사진첩에도 여기서 찍은 사진이 있을 때 사진 줄 아래에 한 줄로 보여준다
export function MyPlacePhotosNudge({
  photos,
  photoCount,
  onPress,
}: {
  photos: PlacePhoto[];
  photoCount: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="mx-4 mt-4 flex-row items-center gap-2.5 rounded-xl bg-blue-02 py-2.5 pl-2.5 pr-3.5"
    >
      <View className="flex-row">
        {photos.slice(0, 2).map((photo, index) => (
          <NudgeThumb key={photo.id} id={photo.id} overlap={index > 0} />
        ))}
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-black text-caption01" numberOfLines={1}>
          여기서 찍은 내 사진 {photoCount}장
        </Text>
        <Text className="text-grey-60 text-caption02">나만 보여요</Text>
      </View>
      <View className="flex-row items-center">
        <Text className="text-mju-primary text-caption01">리뷰 쓰기</Text>
        <Icon as={ChevronRight} size={14} className="text-mju-primary" />
      </View>
    </Pressable>
  );
}

function NudgeThumb({ id, overlap }: { id: string; overlap: boolean }) {
  const uri = useLibraryPhotoUri(id);
  return (
    <View
      className={cn(
        'h-9 w-9 overflow-hidden rounded-lg border-2 border-blue-02 bg-grey-10',
        overlap && '-ml-2.5'
      )}
    >
      {uri && <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />}
    </View>
  );
}
