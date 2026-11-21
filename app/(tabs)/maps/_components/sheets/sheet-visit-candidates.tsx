import { SearchIcon, XThinIcon } from '@/components/icons';
import { RestaurantIcon } from '@/components/icons/map';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useReviewablePlaces } from '@/hooks/use-place-photos';
import type { VisitedPlace, VisitedPlaceCandidate } from '@/hooks/use-visited-places';
import { formatMapDistance } from '@/lib/maps/format';
import { distanceMeters } from '@/lib/photo-location';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { ChevronRight } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, TouchableOpacity, View } from 'react-native';
import DismissPhotosDialog from './dismiss-photos-dialog';

// "주변 가게 더 보기"를 누를 때마다 더 보여줄 가게 수
const MORE_PLACES_STEP = 10;
// 가게 이름으로 찾을 때 보여줄 최대 가게 수
const MAX_SEARCH_RESULTS = 8;

// 건물 핀 시트의 가게 목록 (맨 위 사진 줄은 sheet-visit-photos.tsx, 스크롤해도 위에 붙어 있다).
// 실내 GPS는 수십 m씩 빗나가서 이 건물 가게 말고 주변 가게도 가까운 순으로 같이 보여주고, 더 보거나 이름으로 찾을 수 있다.
// 가게를 누르면 위에서 고른 사진이 고른 순서대로 붙은 리뷰 쓰기 화면으로 바로 간다 (멀리 있는 가게를 골라도 사진은 그대로 간다)
export default function VisitCandidatesSheet({
  visits,
  selectedIds,
  onSelect,
  onDismissPhotos,
}: {
  visits: VisitedPlace[];
  // 위 사진 줄에서 고른 사진
  selectedIds: string[];
  onSelect: (candidate: VisitedPlaceCandidate) => void;
  // 고른 사진을 숨긴다 (다른 가게 사진, 지금은 없어진 예전 가게 사진)
  onDismissPhotos: (photoIds: string[]) => void;
}) {
  const [isDismissDialogOpen, setIsDismissDialogOpen] = React.useState(false);
  return (
    <View className="pt-2">
      <PlaceList visits={visits} onSelect={onSelect} />
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
        }}
      />
    </View>
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
