import { XIcon } from '@/components/icons';
import { RestaurantIcon } from '@/components/icons/map';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { VisitedPlace, VisitedPlaceCandidate } from '@/hooks/use-visited-places';
import { formatMapDistance, formatVisitDate } from '@/lib/maps/format';
import { distanceMeters, type GeoPoint } from '@/lib/photo-location';
import { ChevronRight } from 'lucide-react-native';
import * as React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

// 다녀온 곳 목록. 붙어 있는 가게라 사진 한 묶음에 후보가 여러 곳이어도 "외 N곳"으로 접지 않고 가게마다 한 줄씩 보여줘서 바로 고르게 한다.
// "다녀온 곳 N" 버튼으로 핀을 켰을 때 뜬다: 전체를 지도 가운데에서 가까운 순으로, 고르면 그 핀으로 지도를 옮긴다
// (핀을 누르면 사진을 날짜별로 보고 가게를 고르는 sheet-visit-candidates.tsx가 뜬다)
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
  // 있으면 이 위치(지도 가운데)에서 가까운 순으로 정렬하고 거리를 같이 보여준다
  center?: GeoPoint;
  // 고른 가게와 그 가게가 들어 있는 다녀온 곳(사진 묶음)
  onSelect: (visitKey: string, candidate: VisitedPlaceCandidate) => void;
  onClose: () => void;
}) {
  // 가게 한 곳이 여러 사진 묶음의 후보로 겹치면 최근 묶음 하나만 남긴다 (visits는 최근에 간 곳부터 온다)
  const rows = [
    ...new Map(
      visits
        .flatMap((visit) => visit.candidates.map((candidate) => ({ visit, candidate })))
        .reverse()
        .map((row) => [row.candidate.id, row] as const)
    ).values(),
  ].reverse();
  const sortedRows = center
    ? [...rows].sort(
        (first, second) =>
          distanceMeters(first.candidate, center) - distanceMeters(second.candidate, center)
      )
    : rows;

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

      <View className="py-3">
        <View className="h-1 bg-grey-02" />
      </View>

      {sortedRows.map(({ visit, candidate }, index) => {
        return (
          <React.Fragment key={candidate.id}>
            {index > 0 && <View className="mx-4 my-3 h-[1.5px] bg-grey-02" />}
            <TouchableOpacity
              className="flex-row items-center gap-3.5 px-4"
              activeOpacity={0.7}
              onPress={() => onSelect(visit.key, candidate)}
            >
              <View className="rounded bg-blue-05 p-2">
                <RestaurantIcon size={24} className="text-blue-15" />
              </View>
              <View className="flex-1">
                <Text className="text-black text-body04" numberOfLines={1}>
                  {candidate.name}
                </Text>
                <Text className="text-grey-40 text-caption02">
                  {[
                    formatVisitDate(visit.lastVisitAt),
                    `사진 ${visit.photos.length}장`,
                    center && formatMapDistance(distanceMeters(candidate, center)),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
              <Icon as={ChevronRight} size={18} className="text-grey-30" />
            </TouchableOpacity>
          </React.Fragment>
        );
      })}
      <View className="h-6" />
    </ScrollView>
  );
}
