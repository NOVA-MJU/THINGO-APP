import { Text } from '@/components/ui/text';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { BuildingIcon, FavoriteIcon } from '@/components/icons/map';

export default function PlaceListSheet() {
  return (
    <ScrollView>
      {/* 아이템 - 썸네일 있음 */}
      <View className="px-4">
        <View className="flex-row items-center gap-3.5">
          <View className="rounded bg-blue-05 p-2">
            <BuildingIcon size={28} className="text-blue-15" />
          </View>
          <View className="flex-1">
            <Text className="text-title03 text-black">종합관(구 본관)</Text>
            <Text className="text-body05 text-grey-80">S1XXX</Text>
          </View>
          <TouchableOpacity hitSlop={4}>
            <FavoriteIcon size={28} />
          </TouchableOpacity>
        </View>
        <View className="mt-2.5 flex-row items-center gap-1.5">
          <Text className="text-body04 text-blue-35">곧 운영 시작 (영업 시작 30분 전)</Text>
          <View className="h-[3px] w-[3px] rounded-full bg-grey-30" />
          <Text className="text-body05 text-grey-30">720m</Text>
        </View>
        <View className="mt-2 h-[200px] rounded-lg bg-grey-10" />
      </View>

      {/* 구분선 */}
      <View className="m-4 h-[1.5px] bg-grey-02" />

      {/* 아이템 - 썸네일 없음 */}
      <View className="px-4">
        <View className="flex-row items-center gap-3.5">
          <View className="rounded bg-blue-05 p-2">
            <BuildingIcon size={28} className="text-blue-15" />
          </View>
          <View className="flex-1">
            <Text className="text-title03 text-black">종합관(구 본관)</Text>
            <Text className="text-body05 text-grey-80">S1XXX</Text>
          </View>
          <TouchableOpacity hitSlop={4}>
            <FavoriteIcon size={28} active />
          </TouchableOpacity>
        </View>
        <View className="mt-2.5 flex-row items-center gap-1.5">
          <Text className="text-body04 text-blue-35">운영중</Text>
          <View className="h-[3px] w-[3px] rounded-full bg-grey-30" />
          <Text className="text-body05 text-grey-30">720m</Text>
        </View>
      </View>
    </ScrollView>
  );
}
