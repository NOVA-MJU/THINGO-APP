import { SearchIcon, XIcon, XThinIcon } from '@/components/icons';
import { RestaurantIcon } from '@/components/icons/map';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useLibraryPhotoUri, useReviewablePlaces } from '@/hooks/use-place-photos';
import type { VisitedPlace, VisitedPlaceCandidate } from '@/hooks/use-visited-places';
import { formatMapDistance, formatPhotoDay } from '@/lib/maps/format';
import { distanceMeters, groupPhotosByDay } from '@/lib/photo-location';
import { cn } from '@/lib/utils';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { ChevronRight, Lock } from 'lucide-react-native';
import * as React from 'react';
import { Image, Pressable, ScrollView, TouchableOpacity, View } from 'react-native';
import { NativeViewGestureHandler } from 'react-native-gesture-handler';
import DismissPhotosDialog from './dismiss-photos-dialog';
import LibraryPhotoViewer from './library-photo-viewer';

// 한 번에 보여줄 사진 최대 장수 (썸네일마다 원본 파일을 연다)
const MAX_PHOTOS = 40;
// 리뷰 쓰기 화면의 최대 첨부 수와 같다
const MAX_PICK_COUNT = 10;
// "주변 가게 더 보기"를 누를 때마다 더 보여줄 가게 수
const MORE_PLACES_STEP = 10;
// 가게 이름으로 찾을 때 보여줄 최대 가게 수
const MAX_SEARCH_RESULTS = 8;

// 지도 "사진 N장" 건물 핀을 눌렀을 때. 맨 위에 그 건물 근처에서 찍은 내 사진을 좌우로 넘겨 보게 하고
// (찍은 날마다 작은 날짜 글씨와 옅은 세로선으로 나눔, 가장 최근 날을 미리 골라 둠), 아래에서 어느 가게였는지 고른다.
// 실내 GPS는 수십 m씩 빗나가서 이 건물 가게 말고 주변 가게도 가까운 순으로 같이 보여주고, 더 보거나 이름으로 찾을 수 있다.
// 가게를 누르면 고른 사진이 고른 순서대로 붙은 리뷰 쓰기 화면으로 바로 간다 (멀리 있는 가게를 골라도 사진은 그대로 간다).
// 사진을 누르면 전체 화면으로 크게 보고, 크게 본 채로도 고를 수 있다
export default function VisitCandidatesSheet({
  visits,
  onSelect,
  onClose,
  onDismissPhotos,
}: {
  // 건물 핀 하나 (아주 크게 확대해도 안 풀리는 바로 붙은 건물이면 여러 개)
  visits: VisitedPlace[];
  // 고른 가게와 리뷰에 올릴 사진 (고른 순서)
  onSelect: (candidate: VisitedPlaceCandidate, photoIds: string[]) => void;
  onClose: () => void;
  // 고른 사진을 숨긴다 (다른 가게 사진, 지금은 없어진 예전 가게 사진)
  onDismissPhotos: (photoIds: string[]) => void;
}) {
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
  // 고른 순서대로 둔다 (크게 보기의 순번, 리뷰에 붙는 순서). 처음엔 가장 최근에 간 날 사진을 고른다
  const [selectedIds, setSelectedIds] = React.useState<string[]>(() =>
    (days[0]?.photos ?? []).slice(0, MAX_PICK_COUNT).map((photo) => photo.id)
  );
  const [isDismissDialogOpen, setIsDismissDialogOpen] = React.useState(false);
  // 크게 보고 있는 사진 순번 (사진을 누르면 연다)
  const [viewerIndex, setViewerIndex] = React.useState<number | null>(null);

  const address = visits.length === 1 ? visits[0].address : null;
  const title =
    visits.length === 1
      ? `이 건물에서 찍은 내 사진 ${photos.length}장`
      : `이 주변에서 찍은 내 사진 ${photos.length}장`;

  function togglePhoto(id: string) {
    setSelectedIds((previous) => {
      if (previous.includes(id)) return previous.filter((selectedId) => selectedId !== id);
      if (previous.length >= MAX_PICK_COUNT) return previous;
      return [...previous, id];
    });
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <View className="flex-row items-start px-4">
        <View className="flex-1 gap-1">
          <Text className="text-black text-title03">{title}</Text>
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

      {/* 사진은 좌우 한 줄. 찍은 날마다 위에 작은 날짜 글씨, 날 사이에 옅은 세로선 */}
      <NativeViewGestureHandler disallowInterruption>
        <ScrollView
          horizontal
          nestedScrollEnabled
          directionalLockEnabled
          showsHorizontalScrollIndicator={false}
          className="mt-4"
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
      <View className="mt-2 flex-row items-center gap-1 px-4">
        <Icon as={Lock} size={12} className="text-grey-40" />
        <Text className="flex-1 text-grey-40 text-caption02">
          {`${selectedIds.length}장 선택 · 나만 보여요. 리뷰에 올린 사진만 다른 사람에게 보여요`}
        </Text>
      </View>

      <View className="py-4">
        <View className="h-1 bg-grey-02" />
      </View>

      <PlaceList visits={visits} onSelect={(candidate) => onSelect(candidate, selectedIds)} />

      {selectedIds.length > 0 && (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setIsDismissDialogOpen(true)}
          className="mt-4 items-center py-2"
        >
          <Text className="text-grey-40 underline text-caption02">
            고른 사진은 이 근처 가게 사진이 아니에요
          </Text>
        </TouchableOpacity>
      )}
      <View className="h-6" />
      <DismissPhotosDialog
        open={isDismissDialogOpen}
        onOpenChange={setIsDismissDialogOpen}
        onDismiss={() => {
          setIsDismissDialogOpen(false);
          onDismissPhotos(selectedIds);
          setSelectedIds([]);
        }}
      />
      <LibraryPhotoViewer
        photoIds={orderedPhotoIds}
        index={viewerIndex}
        onChangeIndex={setViewerIndex}
        onClose={() => setViewerIndex(null)}
        selectedIds={selectedIds}
        onToggleSelect={togglePhoto}
      />
    </ScrollView>
  );
}

