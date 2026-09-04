import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Image, Pressable, ScrollView, TouchableOpacity, View } from 'react-native';
import { ArrowDownIcon, ArrowRightIcon, XIcon } from '@/components/icons';
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
import { useAuth } from '@/context/auth-context';
import { useLoginRequiredModal } from '@/context/login-required-modal-context';
import FavoriteSaveSheet, {
  type FavoriteSaveSheetHandle,
} from '@/app/(tabs)/maps/_components/sheets/favorite-save-sheet';

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
export default function BuildingDetailSheet({
  building,
  onClose,
}: {
  building: MapBuildingDetail;
  onClose?: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { showLoginRequiredModal } = useLoginRequiredModal();
  const [selectedCategoryCode, setSelectedCategoryCode] = React.useState<string | null>(null);
  const favoriteSaveSheetRef = React.useRef<FavoriteSaveSheetHandle>(null);

  // 즐겨찾기 버튼 클릭 → 기존 즉시 토글(useToggleMapFavorite) API 연결은 해제하고,
  // 그룹 선택 바텀시트를 여는 방식으로 교체 (디자인/기능 미확정 — 지금은 뼈대만 연결)
  // 로그인 안 돼 있으면 시트를 열지 않고 로그인 필요 모달을 표시
  function onFavoritePress() {
    if (!user) {
      showLoginRequiredModal();
      return;
    }
    favoriteSaveSheetRef.current?.open({ pinId: building.id, name: building.name });
  }

  // 층별 시설 리스트의 화살표 클릭 → 해당 건물/층의 층별 안내도 화면으로 이동
  // (floorLabel이 도면 파일명과 동일한 식별자라 floorId 대신 이 값을 넘긴다 — assets/map-floors 참고)
  function onFloorPress(floorLabel: string) {
    router.push({
      pathname: '/maps/floor',
      params: { buildingId: String(building.id), floorLabel },
    });
  }

  const HeaderIcon = resolveMapIcon(building.iconKey);
  const statusLabel = building.operatingStatus ?? '운영 정보가 없습니다';
  const statusColor = building.operatingStatus ? 'text-blue-35' : 'text-grey-40';

  return (
    <>
      <ScrollView>
        <View>
          <View className="flex-row gap-3.5 px-4">
            <View className="rounded bg-blue-05 p-2">
              <HeaderIcon size={28} className="text-blue-15" />
            </View>
            <View className="flex-1">
              <Text className="text-black text-title03">{building.name}</Text>
              {building.classroomCode && (
                <Text className="text-grey-80 text-body05">{building.classroomCode}</Text>
              )}
            </View>
            <TouchableOpacity hitSlop={4} onPress={onFavoritePress}>
              <FavoriteIcon size={28} active={building.favorite} />
            </TouchableOpacity>
            <TouchableOpacity
              hitSlop={4}
              onPress={onClose}
              className="h-7 w-7 items-center justify-center rounded-full bg-grey-02"
            >
              <XIcon size={14} className="text-grey-30" />
            </TouchableOpacity>
          </View>
          <View className="mt-2.5 gap-0.5 px-4">
            <View className="flex-row items-center gap-1.5">
              <Text className={`text-body04 ${statusColor}`}>{statusLabel}</Text>
              {building.infoText && (
                <Text className="text-grey-40 text-body05">{building.infoText}</Text>
              )}
            </View>
            <Pressable className="flex-row items-center gap-1" hitSlop={4}>
              <InfoIcon size={16} className="text-grey-20" />
              <Text className="text-grey-40 text-caption02">주차 정보 없음</Text>
              {/* <ArrowDownIcon size={16} className="text-grey-20" /> */}
            </Pressable>
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
                  className={cn(
                    'w-16 items-center rounded-sm px-0.5 py-1.5',
                    active && 'bg-blue-02'
                  )}
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
                <TouchableOpacity
                  key={floor.floorId}
                  accessibilityRole="button"
                  accessibilityLabel={`${formatMapFloorLabel(floor.floorLabel)} 층별 안내도 보기`}
                  className="flex-row gap-2 rounded-xl bg-grey-02 px-4 py-5"
                  onPress={() => onFloorPress(floor.floorLabel)}
                >
                  <Text className="text-blue-35 text-body04">
                    {formatMapFloorLabel(floor.floorLabel)}
                  </Text>
                  <Text className="flex-1 text-black text-body05">
                    {places.map((place) => place.name).join(', ')}
                  </Text>
                  <View className="self-center">
                    <ArrowRightIcon size={20} className="text-grey-20" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <FavoriteSaveSheet ref={favoriteSaveSheetRef} />
    </>
  );
}
