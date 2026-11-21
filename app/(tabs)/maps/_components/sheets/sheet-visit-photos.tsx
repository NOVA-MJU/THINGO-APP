import { XIcon } from '@/components/icons';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useLibraryPhotoUri } from '@/hooks/use-place-photos';
import type { VisitedPlace } from '@/hooks/use-visited-places';
import { formatPhotoDay } from '@/lib/maps/format';
import { groupPhotosByDay } from '@/lib/photo-location';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react-native';
import * as React from 'react';
import { Image, Pressable, ScrollView, TouchableOpacity, View } from 'react-native';
import { NativeViewGestureHandler } from 'react-native-gesture-handler';
import LibraryPhotoViewer from './library-photo-viewer';

// 한 번에 보여줄 사진 최대 장수 (썸네일마다 원본 파일을 연다)
const MAX_PHOTOS = 40;
// 리뷰 쓰기 화면의 최대 첨부 수와 같다
const MAX_PICK_COUNT = 10;

// 건물 핀 시트의 맨 위 (시트를 스크롤해도 위에 붙어 있다, index.tsx stickyHeader).
// 그 건물 근처에서 찍은 내 사진을 좌우 한 줄로 보여주고(찍은 날마다 작은 날짜 글씨와 옅은 세로선) 고르게 한다.
// 사진을 고른 채로 아래 가게 목록(sheet-visit-candidates.tsx)을 내려 보다가 가게를 누르면 그 사진으로 리뷰를 쓴다.
// 사진을 누르면 전체 화면으로 크게 보고, 크게 본 채로도 고를 수 있다
export default function VisitPhotosHeader({
  visits,
  selectedIds,
  onChangeSelection,
  onClose,
}: {
  visits: VisitedPlace[];
  // 고른 사진 (고른 순서 = 리뷰에 붙는 순서)
  selectedIds: string[];
  onChangeSelection: (photoIds: string[]) => void;
  onClose: () => void;
}) {
  const days = React.useMemo(() => groupPhotosByDay(visitPhotos(visits)), [visits]);
  const photoCount = days.reduce((sum, day) => sum + day.photos.length, 0);
  // 화면에 보이는 순서 (날짜 최근 순, 같은 날은 찍은 순)
  const orderedPhotoIds = days.flatMap((day) => day.photos.map((photo) => photo.id));
  // 크게 보고 있는 사진 순번 (사진을 누르면 연다)
  const [viewerIndex, setViewerIndex] = React.useState<number | null>(null);
  const address = visits.length === 1 ? visits[0].address : null;

  function togglePhoto(id: string) {
    if (selectedIds.includes(id)) {
      onChangeSelection(selectedIds.filter((selectedId) => selectedId !== id));
      return;
    }
    if (selectedIds.length < MAX_PICK_COUNT) onChangeSelection([...selectedIds, id]);
  }

  return (
    <View className="bg-white pb-3">
      <View className="flex-row items-start px-4">
        <View className="flex-1 gap-1">
          <Text className="text-black text-title03">
            {visits.length === 1
              ? `이 건물에서 찍은 내 사진 ${photoCount}장`
              : `이 주변에서 찍은 내 사진 ${photoCount}장`}
          </Text>
          {address && (
            <Text className="text-grey-40 text-caption02" numberOfLines={1}>
              {address.replace(/^서울\s+\S+구\s+/, '')}
            </Text>
          )}
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="닫기"
          hitSlop={4}
          onPress={onClose}
          className="h-7 w-7 items-center justify-center rounded-full bg-grey-02"
        >
          <XIcon size={14} className="text-grey-30" />
        </TouchableOpacity>
      </View>

      <NativeViewGestureHandler disallowInterruption>
        <ScrollView
          horizontal
          nestedScrollEnabled
          directionalLockEnabled
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {days.map((day, dayIndex) => (
            <View key={day.day} className="flex-row">
              {dayIndex > 0 && <View className="mx-3 mt-6 w-px self-stretch bg-grey-20" />}
              <View style={{ gap: 6 }}>
                <Text className="text-grey-60 text-caption02">{formatPhotoDay(day.day)}</Text>
                <View className="flex-row" style={{ gap: 6 }}>
                  {day.photos.map((photo) => (
                    <PhotoTile
                      key={photo.id}
                      id={photo.id}
                      order={selectedIds.indexOf(photo.id) + 1}
                      onOpen={() => setViewerIndex(orderedPhotoIds.indexOf(photo.id))}
                      onToggle={() => togglePhoto(photo.id)}
                    />
                  ))}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </NativeViewGestureHandler>

      <View className="mx-4 mt-2.5 flex-row items-center gap-1.5 rounded-lg bg-blue-02 px-3 py-2">
        <Text className="flex-1 text-grey-80 text-caption01">
          {selectedIds.length > 0
            ? `사진 ${selectedIds.length}장 선택 · 아래에서 가게를 누르면 이 사진으로 리뷰를 써요`
            : '올릴 사진을 고르고 아래에서 가게를 눌러주세요'}
        </Text>
        <Icon as={Lock} size={12} className="text-grey-40" />
        <Text className="text-grey-40 text-caption02">나만 보여요</Text>
      </View>

      <LibraryPhotoViewer
        photoIds={orderedPhotoIds}
        index={viewerIndex}
        onChangeIndex={setViewerIndex}
        onClose={() => setViewerIndex(null)}
        selectedIds={selectedIds}
        onToggleSelect={togglePhoto}
      />
    </View>
  );
}

// 시트에 보여줄 사진 (최근에 찍은 것부터 MAX_PHOTOS장)
function visitPhotos(visits: VisitedPlace[]) {
  return visits
    .flatMap((visit) => visit.photos)
    .sort((first, second) => second.takenAt - first.takenAt)
    .slice(0, MAX_PHOTOS);
}

function PhotoTile({
  id,
  order,
  onOpen,
  onToggle,
}: {
  id: string;
  // 고른 순번 (0이면 안 고름)
  order: number;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const uri = useLibraryPhotoUri(id);
  const selected = order > 0;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="사진 크게 보기"
      activeOpacity={0.8}
      onPress={onOpen}
      className={cn(
        'h-24 w-24 overflow-hidden rounded-lg bg-grey-10',
        selected && 'border-2 border-mju-primary'
      )}
    >
      {uri && <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />}
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        accessibilityLabel="리뷰에 올릴 사진으로 고르기"
        hitSlop={8}
        onPress={onToggle}
        className={cn(
          'absolute right-1.5 top-1.5 h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-white',
          selected ? 'bg-mju-primary' : 'bg-black/25'
        )}
      >
        {selected && <Text className="text-[11px] text-white">{order}</Text>}
      </Pressable>
    </TouchableOpacity>
  );
}
