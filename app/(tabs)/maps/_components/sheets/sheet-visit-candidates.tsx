import { XIcon } from '@/components/icons';
import { RestaurantIcon } from '@/components/icons/map';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useLibraryPhotoUri } from '@/hooks/use-place-photos';
import { formatPhotoDay } from '@/lib/maps/format';
import { groupPhotosByDay } from '@/lib/photo-location';
import { cn } from '@/lib/utils';
import type { VisitedPlace, VisitedPlaceCandidate } from '@/hooks/use-visited-places';
import { Check, ChevronRight, Lock } from 'lucide-react-native';
import * as React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import DismissPhotosDialog from './dismiss-photos-dialog';
import LibraryPhotoViewer from './library-photo-viewer';

// 한 번에 보여줄 사진 최대 장수 (썸네일마다 원본 파일을 연다)
const MAX_PHOTOS = 40;
// 리뷰 쓰기 화면의 최대 첨부 수와 같다
const MAX_PICK_COUNT = 10;
const GRID_COLUMNS = 4;
const GRID_GAP = 6;
const SIDE_PADDING = 16;

// 지도 "사진 N장" 핀을 눌렀을 때. 사진 위치(실내 GPS)만으로는 붙어 있는 가게를 가릴 수 없어서
// 사진을 먼저 찍은 날짜별로 보여주고, 사용자가 사진을 고른 뒤 어느 가게였는지 고르게 한다.
// 가게를 누르면 고른 사진이 붙은 리뷰 쓰기 화면으로 바로 간다. 사진을 누르면 크게 보고, 오른쪽 위 동그라미로 고른다
export default function VisitCandidatesSheet({
  visits,
  onSelect,
  onClose,
  onDismissPhotos,
}: {
  // 핀 하나 또는 한 구역에 묶인 핀들의 사진 묶음 (최근 순)
  visits: VisitedPlace[];
  // 고른 가게와 리뷰에 올릴 사진 (화면에 보이는 순서)
  onSelect: (candidate: VisitedPlaceCandidate, photoIds: string[]) => void;
  onClose: () => void;
  // 고른 사진을 숨긴다 (다른 가게 사진, 지금은 없어진 예전 가게 사진)
  onDismissPhotos: (photoIds: string[]) => void;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const tileSize = Math.floor(
    (windowWidth - SIDE_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS
  );
  const photos = React.useMemo(
    () =>
      visits
        .flatMap((visit) => visit.photos)
        .sort((first, second) => second.takenAt - first.takenAt)
        .slice(0, MAX_PHOTOS),
    [visits]
  );
  const days = React.useMemo(() => groupPhotosByDay(photos), [photos]);
  // 화면에 보이는 순서 (날짜 최근 순, 같은 날은 찍은 순)
  const orderedPhotoIds = days.flatMap((day) => day.photos.map((photo) => photo.id));
  // 처음엔 가장 최근에 간 날 사진을 고른다 (보통 한 가게에서 찍은 사진이다)
  const [selectedIds, setSelectedIds] = React.useState<string[]>(() =>
    (days[0]?.photos ?? []).slice(0, MAX_PICK_COUNT).map((photo) => photo.id)
  );
  const orderedSelectedIds = orderedPhotoIds.filter((id) => selectedIds.includes(id));
  const [isDismissDialogOpen, setIsDismissDialogOpen] = React.useState(false);
  // 크게 보고 있는 사진 순번 (사진을 누르면 연다)
  const [viewerIndex, setViewerIndex] = React.useState<number | null>(null);

  // 고른 사진이 나온 자리의 가게를 가까운 순으로. 아무것도 안 골랐으면 이 핀들의 가게 전체
  const selectedVisits = visits.filter((visit) =>
    visit.photos.some((photo) => selectedIds.includes(photo.id))
  );
  const candidates = [
    ...(selectedVisits.length ? selectedVisits : visits)
      .flatMap((visit) => visit.candidates)
      .sort((first, second) => first.distanceMeters - second.distanceMeters)
      .reduce(
        (byId, candidate) => (byId.has(candidate.id) ? byId : byId.set(candidate.id, candidate)),
        new Map<number, VisitedPlaceCandidate>()
      )
      .values(),
  ];

  function togglePhoto(id: string) {
    setSelectedIds((previous) => {
      if (previous.includes(id)) return previous.filter((selectedId) => selectedId !== id);
      if (previous.length >= MAX_PICK_COUNT) return previous;
      return [...previous, id];
    });
  }

  // 날짜 줄의 "모두 선택": 그날 사진을 한 번에 고르거나 푼다
  function toggleDay(dayPhotoIds: string[]) {
    const allSelected = dayPhotoIds.every((id) => selectedIds.includes(id));
    setSelectedIds((previous) =>
      allSelected
        ? previous.filter((id) => !dayPhotoIds.includes(id))
        : [...new Set([...previous, ...dayPhotoIds])].slice(0, MAX_PICK_COUNT)
    );
  }

  return (
    <ScrollView>
      <View className="flex-row items-start px-4">
        <View className="flex-1 gap-1">
          <Text className="text-black text-title03">
            이 주변에서 찍은 내 사진 {photos.length}장
          </Text>
          <Text className="text-grey-60 text-caption02">
            사진을 고르고 어느 가게였는지 눌러주세요. 고른 사진으로 바로 리뷰를 쓸 수 있어요.
          </Text>
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

      {days.map((day) => {
        const dayPhotoIds = day.photos.map((photo) => photo.id);
        const allSelected = dayPhotoIds.every((id) => selectedIds.includes(id));
        return (
          <View key={day.day} className="mt-5 px-4" style={{ gap: 8 }}>
            {/* 날짜 줄: 작은 글씨와 옅은 선으로 날마다 나눠 어느 날 찍은 사진인지 헷갈리지 않게 한다 */}
            <View className="flex-row items-center gap-2">
              <Text className="text-grey-60 text-caption01">{formatPhotoDay(day.day)}</Text>
              <Text className="text-grey-30 text-caption02">{day.photos.length}장</Text>
              <View className="h-px flex-1 bg-grey-10" />
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => toggleDay(dayPhotoIds)}
              >
                <Text className="text-grey-40 text-caption02">
                  {allSelected ? '선택 해제' : '모두 선택'}
                </Text>
              </Pressable>
            </View>
            <View className="flex-row flex-wrap" style={{ gap: GRID_GAP }}>
              {day.photos.map((photo) => (
                <PhotoTile
                  key={photo.id}
                  id={photo.id}
                  size={tileSize}
                  selected={selectedIds.includes(photo.id)}
                  onOpen={() => setViewerIndex(orderedPhotoIds.indexOf(photo.id))}
                  onToggle={() => togglePhoto(photo.id)}
                />
              ))}
            </View>
          </View>
        );
      })}
      <View className="mt-3 flex-row items-center gap-1 px-4">
        <Icon as={Lock} size={12} className="text-grey-40" />
        <Text className="text-grey-40 text-caption02">
          내 사진첩 사진이라 나만 보여요 · {orderedSelectedIds.length}장 선택
        </Text>
      </View>

      <View className="py-4">
        <View className="h-1 bg-grey-02" />
      </View>

      <View className="mb-3 px-4">
        <Text className="text-black text-body04">어느 가게였나요?</Text>
        <Text className="text-grey-40 text-caption02">
          고른 사진을 찍은 자리에서 가까운 순이에요
        </Text>
      </View>
      {candidates.map((candidate, index) => (
        <React.Fragment key={candidate.id}>
          {index > 0 && <View className="mx-4 my-3 h-[1.5px] bg-grey-02" />}
          <TouchableOpacity
            className="flex-row items-center gap-3.5 px-4"
            activeOpacity={0.7}
            onPress={() => onSelect(candidate, orderedSelectedIds)}
          >
            <View className="rounded bg-blue-05 p-2">
              <RestaurantIcon size={24} className="text-blue-15" />
            </View>
            <View className="flex-1">
              <Text className="text-black text-body04" numberOfLines={1}>
                {candidate.name}
              </Text>
              <Text className="text-grey-40 text-caption02">
                사진 위치에서 약 {Math.max(1, Math.round(candidate.distanceMeters))}m
              </Text>
            </View>
            <Icon as={ChevronRight} size={18} className="text-grey-30" />
          </TouchableOpacity>
        </React.Fragment>
      ))}
      {orderedSelectedIds.length > 0 && (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setIsDismissDialogOpen(true)}
          className="mt-5 items-center py-2"
        >
          <Text className="text-grey-40 underline text-caption02">
            고른 사진은 여기 가게 사진이 아니에요
          </Text>
        </TouchableOpacity>
      )}
      <View className="h-6" />
      <DismissPhotosDialog
        open={isDismissDialogOpen}
        onOpenChange={setIsDismissDialogOpen}
        onDismiss={() => {
          setIsDismissDialogOpen(false);
          onDismissPhotos(orderedSelectedIds);
          setSelectedIds([]);
        }}
      />
      <LibraryPhotoViewer
        photoIds={orderedPhotoIds}
        index={viewerIndex}
        onChangeIndex={setViewerIndex}
        onClose={() => setViewerIndex(null)}
      />
    </ScrollView>
  );
}

function PhotoTile({
  id,
  size,
  selected,
  onOpen,
  onToggle,
}: {
  id: string;
  size: number;
  selected: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const uri = useLibraryPhotoUri(id);
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="사진 크게 보기"
      activeOpacity={0.8}
      onPress={onOpen}
      style={{ width: size, height: size }}
      className={cn(
        'overflow-hidden rounded-lg bg-grey-10',
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
        {selected && <Icon as={Check} size={12} className="text-white" strokeWidth={3} />}
      </Pressable>
    </TouchableOpacity>
  );
}
