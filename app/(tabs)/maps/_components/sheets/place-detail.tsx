import { ArrowDownIcon, ArrowRightIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import type { MyeongjiPlace, OperatingStatus } from '@/lib/maps/places';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { FavoriteIcon, InfoIcon, MapIcon } from '@/components/icons/map';

const STATUS_COLOR: Record<OperatingStatus, string> = {
  '곧 운영 시작': 'text-blue-35',
  운영중: 'text-[#34AA6F]',
  '곧 운영 종료': 'text-[#EDAE26]',
  '운영 종료': 'text-error',
  '24시간 운영': 'text-blue-35',
  휴무: 'text-grey-40',
};

export default function PlaceDetailSheet({
  place,
  selectedFacility,
}: {
  place: MyeongjiPlace;
  selectedFacility?: MyeongjiPlace;
}) {
  const hasFacilities = place.facilities.length > 0;

  return (
    <View>
      <View className="flex-row gap-3.5 px-4">
        <View className="rounded bg-blue-05 p-2">
          <place.Icon size={28} className={place.iconClassName} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-title03 text-black" numberOfLines={1}>
            {place.name}
          </Text>
          <Text className="text-body05 text-grey-80">{place.code ?? place.categoryLabel}</Text>
        </View>
        <TouchableOpacity hitSlop={4}>
          <FavoriteIcon size={28} active={place.isFavorite} />
        </TouchableOpacity>
      </View>

      <View className="mt-2.5 gap-0.5 px-4">
        <View className="flex-row items-center gap-1.5">
          <Text className={`text-body04 ${STATUS_COLOR[place.status]}`}>{place.status}</Text>
          <View className="h-[3px] w-[3px] rounded-full bg-grey-30" />
          <Text className="text-body05 text-grey-30">{place.distance}</Text>
        </View>
        <TouchableOpacity className="flex-row items-center gap-1" hitSlop={4}>
          <InfoIcon size={16} className="text-grey-20" />
          <Text className="flex-1 text-caption02 text-grey-40" numberOfLines={1}>
            {place.operationHours}
          </Text>
          <ArrowDownIcon size={16} className="text-grey-20" />
        </TouchableOpacity>
      </View>

      <View className="mt-2 px-4">
        <Image
          source={{ uri: place.imageUrl ?? `https://picsum.photos/seed/${place.id}/480/240` }}
          className="h-[200px] w-full rounded-lg bg-grey-10"
        />
      </View>

      {hasFacilities && (
        <ScrollView
          className="mt-4"
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
        >
          <TouchableOpacity
            className="w-16 items-center rounded-sm bg-blue-02 px-0.5 py-1.5"
            hitSlop={3}
          >
            <MapIcon size={28} className="text-blue-20" />
            <Text className="text-caption05 text-blue-35">ALL</Text>
          </TouchableOpacity>
          {place.facilities.map((facility) => (
            <TouchableOpacity
              key={facility.id}
              className="w-16 items-center rounded-sm px-0.5 py-1.5"
              hitSlop={3}
            >
              <facility.Icon size={28} className="text-grey-30" />
              <Text className="text-caption05 text-grey-30" numberOfLines={1}>
                {facility.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {place.notice && (
        <View className="mx-4 mt-4 rounded-xl bg-blue-02 px-4 py-3">
          <Text className="text-body05 text-grey-80">{place.notice}</Text>
        </View>
      )}

      {selectedFacility && (
        <View className="mx-4 mt-3 rounded-xl border border-blue-05 bg-white px-4 py-3">
          <Text className="text-caption01 text-blue-35">선택한 장소</Text>
          <View className="mt-1 flex-row items-center gap-2">
            <selectedFacility.Icon size={20} className={selectedFacility.iconClassName} />
            <View className="min-w-0 flex-1">
              <Text className="text-body04 text-black" numberOfLines={1}>
                {selectedFacility.name}
              </Text>
              <Text className="text-caption02 text-grey-40" numberOfLines={1}>
                {selectedFacility.location}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View className="gap-3 p-4">
        {place.floors.map((floorInfo) => (
          <View key={floorInfo.floor} className="flex-row gap-2 rounded-xl bg-grey-02 px-4 py-5">
            <Text className="w-8 text-body04 text-blue-35">{floorInfo.floor}</Text>
            <Text className="flex-1 text-body05 text-black">{floorInfo.description}</Text>
            <TouchableOpacity hitSlop={8} className="self-center">
              <ArrowRightIcon size={20} className="text-grey-20" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}
