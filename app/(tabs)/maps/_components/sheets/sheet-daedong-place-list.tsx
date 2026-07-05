import { MapCategoryPin } from '@/api/maps';
import { FavoriteIcon, MyeongwolIcon, RestaurantIcon } from '@/components/icons/map';
import { Text } from '@/components/ui/text';
import { Fragment } from 'react';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';

interface DaedongPlaceListSheetProps {
  places: MapCategoryPin[];
}

// 대동명지도 목록 표시 시트
export default function DaedongPlaceListSheet({ places }: DaedongPlaceListSheetProps) {
  return (
    <ScrollView>
      <View className="flex-row items-center px-4">
        <Text className="text-title03 text-black">대동명지도</Text>
        <Text className="me-1 ms-3 text-body05 text-grey-80">by 명월</Text>
        <MyeongwolIcon size={24} />
      </View>
      <View className="py-2.5">
        <View className="h-1 bg-grey-02" />
      </View>

      {places.length === 0 ? (
        <View className="items-center px-4 py-10">
          <Text className="text-body04 text-grey-40">표시할 장소가 없습니다.</Text>
        </View>
      ) : (
        places.map((place, index) => (
          <Fragment key={place.id}>
            {index > 0 && <View className="m-4 h-[1.5px] bg-grey-02" />}
            <View className="px-4">
              <View className="flex-row items-center gap-3.5">
                <View className="rounded bg-blue-05 p-2">
                  <RestaurantIcon size={28} className="text-blue-15" />
                </View>
                <View className="flex-1">
                  <Text className="text-title03 text-black">{place.name}</Text>
                  {(place.classroomCode ?? place.location) && (
                    <Text className="text-body05 text-grey-80">
                      {place.classroomCode ?? place.location}
                    </Text>
                  )}
                </View>
                <TouchableOpacity hitSlop={4}>
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
            </View>
          </Fragment>
        ))
      )}
    </ScrollView>
  );
}
