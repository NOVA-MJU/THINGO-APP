import { getBuildingDetail, getBuildings } from '@/api/maps';
import { SearchIcon, ThingoLogoSmall } from '@/components/icons';
import { NaverMap, NaverMapHandle } from '@/components/naver-map';
import { Text } from '@/components/ui/text';
import { BUS_STOPS, type BusStopStation } from '@/lib/maps/bus-stops';
import { findPlaceById } from '@/lib/maps/places';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { Alert, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BuildingDetailSheet from './_components/sheets/sheet-building-detail';
import BusInfoSheet from './_components/sheets/bus-info';
import CategoryList from './_components/sheets/sheet-category';
import PlaceDetailSheet from './_components/sheets/place-detail';
import SheetHandle from './_components/sheets/sheet-handle';
import CATEGORIES from './_constants/category-data';
import { CurrentLocationIcon, MoreIcon, StarIcon } from '@/components/icons/map';

const QUICK_CHIP_IDS = ['bus', 'daedong', 'printer', 'lounge', 'bank'];

const CAMPUS_LATITUDE = 37.579711;
const CAMPUS_LONGITUDE = 126.923186;

const QUICK_CHIPS = CATEGORIES.flatMap((c) =>
  c.chips.map((chip) => ({ ...chip, iconClassName: c.iconClassName }))
)
  .filter((chip) => QUICK_CHIP_IDS.includes(chip.id))
  .sort((a, b) => QUICK_CHIP_IDS.indexOf(a.id) - QUICK_CHIP_IDS.indexOf(b.id));

const SNAP_POINTS = ['10%', '50%', '100%'];

export default function MapsScreen() {
  const router = useRouter();
  const { exactMatch, expanded, facilityId, placeId } = useLocalSearchParams<{
    exactMatch?: string;
    expanded?: string;
    facilityId?: string;
    placeId?: string;
  }>();
  const insets = useSafeAreaInsets();
  const [selectedPlaceId, setSelectedPlaceId] = React.useState<string | null>(null);
  const [selectedFacilityId, setSelectedFacilityId] = React.useState<string | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = React.useState<number | null>(null);
  const [selectedSheetMode, setSelectedSheetMode] = React.useState<'category' | 'bus' | 'building'>(
    'category'
  );
  const [selectedStation, setSelectedStation] = React.useState<BusStopStation | null>(null);
  const mapRef = React.useRef<NaverMapHandle>(null);
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const selectedPlace = findPlaceById(selectedPlaceId);
  const selectedFacility = findPlaceById(selectedFacilityId);

  // 캠퍼스 건물 목록 조회
  const { data: buildings = [] } = useQuery({
    queryKey: ['map-buildings', CAMPUS_LATITUDE, CAMPUS_LONGITUDE],
    queryFn: () => getBuildings(CAMPUS_LATITUDE, CAMPUS_LONGITUDE),
  });

  // 캠퍼스 건물 상세 조회
  const { data: selectedBuildingDetail } = useQuery({
    queryKey: ['map-building-detail', selectedBuildingId],
    queryFn: () => getBuildingDetail(selectedBuildingId!, CAMPUS_LATITUDE, CAMPUS_LONGITUDE),
    enabled: selectedBuildingId !== null,
  });

  // 캠퍼스 건물 마커
  const buildingMarkers = React.useMemo(
    () =>
      buildings.map((building) => ({
        id: String(building.id),
        latitude: building.latitude,
        longitude: building.longitude,
      })),
    [buildings]
  );

  React.useEffect(() => {
    const nextPlace = findPlaceById(placeId);
    if (!nextPlace) return;

    setSelectedSheetMode('category');
    setSelectedPlaceId(nextPlace.id);
    setSelectedFacilityId(Array.isArray(facilityId) ? facilityId[0] : (facilityId ?? null));
    setSelectedBuildingId(null);
    mapRef.current?.animateCameraTo(nextPlace.latitude, nextPlace.longitude, 17);
    bottomSheetRef.current?.snapToIndex(expanded === 'true' ? 2 : 1);
  }, [expanded, exactMatch, facilityId, placeId]);

  // 캠퍼스 건물 마커 클릭
  function onBuildingMarkerPress(id: string) {
    const building = buildings.find((b) => String(b.id) === id);
    if (!building) return;

    setSelectedPlaceId(null);
    setSelectedFacilityId(null);
    setSelectedSheetMode('building');
    setSelectedBuildingId(building.id);
    mapRef.current?.animateCameraTo(building.latitude, building.longitude, 17);
    bottomSheetRef.current?.snapToIndex(1);
  }

  // 버스 정류장 마커 클릭
  function onBusStopMarkerPress(id: string) {
    const busStop = BUS_STOPS.find((s) => s.id === id);
    if (!busStop) return;

    setSelectedPlaceId(null);
    setSelectedFacilityId(null);
    setSelectedBuildingId(null);
    setSelectedSheetMode('bus');
    setSelectedStation(busStop.station);
    mapRef.current?.animateCameraTo(busStop.latitude, busStop.longitude);
    bottomSheetRef.current?.snapToIndex(1);
  }

  // 검색 버튼 클릭
  function onSearchButtonPress() {
    router.push('/maps/search');
  }

  function onQuickChipPress(chipId: string) {
    // 버스 정류장 칩 클릭
    if (chipId === 'bus') {
      setSelectedPlaceId(null);
      setSelectedFacilityId(null);
      setSelectedBuildingId(null);
      setSelectedSheetMode('bus');
      setSelectedStation('A');
      const stationA = BUS_STOPS.find((s) => s.station === 'A');
      if (stationA) mapRef.current?.animateCameraTo(stationA.latitude, stationA.longitude);
      bottomSheetRef.current?.snapToIndex(1);
      return;
    }

    setSelectedBuildingId(null);
    setSelectedSheetMode('category');
    bottomSheetRef.current?.snapToIndex(1);
  }

  // 현위치 찾기 버튼 클릭 (native 전용)
  async function onCurrentLocationPress() {
    if (Platform.OS === 'web') return;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      Alert.alert('위치 서비스 비활성화', '기기의 위치 서비스를 켜주세요.');
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      mapRef.current?.animateCameraTo(location.coords.latitude, location.coords.longitude, 16);
    } catch {
      Alert.alert('위치 오류', '현재 위치를 가져올 수 없습니다.');
    }
  }

  // 더보기 버튼 클릭 (카테고리 시트 표시)
  function handleMoreCategories() {
    setSelectedSheetMode('category');
    setSelectedPlaceId(null);
    setSelectedFacilityId(null);
    setSelectedBuildingId(null);
    bottomSheetRef.current?.snapToIndex(1);
  }

  // 바텀 시트 렌더링
  function renderBottomSheetContent() {
    if (selectedPlace) {
      return <PlaceDetailSheet place={selectedPlace} selectedFacility={selectedFacility} />;
    }

    if (selectedSheetMode === 'bus' && selectedStation) {
      return <BusInfoSheet station={selectedStation} />;
    }

    if (selectedSheetMode === 'building' && selectedBuildingDetail) {
      return <BuildingDetailSheet building={selectedBuildingDetail} />;
    }

    return <CategoryList onChipPress={onQuickChipPress} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {/* 네이버 지도 */}
      <NaverMap
        ref={mapRef}
        initialLatitude={CAMPUS_LATITUDE}
        initialLongitude={CAMPUS_LONGITUDE}
        initialZoom={16}
        busStopMarkers={BUS_STOPS}
        buildingMarkers={buildingMarkers}
        onBusStopMarkerPress={onBusStopMarkerPress}
        onBuildingMarkerPress={onBuildingMarkerPress}
      />

      {/* 플로팅 헤더 */}
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top + 8 }}
        className="gap-2"
      >
        <View className="h-[60px]">
          {/* 검색바 행 */}
          <View className="flex-row gap-2 px-4 pb-2 pt-4">
            {/* 검색바 */}
            <View
              className="flex-1 flex-row items-center gap-1 rounded-xl bg-white px-3 py-[5px]"
              style={{
                boxShadow: '0px 2px 6px rgba(23,23,27,0.15), 0px 1px 4px rgba(23,23,27,0.15)',
              }}
            >
              <TouchableOpacity onPress={router.back} hitSlop={4}>
                <ThingoLogoSmall size={32} />
              </TouchableOpacity>
              <TouchableOpacity className="flex-1" onPress={onSearchButtonPress} hitSlop={4}>
                <Text className="text-body05 text-grey-20">건물명, 강의실 코드를 검색해보세요</Text>
              </TouchableOpacity>
              <SearchIcon size={24} className="text-grey-40" />
            </View>

            {/* 즐겨찾기 버튼 */}
            <View
              className="rounded-md bg-blue-35"
              style={{
                boxShadow: '0px 2px 6px rgba(23,23,27,0.15), 0px 1px 4px rgba(23,23,27,0.15)',
              }}
            >
              <TouchableOpacity className="items-center gap-[1px] px-1.5 py-[2.5px]" hitSlop={4}>
                <StarIcon size={24} className="text-blue-05" />
                <Text className="text-caption05 text-blue-05" style={{ fontSize: 9 }}>
                  즐겨찾기
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 필터 칩 */}
        <View className="flex-row items-center">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="flex-row gap-1 py-2 px-4"
            className="flex-1"
          >
            {QUICK_CHIPS.map((chip) => (
              <View
                key={chip.id}
                className="rounded-full border border-white bg-white"
                style={{
                  shadowColor: '#17171B',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <TouchableOpacity
                  onPress={() => onQuickChipPress(chip.id)}
                  className="flex-row items-center gap-0.5 py-1.5 pe-2 ps-1.5"
                  hitSlop={2}
                >
                  <chip.Icon size={20} className={chip.iconClassName} />
                  <Text className="text-caption02 text-black">{chip.label}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* 더보기 버튼 */}
          <View className="py-2 pe-4 ps-1.5">
            <View
              className="rounded-full bg-blue-02"
              style={{
                boxShadow: '0px 2px 6px rgba(23,23,27,0.15), 0px 1px 4px rgba(23,23,27,0.15)',
              }}
            >
              <TouchableOpacity onPress={handleMoreCategories} hitSlop={8} className="p-1">
                <MoreIcon size={24} className="text-blue-15" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* 현위치 버튼 */}
      {Platform.OS !== 'web' && (
        <TouchableOpacity
          onPress={onCurrentLocationPress}
          className="h-12 w-12 items-center justify-center rounded-full bg-white"
          style={{
            position: 'absolute',
            bottom: insets.bottom + 64,
            right: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <CurrentLocationIcon size={28} className="text-blue-35" />
        </TouchableOpacity>
      )}

      {/* 바텀시트 */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={SNAP_POINTS}
        handleComponent={SheetHandle}
        topInset={insets.top}
      >
        <BottomSheetScrollView>{renderBottomSheetContent()}</BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}
