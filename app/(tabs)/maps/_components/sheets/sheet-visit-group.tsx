import { XIcon } from '@/components/icons';
import { RestaurantIcon } from '@/components/icons/map';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { VisitedPlace } from '@/hooks/use-visited-places';
import { formatMapDistance, formatVisitDate } from '@/lib/maps/format';
import { distanceMeters, type GeoPoint } from '@/lib/photo-location';
import { ChevronRight } from 'lucide-react-native';
import * as React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

// 다녀온 곳 목록. 두 곳에서 쓴다
// - 지도에서 "대표 가게 외 N곳"으로 묶인 핀을 눌렀을 때: 묶인 곳을 최근 방문 순으로, 고르면 그 곳 화면으로 간다
// - "다녀온 곳 N" 버튼으로 핀을 켰을 때: 전체를 지도 가운데에서 가까운 순으로, 고르면 그 핀으로 지도를 옮긴다
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
  onSelect: (visitKey: string) => void;
  onClose: () => void;
}) {
  const sortedVisits = center
    ? [...visits].sort(
        (first, second) =>
          distanceMeters(first.candidates[0], center) - distanceMeters(second.candidates[0], center)
      )
    : visits;

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

      {sortedVisits.map((visit, index) => {
        const [nearest, ...others] = visit.candidates;
        return (
          <React.Fragment key={visit.key}>
            {index > 0 && <View className="mx-4 my-3 h-[1.5px] bg-grey-02" />}
            <TouchableOpacity
              className="flex-row items-center gap-3.5 px-4"
              activeOpacity={0.7}
              onPress={() => onSelect(visit.key)}
            >
              <View className="rounded bg-blue-05 p-2">
                <RestaurantIcon size={24} className="text-blue-15" />
              </View>
              <View className="flex-1">
                <Text className="text-black text-body04" numberOfLines={1}>
                  {others.length ? `${nearest.name} 외 ${others.length}곳` : nearest.name}
                </Text>
                <Text className="text-grey-40 text-caption02">
                  {[
                    formatVisitDate(visit.lastVisitAt),
                    `사진 ${visit.photoIds.length}장`,
                    center && formatMapDistance(distanceMeters(nearest, center)),
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
