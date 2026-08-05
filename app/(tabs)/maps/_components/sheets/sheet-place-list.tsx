import { MapCategoryPin } from '@/api/maps';
import { BuildingIcon, FavoriteIcon } from '@/components/icons/map';
import { XIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { useToggleMapFavorite } from '@/hooks/useToggleMapFavorite';
import { ComponentType, Fragment } from 'react';
import { ActivityIndicator, Image, ScrollView, TouchableOpacity, View } from 'react-native';
import CATEGORIES from '../../_constants/category-data';

interface PlaceListSheetProps {
  places: MapCategoryPin[];
  onPlacePress?: (place: MapCategoryPin) => void;
  isFetchingNextPage?: boolean;
  onClose?: () => void;
}

// 칩의 카테고리 코드로 아이콘 조회 (일치하는 칩이 없으면 기본 건물 아이콘 사용)
function resolvePlaceIcon(categoryCode: string): {
  Icon: ComponentType<{ size?: number; className?: string }>;
  iconClassName: string;
} {
  for (const category of CATEGORIES) {
    const chip = category.chips.find((c) => c.id === categoryCode);
    if (chip) return { Icon: chip.Icon, iconClassName: category.iconClassName };
  }

  return { Icon: BuildingIcon, iconClassName: 'text-blue-15' };
}

// 장소 목록 표시 시트
export default function PlaceListSheet({
  places,
  onPlacePress,
  isFetchingNextPage,
  onClose,
}: PlaceListSheetProps) {
  const toggleFavorite = useToggleMapFavorite();

  if (places.length === 0) {
    return (
      <View>
        <View className="flex-row justify-end px-4">
          <TouchableOpacity
            hitSlop={4}
            onPress={onClose}
            className="h-7 w-7 items-center justify-center rounded-full bg-grey-02"
          >
            <XIcon size={14} className="text-grey-30" />
          </TouchableOpacity>
        </View>
        <View className="items-center px-4 py-10">
          <Text className="text-body04 text-grey-40">표시할 장소가 없습니다.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView>
      <View className="flex-row justify-end px-4">
        <TouchableOpacity
          hitSlop={4}
          onPress={onClose}
          className="h-7 w-7 items-center justify-center rounded-full bg-grey-02"
        >
          <XIcon size={14} className="text-grey-30" />
        </TouchableOpacity>
      </View>
      {places.map((place, index) => {
        const { Icon, iconClassName } = resolvePlaceIcon(place.categoryCode);

        return (
          <Fragment key={place.id}>
            {index > 0 && <View className="m-4 h-[1.5px] bg-grey-02" />}
            <TouchableOpacity
              className="px-4"
              activeOpacity={0.7}
              disabled={!onPlacePress}
              onPress={() => onPlacePress?.(place)}
            >
              <View className="flex-row items-center gap-3.5">
                <View className="rounded bg-blue-05 p-2">
                  <Icon size={28} className={iconClassName} />
                </View>
                <View className="flex-1">
                  <Text className="text-title03 text-black">{place.name}</Text>
                  {(place.classroomCode ?? place.location) && (
                    <Text className="text-body05 text-grey-80">
                      {place.classroomCode ?? place.location}
                    </Text>
                  )}
                </View>
                <TouchableOpacity hitSlop={4} onPress={() => toggleFavorite(place.id)}>
                  <FavoriteIcon size={28} active={place.favorite} />
                </TouchableOpacity>
              </View>
              {(place.operatingStatus || place.distanceMeters !== null) && (
                <View className="mt-2.5 flex-row items-center gap-1.5">
                  {place.operatingStatus && (
                    <Text className="text-body04 text-blue-35">{place.operatingStatus}</Text>
                  )}
                  {place.operatingStatus && place.distanceMeters !== null && (
                    <View className="h-[3px] w-[3px] rounded-full bg-grey-30" />
                  )}
                  {place.distanceMeters !== null && (
                    <Text className="text-body05 text-grey-30">{place.distanceMeters}m</Text>
                  )}
                </View>
              )}
              {place.imageUrl && (
                <Image
                  source={{ uri: place.imageUrl }}
                  className="mt-2 h-[200px] rounded-lg"
                  resizeMode="cover"
                />
              )}
            </TouchableOpacity>
          </Fragment>
        );
      })}
      {isFetchingNextPage && (
        <View className="items-center py-4">
          <ActivityIndicator />
        </View>
      )}
    </ScrollView>
  );
}
