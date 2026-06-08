import { Text } from '@/components/ui/text';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { ArrowDownIcon, ArrowRightIcon } from '@/components/icons';
import CertificateKioskIcon from '../icons/certificate-kiosk';
import { BuildingIcon, FavoriteIcon, InfoIcon, MailIcon, MapIcon, ParkingIcon } from '../icons';

export default function PlaceDetailSheet() {
  return (
    <ScrollView>
      <View>
        <View className="flex-row gap-3.5 px-4">
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
        <View className="mt-2.5 gap-0.5 px-4">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-body04 text-blue-35">곧 운영 시작 (영업 시작 30분 전)</Text>
            <View className="h-[3px] w-[3px] rounded-full bg-grey-30" />
            <Text className="text-body05 text-grey-30">720m</Text>
          </View>
          <TouchableOpacity className="flex-row items-center gap-1" hitSlop={4}>
            <InfoIcon size={16} className="text-grey-20" />
            <Text className="text-caption02 text-grey-40">주차요금 정보가 표시됩니다</Text>
            <ArrowDownIcon size={16} className="text-grey-20" />
          </TouchableOpacity>
        </View>

        {/* 썸네일 */}
        <View className="mt-2 px-4">
          <View className="h-[200px] rounded-lg bg-grey-10" />
        </View>

        {/* 카테고리 리스트*/}
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
          <TouchableOpacity className="w-16 items-center rounded-sm px-0.5 py-1.5" hitSlop={3}>
            <CertificateKioskIcon size={28} className="text-grey-30" />
            <Text className="text-caption05 text-grey-30">증명발급기</Text>
          </TouchableOpacity>
          <TouchableOpacity className="w-16 items-center rounded-sm px-0.5 py-1.5" hitSlop={3}>
            <MailIcon size={28} className="text-grey-30" />
            <Text className="text-caption05 text-grey-30">우편</Text>
          </TouchableOpacity>
          <TouchableOpacity className="w-16 items-center rounded-sm px-0.5 py-1.5" hitSlop={3}>
            <ParkingIcon size={28} className="text-grey-30" />
            <Text className="text-caption05 text-grey-30">주차장</Text>
          </TouchableOpacity>
          <TouchableOpacity className="w-16 items-center rounded-sm px-0.5 py-1.5" hitSlop={3}>
            <CertificateKioskIcon size={28} className="text-grey-30" />
            <Text className="text-caption05 text-grey-30">증명발급기</Text>
          </TouchableOpacity>
          <TouchableOpacity className="w-16 items-center rounded-sm px-0.5 py-1.5" hitSlop={3}>
            <MailIcon size={28} className="text-grey-30" />
            <Text className="text-caption05 text-grey-30">우편</Text>
          </TouchableOpacity>
          <TouchableOpacity className="w-16 items-center rounded-sm px-0.5 py-1.5" hitSlop={3}>
            <ParkingIcon size={28} className="text-grey-30" />
            <Text className="text-caption05 text-grey-30">주차장</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 시설 상세 정보 리스트 */}
        <View className="gap-4 p-4">
          <View className="flex-row gap-2 rounded-xl bg-grey-02 px-4 py-5">
            <Text className="text-body04 text-blue-35">1F</Text>
            <Text className="flex-1 text-body05 text-black">
              주차장, 편의점, 대문, 증명서 자동발급기, 이것, 저것, 오민식, 젤리발급기, 박재욱,
              김현빈, 이유라, 김민지, 홍길동, 김철수, 박영희, 김영희, 박철수, 김민수, 박민수,
              김영수, 박영수, 김철희, 박철희
            </Text>
            <TouchableOpacity hitSlop={8} className="self-center">
              <ArrowRightIcon size={20} className="text-grey-20" />
            </TouchableOpacity>
          </View>
          <View className="flex-row gap-2 rounded-xl bg-grey-02 px-4 py-5">
            <Text className="text-body04 text-blue-35">2F</Text>
            <Text className="flex-1 text-body05 text-black">
              주차장, 편의점, 대문, 증명서 자동발급기, 이것, 저것, 오민식, 젤리발급기, 박재욱,
              김현빈, 이유라, 김민지, 홍길동, 김철수, 박영희, 김영희, 박철수, 김민수, 박민수,
              김영수, 박영수, 김철희, 박철희
            </Text>
            <TouchableOpacity hitSlop={8} className="self-center">
              <ArrowRightIcon size={20} className="text-grey-20" />
            </TouchableOpacity>
          </View>
          <View className="flex-row gap-2 rounded-xl bg-grey-02 px-4 py-5">
            <Text className="text-body04 text-blue-35">3F</Text>
            <Text className="flex-1 text-body05 text-black">
              주차장, 편의점, 대문, 증명서 자동발급기, 이것, 저것, 오민식, 젤리발급기, 박재욱,
              김현빈, 이유라, 김민지, 홍길동, 김철수, 박영희, 김영희, 박철수, 김민수, 박민수,
              김영수, 박영수, 김철희, 박철희
            </Text>
            <TouchableOpacity hitSlop={8} className="self-center">
              <ArrowRightIcon size={20} className="text-grey-20" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
