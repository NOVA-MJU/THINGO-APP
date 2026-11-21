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

// "다녀온 곳 N" 버튼으로 핀을 켰을 때 뜨는 전체 목록. 지도 핀과 같이 건물 하나가 한 줄이고,
// 가게 이름 대신 최근 사진과 사진 수·날짜·거리를 보여준다 (어느 가게인지는 핀 시트에서 사진을 보고 고른다).
// 지도 가운데에서 가까운 순이고, 고르면 그 핀으로 지도를 옮긴다 (핀을 누르면 sheet-visit-candidates.tsx가 뜬다)
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
                {`사진 ${visit.photos.length}장`}
              </Text>
              <Text className="text-grey-40 text-caption02" numberOfLines={1}>
                {[
                  visit.address?.replace(/^서울\s+\S+구\s+/, ''),
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

function LatestPhoto({ id }: { id: string }) {
  const uri = useLibraryPhotoUri(id);
  return (
    <View className="h-11 w-11 overflow-hidden rounded-lg bg-grey-10">
      {uri && <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />}
    </View>
  );
}
