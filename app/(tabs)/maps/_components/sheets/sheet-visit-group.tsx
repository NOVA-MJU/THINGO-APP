import { XIcon } from '@/components/icons';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useLibraryPhotoUri } from '@/hooks/use-place-photos';
import type { VisitedPlace } from '@/hooks/use-visited-places';
import { formatMapDistance, formatVisitDate } from '@/lib/maps/format';
import { distanceMeters, type GeoPoint } from '@/lib/photo-location';
import { ChevronRight } from 'lucide-react-native';
import * as React from 'react';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { NativeViewGestureHandler } from 'react-native-gesture-handler';

// 맨 위 사진 줄에 보여줄 최대 장수 (썸네일마다 원본 파일을 연다)
const MAX_STRIP_PHOTOS = 30;

// "다녀온 곳 N" 버튼으로 핀을 켰을 때 뜨는 전체 목록.
// 맨 위에 아직 리뷰에 안 올린 내 사진을 최근 순으로 좌우 한 줄로 보여주고(누르면 그 사진을 찍은 건물로 간다),
// 아래는 지도 핀과 같이 건물 하나가 한 줄이다. 줄 제목은 그 건물에서 가장 그럴듯한 가게("OO 외 N곳")이고 사진 수·날짜·거리를 같이 보여준다.
// 지도 가운데에서 가까운 순이고, 고르면 그 핀으로 지도를 옮기고 시트를 내린다(index.tsx focusVisitedPlace).
// 핀을 누르면 사진과 가게를 고르는 시트가 뜬다 (sheet-visit-photos.tsx, sheet-visit-candidates.tsx)
export default function VisitGroupSheet({
  visits,
  title,
  description,
  center,
  onSelect,
  onClose,
}: {
  visits: VisitedPlace[];
  title: string;
  description: string;
  // 이 위치(지도 가운데)에서 가까운 순으로 정렬하고 거리를 같이 보여준다
  center: GeoPoint;
  onSelect: (visit: VisitedPlace) => void;
  onClose: () => void;
}) {
  const sortedVisits = [...visits].sort(
    (first, second) => distanceMeters(first, center) - distanceMeters(second, center)
  );
  // 맨 위 사진 줄: 모든 건물의 사진을 최근에 찍은 순으로 (누르면 그 사진의 건물로 간다)
  const recentPhotos = visits
    .flatMap((visit) => visit.photos.map((photo) => ({ ...photo, visit })))
    .sort((first, second) => second.takenAt - first.takenAt)
    .slice(0, MAX_STRIP_PHOTOS);

  return (
    <ScrollView>
      <View className="flex-row items-start px-4">
        <View className="flex-1 gap-1">
          <Text className="text-black text-title03">{title}</Text>
          <Text className="text-grey-60 text-caption02">{description}</Text>
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
          contentContainerStyle={{ gap: 6, paddingHorizontal: 16 }}
        >
          {recentPhotos.map((photo) => (
            <TouchableOpacity
              key={photo.id}
              accessibilityRole="button"
              accessibilityLabel="이 사진을 찍은 곳으로 지도 옮기기"
              activeOpacity={0.8}
              onPress={() => onSelect(photo.visit)}
            >
              <StripPhoto id={photo.id} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </NativeViewGestureHandler>

      <View className="py-3">
        <View className="h-1 bg-grey-02" />
      </View>

      {sortedVisits.map((visit, index) => (
        <React.Fragment key={visit.key}>
          {index > 0 && <View className="mx-4 my-3 h-[1.5px] bg-grey-02" />}
          <TouchableOpacity
            className="flex-row items-center gap-3.5 px-4"
            activeOpacity={0.7}
            onPress={() => onSelect(visit)}
          >
            {/* 다녀온 곳은 음식 사진이 한 장 이상 있어야 생긴다 */}
            <LatestPhoto id={visit.photos[0].id} />
            <View className="flex-1">
              <Text className="text-black text-body04" numberOfLines={1}>
                {expectedPlaceTitle(visit)}
              </Text>
              <Text className="text-grey-40 text-caption02" numberOfLines={1}>
                {[
                  `사진 ${visit.photos.length}장`,
                  formatVisitDate(visit.lastVisitAt),
                  formatMapDistance(distanceMeters(visit, center)),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
            <Icon as={ChevronRight} size={18} className="text-grey-30" />
          </TouchableOpacity>
        </React.Fragment>
      ))}
      <View className="h-6" />
    </ScrollView>
  );
}

// 줄 제목: 그 건물에서 가장 그럴듯한 가게(같이 찍은 사진을 올린 곳 -> 사진 음식에 맞는 곳 순으로 맨 앞)와 나머지 건물 가게 수
function expectedPlaceTitle(visit: VisitedPlace) {
  const buildingPlaces = visit.candidates.filter((candidate) => candidate.inBuilding);
  const [expected] = buildingPlaces;
  if (!expected) return `사진 ${visit.photos.length}장`;
  return buildingPlaces.length > 1
    ? `${expected.name} 외 ${buildingPlaces.length - 1}곳`
    : expected.name;
}

function StripPhoto({ id }: { id: string }) {
  const uri = useLibraryPhotoUri(id);
  return (
    <View className="h-20 w-20 overflow-hidden rounded-lg bg-grey-10">
      {uri && <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />}
    </View>
  );
}

function LatestPhoto({ id }: { id: string }) {
  const uri = useLibraryPhotoUri(id);
  return (
    <View className="h-11 w-11 overflow-hidden rounded-lg bg-grey-10">
      {uri && <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />}
    </View>
  );
}