// "어느 가게였나요?" 같이 찍은 사진을 올린 곳 -> 이 건물 가게 -> 주변 가게(가까운 순) -> 더 보기 -> 이름으로 찾기
function PlaceList({
  visits,
  onSelect,
}: {
  visits: VisitedPlace[];
  onSelect: (candidate: VisitedPlaceCandidate) => void;
}) {
  const [query, setQuery] = React.useState('');
  const [extraPlaceCount, setExtraPlaceCount] = React.useState(0);
  const reviewablePlaces = useReviewablePlaces();
  // 같은 가게가 여러 건물 후보에 겹치면 한 번만 (이 건물 가게가 먼저 온다)
  const candidates = [
    ...visits
      .flatMap((visit) => visit.candidates)
      .reduce(
        (byId, candidate) => (byId.has(candidate.id) ? byId : byId.set(candidate.id, candidate)),
        new Map<number, VisitedPlaceCandidate>()
      )
      .values(),
  ];
  const sameVisitCandidates = candidates.filter((candidate) => candidate.sameVisitUploaded);
  const buildingCandidates = candidates.filter(
    (candidate) => candidate.inBuilding && !candidate.sameVisitUploaded
  );
  const nearbyCandidates = candidates.filter((candidate) => !candidate.inBuilding);
  const center = visits[0];
  const toCandidate = (place: (typeof reviewablePlaces)[number]): VisitedPlaceCandidate => ({
    id: place.id,
    name: place.title,
    categoryCode: place.categoryCode,
    latitude: place.latitude,
    longitude: place.longitude,
    distanceMeters: distanceMeters(center, place),
    inBuilding: false,
    sameVisitUploaded: false,
  });
  // 이미 보여준 가게 다음으로 가까운 가게들 ("주변 가게 더 보기"를 누를 때마다 늘어난다)
  const morePlaces = reviewablePlaces
    .filter((place) => !candidates.some((candidate) => candidate.id === place.id))
    .map(toCandidate)
    .sort((first, second) => first.distanceMeters - second.distanceMeters);
  const normalizedQuery = query.replace(/\s/g, '').toLowerCase();
  const searchResults = normalizedQuery
    ? reviewablePlaces
        .filter((place) => place.title.replace(/\s/g, '').toLowerCase().includes(normalizedQuery))
        .slice(0, MAX_SEARCH_RESULTS)
        .map(toCandidate)
    : [];

  return (
    <View>
      <Text className="mx-4 mb-1 text-black text-body04">어느 가게였나요?</Text>
      {sameVisitCandidates.length > 0 && (
        <>
          <SectionLabel label="같이 찍은 사진을 리뷰에 올린 곳" />
          {sameVisitCandidates.map((candidate) => (
            <CandidateRow
              key={candidate.id}
              candidate={candidate}
              onPress={() => onSelect(candidate)}
            />
          ))}
        </>
      )}
      {buildingCandidates.length > 0 && (
        <SectionLabel label={visits.length === 1 ? '이 건물 가게' : '이 건물들 가게'} />
      )}
      {buildingCandidates.map((candidate) => (
        <CandidateRow
          key={candidate.id}
          candidate={candidate}
          onPress={() => onSelect(candidate)}
        />
      ))}
      {nearbyCandidates.length + extraPlaceCount > 0 && <SectionLabel label="주변 가게" />}
      {[...nearbyCandidates, ...morePlaces.slice(0, extraPlaceCount)].map((candidate) => (
        <CandidateRow
          key={candidate.id}
          candidate={candidate}
          detail={formatMapDistance(candidate.distanceMeters)}
          onPress={() => onSelect(candidate)}
        />
      ))}
      {extraPlaceCount < morePlaces.length && (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setExtraPlaceCount((count) => count + MORE_PLACES_STEP)}
          className="mx-4 mt-2 h-10 flex-row items-center justify-center gap-1 rounded-xl bg-grey-02"
        >
          <Text className="text-grey-60 text-caption01">주변 가게 더 보기</Text>
        </TouchableOpacity>
      )}

      {/* 목록에 없으면 대동명지도 가게 이름으로 찾는다 */}
      <View className="mx-4 mt-3" style={{ gap: 4 }}>
        <View className="h-10 flex-row items-center gap-1.5 rounded-full border border-grey-10 bg-white pl-3 pr-2.5">
          <SearchIcon size={16} className="text-grey-40" />
          <BottomSheetTextInput
            value={query}
            onChangeText={setQuery}
            placeholder="목록에 없으면 가게 이름으로 찾기"
            placeholderTextColor="#909499"
            returnKeyType="search"
            autoCorrect={false}
            style={{ flex: 1, fontSize: 14, color: '#0B1215', paddingVertical: 0 }}
          />
          {query.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="검색어 지우기"
              hitSlop={8}
              onPress={() => setQuery('')}
            >
              <XThinIcon size={14} className="text-grey-40" />
            </Pressable>
          )}
        </View>
        {normalizedQuery.length > 0 && searchResults.length === 0 && (
          <Text className="px-2 text-grey-40 text-caption02">
            찾는 가게가 없어요. 띵고에 아직 없는 가게일 수 있어요
          </Text>
        )}
      </View>
      {searchResults.map((candidate) => (
        <CandidateRow
          key={`search-${candidate.id}`}
          candidate={candidate}
          detail={formatMapDistance(candidate.distanceMeters)}
          onPress={() => onSelect(candidate)}
        />
      ))}
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text className="mx-4 mb-1 mt-3 text-grey-40 text-caption02">{label}</Text>;
}

function CandidateRow({
  candidate,
  detail,
  onPress,
}: {
  candidate: VisitedPlaceCandidate;
  detail?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className="flex-row items-center gap-3.5 px-4 py-2.5"
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View className="rounded bg-blue-05 p-2">
        <RestaurantIcon size={20} className="text-blue-15" />
      </View>
      <View className="flex-1">
        <Text className="text-black text-body04" numberOfLines={1}>
          {candidate.name}
        </Text>
        {detail && <Text className="text-grey-40 text-caption02">{detail}</Text>}
      </View>
      <Icon as={ChevronRight} size={18} className="text-grey-30" />
    </TouchableOpacity>
  );
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
