import { Text } from '@/components/ui/text';
import * as React from 'react';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { ArrowDownIcon, ArrowRightIcon } from '@/components/icons';
import {
  BankIcon,
  BreakRoomIcon,
  BuildingIcon,
  BuildingEntranceIcon,
  BusIcon,
  CafeIcon,
  CafeteriaIcon,
  CampusIcon,
  CampusEntranceIcon,
  CartIcon,
  CertificateKioskIcon,
  ClubRoomIcon,
  ConvenienceStoreIcon,
  CorridorIcon,
  CurrentLocationIcon,
  DaedongIcon,
  FavoriteIcon,
  GymIcon,
  InfoIcon,
  LoungeIcon,
  MailIcon,
  MapIcon,
  MoreIcon,
  MyeongwolIcon,
  ParkingIcon,
  PinIcon,
  PowerBankIcon,
  PrinterIcon,
  ReadingRoomIcon,
  RestaurantIcon,
  RestroomIcon,
  ShortcutIcon,
  SmokingIcon,
  StarIcon,
  StudyRoomIcon,
  TerraceIcon,
  TruckIcon,
} from '@/components/icons/map';
import type { MapBuildingDetail } from '@/api/maps';
import { formatMapFloorLabel } from '@/lib/maps/format';
import { cn } from '@/lib/utils';
import { useToggleMapFavorite } from '@/hooks/useToggleMapFavorite';

type MapIconComponent = React.ComponentType<{ size?: number; className?: string }>;

const MAP_ICONS: Record<string, MapIconComponent> = {
  BankIcon,
  BreakRoomIcon,
  BuildingIcon,
  BuildingEntranceIcon,
  BusIcon,
  CafeIcon,
  CafeteriaIcon,
  CampusIcon,
  CampusEntranceIcon,
  CartIcon,
  CertificateKioskIcon,
  ClubRoomIcon,
  ConvenienceStoreIcon,
  CorridorIcon,
  CurrentLocationIcon,
  DaedongIcon,
  FavoriteIcon,
  GymIcon,
  InfoIcon,
  LoungeIcon,
  MailIcon,
  MapIcon,
  MoreIcon,
  MyeongwolIcon,
  ParkingIcon,
  PinIcon,
  PowerBankIcon,
  PrinterIcon,
  ReadingRoomIcon,
  RestaurantIcon,
  RestroomIcon,
  ShortcutIcon,
  SmokingIcon,
  StarIcon,
  StudyRoomIcon,
  TerraceIcon,
  TruckIcon,
};

function resolveMapIcon(iconKey: string | null): MapIconComponent {
  if (iconKey && iconKey in MAP_ICONS) return MAP_ICONS[iconKey];
  return MapIcon;
}

// 명지대학교 캠퍼스 건물 전용 상세 보기 시트
export default function BuildingDetailSheet({ building }: { building: MapBuildingDetail }) {
  const [selectedCategoryCode, setSelectedCategoryCode] = React.useState<string | null>(null);
  const toggleFavorite = useToggleMapFavorite();

  const HeaderIcon = resolveMapIcon(building.iconKey);
  const statusLabel = building.operatingStatus ?? '운영 정보가 없습니다';
  const statusColor = building.operatingStatus ? 'text-blue-35' : 'text-grey-40';

  return (
    <ScrollView>
      <View>
        <View className="flex-row gap-3.5 px-4">
          <View className="rounded bg-blue-05 p-2">
            <HeaderIcon size={28} className="text-blue-15" />
          </View>
          <View className="flex-1">
            <Text className="text-title03 text-black">{building.name}</Text>
            {building.classroomCode && (
              <Text className="text-body05 text-grey-80">{building.classroomCode}</Text>
            )}
          </View>
          <TouchableOpacity hitSlop={4} onPress={() => toggleFavorite(building.id)}>
            <FavoriteIcon size={28} active={building.favorite} />
          </TouchableOpacity>
        </View>
        <View className="mt-2.5 gap-0.5 px-4">
          <View className="flex-row items-center gap-1.5">
            <Text className={`text-body04 ${statusColor}`}>{statusLabel}</Text>
            {building.infoText && (
              <Text className="text-body05 text-grey-40">{building.infoText}</Text>
            )}
          </View>
          <TouchableOpacity className="flex-row items-center gap-1" hitSlop={4}>
            <InfoIcon size={16} className="text-grey-20" />
            <Text className="text-caption02 text-grey-40">주차요금 정보가 표시됩니다</Text>
            <ArrowDownIcon size={16} className="text-grey-20" />
          </TouchableOpacity>
        </View>

        {/* 썸네일 */}
        <View className="mt-2 px-4">
          {building.imageUrl ? (
            <Image
              source={{ uri: building.imageUrl }}
              className="h-[200px] w-full rounded-lg bg-grey-10"
            />
          ) : (
            <View className="h-[200px] rounded-lg bg-grey-10" />
          )}
        </View>

        {/* 시설 필터 버튼 */}
        <ScrollView
          className="mt-4"
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
        >
          <TouchableOpacity
            className={cn(
              'w-16 items-center rounded-sm px-0.5 py-1.5',
              selectedCategoryCode === null && 'bg-blue-02'
            )}
            hitSlop={3}
            onPress={() => setSelectedCategoryCode(null)}
          >
            <MapIcon
              size={28}
              className={selectedCategoryCode === null ? 'text-blue-20' : 'text-grey-30'}
            />
            <Text
              className={cn(
                'text-caption05',
                selectedCategoryCode === null ? 'text-blue-35' : 'text-grey-30'
              )}
            >
              ALL
            </Text>
          </TouchableOpacity>
          {building.categoryTabs.map((tab) => {
            const TabIcon = resolveMapIcon(tab.iconKey);
            const active = selectedCategoryCode === tab.code;

            return (
              <TouchableOpacity
                key={tab.code}
                className={cn('w-16 items-center rounded-sm px-0.5 py-1.5', active && 'bg-blue-02')}
                hitSlop={3}
                onPress={() => setSelectedCategoryCode(tab.code)}
              >
                <TabIcon size={28} className={active ? 'text-blue-20' : 'text-grey-30'} />
                <Text
                  className={cn('text-caption05', active ? 'text-blue-35' : 'text-grey-30')}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 층별 시설 리스트 (필터 선택한 경우 해당 시설이 포함된 층만 필터링) */}
        <View className="gap-4 p-4">
          {building.floors.map((floor) => {
            const places = selectedCategoryCode
              ? floor.places.filter((place) => place.categoryCode === selectedCategoryCode)
              : floor.places;

            if (places.length === 0) return null;

            return (
              <View key={floor.floorId} className="flex-row gap-2 rounded-xl bg-grey-02 px-4 py-5">
                <Text className="text-body04 text-blue-35">
                  {formatMapFloorLabel(floor.floorLabel)}
                </Text>
                <Text className="flex-1 text-body05 text-black">
                  {places.map((place) => place.name).join(', ')}
                </Text>
                <TouchableOpacity hitSlop={8} className="self-center">
                  <ArrowRightIcon size={20} className="text-grey-20" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}
