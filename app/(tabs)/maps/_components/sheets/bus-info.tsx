import { Text } from '@/components/ui/text';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { BusIcon, FavoriteIcon } from '../icons';

export default function BusInfoSheet() {
  // 버스 즐겨찾기 추가 핸들러
  function handleAddFavorite() {}

  return (
    <ScrollView>
      <View className="gap-3.5 px-4">
        {/* 헤더 */}
        <View className="flex-row items-center gap-2">
          <Text className="text-title03 text-black">명지대</Text>
          <Text className="text-body05 text-grey-80">DMC센트럴아이파크아파트 방면</Text>
        </View>

        {/* 버스 도착 정보 */}
        <View className="flex-row items-center gap-2.5">
          <TouchableOpacity onPress={handleAddFavorite} hitSlop={4}>
            <FavoriteIcon size={28} />
          </TouchableOpacity>
          <View className="flex-1 flex-row items-center gap-2">
            <BusIcon size={24} className="text-blue-20" />
            <View>
              <Text className="text-body02 text-black">버스 번호</Text>
              <Text className="text-caption04 text-grey-30">막차 정보</Text>
            </View>

            {/* 도착 정보 있는 경우 */}
            <View className="ml-auto items-end gap-0.5">
              <View className="flex-row items-center gap-2">
                <Text className="text-caption01 text-blue-35">남은시간1</Text>
                <Text className="text-caption02 text-grey-30">n정류장 전 1</Text>
                <View className="rounded bg-[#EDAE26]/20 px-1">
                  <Text className="text-caption05 text-[#EDAE26]">보통</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-caption01 text-blue-35">남은시간2</Text>
                <Text className="text-caption02 text-grey-30">n정류장 전 2</Text>
                <View className="rounded bg-[#F45353]/20 px-1">
                  <Text className="text-caption05 text-error">혼잡</Text>
                </View>
              </View>
            </View>

            {/* 도착 정보 없는 경우 */}
            {/* <Text className="text-caption01 text-grey-40">도착 예정 정보 없음</Text> */}
          </View>
        </View>

        {/* 구분선 */}
        <View className="h-[1.5px] bg-grey-02" />

        {/* 버스 도착 정보 */}
        <View className="flex-row items-center gap-2.5">
          <TouchableOpacity onPress={handleAddFavorite} hitSlop={4}>
            <FavoriteIcon size={28} />
          </TouchableOpacity>
          <View className="flex-1 flex-row items-center gap-2">
            <BusIcon size={24} className="text-blue-20" />
            <View>
              <Text className="text-body02 text-black">버스 번호</Text>
              <Text className="text-caption04 text-grey-30">막차 정보</Text>
            </View>

            {/* 도착 정보 있는 경우 */}
            <View className="ml-auto items-end gap-0.5">
              <View className="flex-row items-center gap-2">
                <Text className="text-caption01 text-blue-35">남은시간1</Text>
                <Text className="text-caption02 text-grey-30">n정류장 전 1</Text>
                <View className="rounded bg-[#EDAE26]/20 px-1">
                  <Text className="text-caption05 text-[#EDAE26]">보통</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-caption01 text-blue-35">남은시간2</Text>
                <Text className="text-caption02 text-grey-30">n정류장 전 2</Text>
                <View className="rounded bg-blue-05 px-1">
                  <Text className="text-caption05 text-blue-35">여유</Text>
                </View>
              </View>
            </View>

            {/* 도착 정보 없는 경우 */}
            {/* <Text className="text-caption01 text-grey-40">도착 예정 정보 없음</Text> */}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
