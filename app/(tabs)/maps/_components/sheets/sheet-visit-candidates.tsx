import { ArrowLeftIcon, SearchIcon, XIcon, XThinIcon } from '@/components/icons';
import { RestaurantIcon } from '@/components/icons/map';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useLibraryPhotoUri, useReviewablePlaces } from '@/hooks/use-place-photos';
import { formatPhotoDay } from '@/lib/maps/format';
import { groupPhotosByDay } from '@/lib/photo-location';
import { cn } from '@/lib/utils';
import type { VisitedPlace, VisitedPlaceCandidate } from '@/hooks/use-visited-places';
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
// "목록에 없어요"에서 이름으로 찾을 때 보여줄 최대 가게 수
const MAX_SEARCH_RESULTS = 8;

// 지도 "사진 N장" 핀(건물 하나)을 눌렀을 때. 실내 GPS로는 붙어 있는 가게를 가릴 수 없어서 두 단계로 나눈다.
// 1. 사진 고르기: 그 건물 근처에서 찍은 사진을 찍은 날짜별 한 줄씩 보여주고(가장 최근 날을 미리 골라 둠) 아래 버튼으로 넘어간다
// 2. 가게 고르기: 고른 사진을 위에 작게 두고 그 건물 가게 -> 바로 옆 가게 순으로 고른다. 목록에 없으면 이름으로 찾는다.
// 가게를 누르면 고른 사진이 붙은 리뷰 쓰기 화면으로 바로 간다. 사진을 누르면 크게 보고, 크게 본 채로도 고를 수 있다
export default function VisitCandidatesSheet({
  visits,
  onSelect,
  onClose,
  onDismissPhotos,
}: {
  // 핀 하나(건물 하나). 아주 크게 확대해도 안 풀리는 묶음 핀이면 여러 건물
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
  const [step, setStep] = React.useState<'photos' | 'place'>('photos');
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
    <ScrollView keyboardShouldPersistTaps="handled">
      <View className="flex-row items-start px-4">
        {step === 'place' && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="사진 다시 고르기"
            hitSlop={8}
            onPress={() => setStep('photos')}
            className="mr-2 h-7 w-7 items-center justify-center"
          >
            <ArrowLeftIcon size={20} className="text-black" />
          </TouchableOpacity>
        )}
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

      <StepHeader step={step} />

      {step === 'photos' ? (
        <>
          {days.map((day) => {
            const dayPhotoIds = day.photos.map((photo) => photo.id);
            const allSelected = dayPhotoIds.every((id) => selectedIds.includes(id));
            return (
              <View key={day.day} className="mt-4" style={{ gap: 8 }}>
                {/* 날짜 줄: 작은 글씨와 옅은 선으로 날마다 나눠 어느 날 찍은 사진인지 헷갈리지 않게 한다 */}
                <View className="flex-row items-center gap-2 px-4">
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
                {/* 날마다 가로 한 줄이라 사진이 많아도 아래 버튼까지 스크롤이 길어지지 않는다 */}
                <NativeViewGestureHandler disallowInterruption>
                  <ScrollView
                    horizontal
                    nestedScrollEnabled
                    directionalLockEnabled
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 6, paddingHorizontal: 16 }}
                  >
                    {day.photos.map((photo) => (
                      <PhotoTile
                        key={photo.id}
                        id={photo.id}
                        order={selectedIds.indexOf(photo.id) + 1}
                        onOpen={() => setViewerIndex(orderedPhotoIds.indexOf(photo.id))}
                        onToggle={() => togglePhoto(photo.id)}
                      />
                    ))}
                  </ScrollView>
                </NativeViewGestureHandler>
              </View>
            );
          })}

          <View className="mt-5 px-4" style={{ gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setStep('place')}
              className="h-12 flex-row items-center justify-center gap-1 rounded-xl bg-mju-primary active:opacity-80"
            >
              <Text className="text-white text-body04">
                {selectedIds.length > 0
                  ? `사진 ${selectedIds.length}장으로 가게 고르기`
                  : '사진 없이 가게 고르기'}
              </Text>
              <Icon as={ChevronRight} size={16} className="text-white" />
            </Pressable>
            <View className="flex-row items-center justify-center gap-1">
              <Icon as={Lock} size={12} className="text-grey-40" />
              <Text className="text-grey-40 text-caption02">
                내 사진첩 사진이라 나만 보여요. 리뷰에 올린 사진만 다른 사람에게 보여요
              </Text>
            </View>
            {selectedIds.length > 0 && (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setIsDismissDialogOpen(true)}
                className="items-center py-2"
              >
                <Text className="text-grey-40 underline text-caption02">
                  고른 사진은 이 근처 가게 사진이 아니에요
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      ) : (
        <PlaceStep
          visits={visits}
          selectedIds={selectedIds}
          onSelect={(candidate) => onSelect(candidate, selectedIds)}
          onEditPhotos={() => setStep('photos')}
        />
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

// 지금 몇 번째 단계인지 (1 사진 고르기 -> 2 가게 고르기)
function StepHeader({ step }: { step: 'photos' | 'place' }) {
  return (
    <View className="mt-4 flex-row items-center gap-2 px-4">
      <StepBadge number={1} label="사진 고르기" active={step === 'photos'} />
      <View className="h-px w-4 bg-grey-20" />
      <StepBadge number={2} label="가게 고르기" active={step === 'place'} />
    </View>
  );
}

function StepBadge({ number, label, active }: { number: number; label: string; active: boolean }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View
        className={cn(
          'h-5 w-5 items-center justify-center rounded-full',
          active ? 'bg-mju-primary' : 'bg-grey-10'
        )}
      >
        <Text className={cn('text-caption02', active ? 'text-white' : 'text-grey-40')}>
          {number}
        </Text>
      </View>
      <Text className={cn('text-caption01', active ? 'text-black' : 'text-grey-40')}>{label}</Text>
    </View>
  );
}

function PlaceStep({
  visits,
  selectedIds,
  onSelect,
  onEditPhotos,
}: {
  visits: VisitedPlace[];
  selectedIds: string[];
  onSelect: (candidate: VisitedPlaceCandidate) => void;
  onEditPhotos: () => void;
}) {
  const [query, setQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
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
  const buildingCandidates = candidates.filter((candidate) => candidate.inBuilding);
  const nearbyCandidates = candidates.filter((candidate) => !candidate.inBuilding);
  const normalizedQuery = query.replace(/\s/g, '').toLowerCase();
  const searchResults = normalizedQuery
    ? reviewablePlaces
        .filter((place) => place.title.replace(/\s/g, '').toLowerCase().includes(normalizedQuery))
        .slice(0, MAX_SEARCH_RESULTS)
        .map((place) => ({
          id: place.id,
          name: place.title,
          categoryCode: place.categoryCode,
          latitude: place.latitude,
          longitude: place.longitude,
          distanceMeters: 0,
          inBuilding: false,
        }))
    : [];

  return (
    <View className="mt-4">
      {/* 고른 사진을 작게 보여줘 무엇을 올리는지 잊지 않게 한다. 누르면 사진 고르기로 돌아간다 */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="사진 다시 고르기"
        onPress={onEditPhotos}
        className="mx-4 flex-row items-center gap-2.5 rounded-xl bg-grey-02 p-2.5"
      >
        <View className="flex-row">
          {selectedIds.slice(0, 4).map((id, index) => (
            <SmallThumbnail key={id} id={id} overlap={index > 0} />
          ))}
        </View>
        <Text className="flex-1 text-grey-60 text-caption01">
          {selectedIds.length > 0 ? `고른 사진 ${selectedIds.length}장` : '고른 사진 없음'}
        </Text>
        <Text className="text-mju-primary text-caption01">다시 고르기</Text>
      </Pressable>

      <Text className="mx-4 mb-2 mt-5 text-black text-body04">어느 가게였나요?</Text>
      {buildingCandidates.length > 0 && (
        <SectionLabel label={visits.length === 1 ? '이 건물 가게' : '이 주변 건물 가게'} />
      )}
      {buildingCandidates.map((candidate) => (
        <CandidateRow
          key={candidate.id}
          candidate={candidate}
          onPress={() => onSelect(candidate)}
        />
      ))}
      {nearbyCandidates.length > 0 && <SectionLabel label="바로 옆 가게" />}
      {nearbyCandidates.map((candidate) => (
        <CandidateRow
          key={candidate.id}
          candidate={candidate}
          detail={`사진 위치에서 약 ${Math.max(1, Math.round(candidate.distanceMeters))}m`}
          onPress={() => onSelect(candidate)}
        />
      ))}

      {/* 목록에 없으면 (GPS가 크게 빗나갔거나 다른 건물) 대동명지도 가게 이름으로 찾는다 */}
      {isSearching ? (
        <View className="mx-4 mt-4" style={{ gap: 4 }}>
          <View className="h-10 flex-row items-center gap-1.5 rounded-full border border-grey-10 bg-white pl-3 pr-2.5">
            <SearchIcon size={16} className="text-grey-40" />
            <BottomSheetTextInput
              value={query}
              onChangeText={setQuery}
              autoFocus
              placeholder="가게 이름으로 찾기"
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
      ) : (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setIsSearching(true)}
          className="mt-4 items-center py-2"
        >
          <Text className="text-grey-60 underline text-caption01">
            목록에 없어요 · 가게 이름으로 찾기
          </Text>
        </TouchableOpacity>
      )}
      {searchResults.map((candidate) => (
        <CandidateRow
          key={candidate.id}
          candidate={candidate}
          onPress={() => onSelect(candidate)}
        />
      ))}
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text className="mx-4 mb-1 mt-2 text-grey-40 text-caption02">{label}</Text>;
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
        'h-[92px] w-[92px] overflow-hidden rounded-lg bg-grey-10',
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

function SmallThumbnail({ id, overlap }: { id: string; overlap: boolean }) {
  const uri = useLibraryPhotoUri(id);
  return (
    <View
      className={cn(
        'h-9 w-9 overflow-hidden rounded-lg border-2 border-grey-02 bg-grey-10',
        overlap && '-ml-2.5'
      )}
    >
      {uri && <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />}
    </View>
  );
}
