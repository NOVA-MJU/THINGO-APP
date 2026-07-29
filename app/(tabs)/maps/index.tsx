import {
  getBuildingDetail,
  getBuildings,
  getCategoryPins,
  getPlaceDetail,
  MAP_CATEGORY_PINS_PAGE_SIZE,
  type MapCategoryPin,
} from '@/api/maps';
import { SearchIcon, ThingoLogoSmall } from '@/components/icons';
import { NaverMap, NaverMapHandle, UserLocationData } from '@/components/naver-map';
import { Text } from '@/components/ui/text';
import { BUS_STOPS, type BusStopStation } from '@/lib/maps/bus-stops';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BuildingDetailSheet from './_components/sheets/sheet-building-detail';
import BusInfoSheet from './_components/sheets/bus-info';
import CategoryList from './_components/sheets/sheet-category';
import DaedongPlaceListSheet from './_components/sheets/sheet-daedong-place-list';
import PlaceDetailSheet from './_components/sheets/sheet-place-detail';
import MapSearchSummary from './_components/sheets/map-search-summary';
import PlaceListSheet from './_components/sheets/sheet-place-list';
import SheetHandle from './_components/sheets/sheet-handle';
import CATEGORIES from './_constants/category-data';
import { CurrentLocationIcon, MoreIcon, ResetIcon, StarIcon } from '@/components/icons/map';
import { useMapSearchSelection } from '@/context/map-search-selection';
import { showAlert } from '@/lib/alert';
import { getMapIconKey } from '@/lib/maps/icons';

const QUICK_CHIP_IDS = ['bus', 'daedong', 'printer', 'lounge', 'bank'];

const CAMPUS_LATITUDE = 37.579711;
const CAMPUS_LONGITUDE = 126.923186;
const CAMPUS_ZOOM = 16;

const QUICK_CHIPS = CATEGORIES.flatMap((c) =>
  c.chips.map((chip) => ({ ...chip, iconClassName: c.iconClassName }))
)
  .filter((chip) => QUICK_CHIP_IDS.includes(chip.id))
  .sort((a, b) => QUICK_CHIP_IDS.indexOf(a.id) - QUICK_CHIP_IDS.indexOf(b.id));

const SNAP_POINTS = ['10%', '50%', '100%'];
const MAP_CONTROL_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.18,
  shadowRadius: 8,
  elevation: 5,
};

export default function MapsScreen() {
  const router = useRouter();
  const { exactMatch, expanded, placeId } = useLocalSearchParams<{
    exactMatch?: string;
    expanded?: string;
    placeId?: string;
  }>();
  const { selectedSearchResult, clearSearchResult } = useMapSearchSelection();
  const insets = useSafeAreaInsets();
  const [selectedPlaceId, setSelectedPlaceId] = React.useState<number | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = React.useState<number | null>(null);
  const [selectedSheetMode, setSelectedSheetMode] = React.useState<
    'category' | 'bus' | 'building' | 'place' | 'places'
  >('category');
  const [selectedCategoryCode, setSelectedCategoryCode] = React.useState<string | null>(null);
  const [selectedStation, setSelectedStation] = React.useState<BusStopStation | null>(null);
  const [bottomSheetIndex, setBottomSheetIndex] = React.useState(0);
  const [userLocation, setUserLocation] = React.useState<UserLocationData | null>(null);
  const mapRef = React.useRef<NaverMapHandle>(null);
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const locationSubscriptionRef = React.useRef<Location.LocationSubscription | null>(null);
  const selectedCamera = React.useMemo(
    () =>
      selectedSearchResult
        ? {
            latitude: selectedSearchResult.latitude,
            longitude: selectedSearchResult.longitude,
            zoom: 17,
          }
        : undefined,
    [selectedSearchResult]
  );

  // 검색 결과 마커 (place marker 스타일 재사용)
  const searchResultMarkers = React.useMemo(
    () =>
      selectedSearchResult
        ? [
            {
              id: `search:${selectedSearchResult.type}:${selectedSearchResult.id}`,
              latitude: selectedSearchResult.latitude,
              longitude: selectedSearchResult.longitude,
              name: selectedSearchResult.name,
            },
          ]
        : [],
    [selectedSearchResult]
  );

  const searchResultMarkerIcon = React.useMemo(
    () =>
      selectedSearchResult
        ? getMapIconKey(selectedSearchResult.iconKey, selectedSearchResult.categoryCode)
        : undefined,
    [selectedSearchResult]
  );

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
    placeholderData: keepPreviousData,
  });

  // 장소(비건물) 상세 조회
  const { data: selectedPlaceDetail } = useQuery({
    queryKey: ['map-place-detail', selectedPlaceId],
    queryFn: () => getPlaceDetail(selectedPlaceId!, CAMPUS_LATITUDE, CAMPUS_LONGITUDE),
    enabled: selectedPlaceId !== null,
    placeholderData: keepPreviousData,
  });

  // 칩 클릭 시 장소/건물 목록 조회 (무한 스크롤 페이지네이션)
  const {
    data: categoryPinsPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['map-category-pins', selectedCategoryCode, CAMPUS_LATITUDE, CAMPUS_LONGITUDE],
    queryFn: ({ pageParam }) =>
      getCategoryPins(selectedCategoryCode!, CAMPUS_LATITUDE, CAMPUS_LONGITUDE, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < MAP_CATEGORY_PINS_PAGE_SIZE ? undefined : allPages.length,
    enabled: selectedCategoryCode !== null,
    placeholderData: keepPreviousData,
  });

  const categoryPins = React.useMemo(
    () => categoryPinsPages?.pages.flat() ?? [],
    [categoryPinsPages]
  );

  function onCategoryPinsEndReached() {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }

  // 바텀시트 스크롤이 하단에 가까워지면 다음 페이지 로드
  // (장소 목록 시트는 BottomSheetScrollView 안에 중첩된 ScrollView라 실제 스크롤은 바깥쪽에서 일어남)
  function onBottomSheetScroll({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) {
    if (selectedSheetMode !== 'places' || !selectedCategoryCode) return;

    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    const isCloseToBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 100;
    if (isCloseToBottom) onCategoryPinsEndReached();
  }

  // 건물 상세 조회가 완료되면 그때 시트를 건물 상세로 교체 (조회 중에는 기존 시트 유지)
  React.useEffect(() => {
    if (selectedBuildingId === null || !selectedBuildingDetail) return;

    setSelectedSheetMode('building');
  }, [selectedBuildingId, selectedBuildingDetail]);

  /**
   * 시트가 접혀있던 경우, 건물 상세 콘텐츠 렌더링이 끝난 뒤에 시트를 펼친다
   * (같은 건물 선택에 대해 한 번만 펼치도록 ref로 추적 — 아니면 사용자가 나중에 직접 시트를 내려도
   * bottomSheetIndex가 0으로 바뀌는 순간 이 effect가 다시 실행되어 도로 펼쳐지는 버그가 생긴다)
   */
  const autoExpandedBuildingIdRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (selectedSheetMode !== 'building' || !selectedBuildingDetail) return;
    if (autoExpandedBuildingIdRef.current === selectedBuildingId) return;

    autoExpandedBuildingIdRef.current = selectedBuildingId;
    if (bottomSheetIndex === 0) {
      bottomSheetRef.current?.snapToIndex(1);
    }
  }, [selectedSheetMode, selectedBuildingDetail, selectedBuildingId, bottomSheetIndex]);

  // 장소 상세 조회가 완료되면 그때 시트를 장소 상세로 교체하고 지도를 이동시킨다
  React.useEffect(() => {
    if (selectedPlaceId === null || !selectedPlaceDetail) return;

    setSelectedSheetMode('place');
    mapRef.current?.animateCameraTo(
      selectedPlaceDetail.latitude,
      selectedPlaceDetail.longitude,
      17
    );
  }, [selectedPlaceId, selectedPlaceDetail]);

  /**
   * 시트가 접혀있던 경우, 장소 상세 콘텐츠 렌더링이 끝난 뒤에 시트를 펼친다
   * (같은 장소 선택에 대해 한 번만 펼치도록 ref로 추적 — 건물 상세와 동일한 이유)
   */
  const autoExpandedPlaceIdRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (selectedSheetMode !== 'place' || !selectedPlaceDetail) return;
    if (autoExpandedPlaceIdRef.current === selectedPlaceId) return;

    autoExpandedPlaceIdRef.current = selectedPlaceId;
    if (bottomSheetIndex === 0) {
      bottomSheetRef.current?.snapToIndex(1);
    }
  }, [selectedSheetMode, selectedPlaceDetail, selectedPlaceId, bottomSheetIndex]);

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

  // 칩 조회 결과 마커
  const categoryMarkers = React.useMemo(
    () =>
      categoryPins.map((pin) => ({
        id: String(pin.id),
        latitude: pin.latitude,
        longitude: pin.longitude,
        name: pin.name,
      })),
    [categoryPins]
  );

  // 칩 조회 결과 마커에 표시할 아이콘 (선택된 칩의 아이콘 사용, 대동명지도는 RestaurantIcon 고정)
  const categoryMarkerIcon = React.useMemo(() => {
    if (selectedCategoryCode === 'daedong') return 'RestaurantIcon';

    for (const category of CATEGORIES) {
      const chip = category.chips.find((c) => c.id === selectedCategoryCode);
      if (chip) return chip.iconKey;
    }
    return 'BuildingIcon';
  }, [selectedCategoryCode]);

  React.useEffect(() => {
    const rawPlaceId = Array.isArray(placeId) ? placeId[0] : placeId;
    const numericPlaceId = rawPlaceId ? Number(rawPlaceId) : NaN;
    if (Number.isNaN(numericPlaceId)) return;

    setSelectedSheetMode('category');
    clearSearchResult();
    setSelectedCategoryCode(null);
    setSelectedBuildingId(null);
    setSelectedPlaceId(numericPlaceId);
    bottomSheetRef.current?.snapToIndex(expanded === 'true' ? 2 : 1);
  }, [clearSearchResult, expanded, exactMatch, placeId]);

  React.useEffect(() => {
    if (!selectedSearchResult) return;

    setSelectedPlaceId(null);
    setSelectedBuildingId(null);
    setSelectedCategoryCode(null);
    setSelectedSheetMode('category');
    mapRef.current?.animateCameraTo(
      selectedSearchResult.latitude,
      selectedSearchResult.longitude,
      17
    );
    bottomSheetRef.current?.snapToIndex(1);
  }, [selectedSearchResult]);

  // 캠퍼스 건물 마커 클릭 (상세 조회가 끝나면 아래 useEffect에서 시트를 교체)
  function onBuildingMarkerPress(id: string) {
    const building = buildings.find((b) => String(b.id) === id);
    if (!building) return;

    setSelectedPlaceId(null);
    clearSearchResult();
    setSelectedCategoryCode(null);
    setSelectedBuildingId(building.id);
    mapRef.current?.animateCameraTo(building.latitude, building.longitude);
  }

  // 칩 조회 결과 핀 선택 (건물 핀이면 건물 상세, 그 외는 장소 상세로 조회) - 마커 클릭과 리스트 항목 클릭에서 공통으로 사용
  function selectCategoryPin(pin: MapCategoryPin) {
    clearSearchResult();
    mapRef.current?.animateCameraTo(pin.latitude, pin.longitude);

    if (pin.type === 'BUILDING') {
      setSelectedPlaceId(null);
      setSelectedBuildingId(pin.id);
      return;
    }

    setSelectedBuildingId(null);
    setSelectedPlaceId(pin.id);
  }

  // 검색 결과 및 칩 조회 결과 마커 클릭
  function onPlaceMarkerPress(id: string) {
    if (
      selectedSearchResult &&
      id === `search:${selectedSearchResult.type}:${selectedSearchResult.id}`
    ) {
      mapRef.current?.animateCameraTo(
        selectedSearchResult.latitude,
        selectedSearchResult.longitude,
        17
      );
      bottomSheetRef.current?.snapToIndex(1);
      return;
    }

    const pin = categoryPins.find((p) => String(p.id) === id);
    if (!pin) return;

    selectCategoryPin(pin);
  }

  // 버스 정류장 마커 클릭
  function onBusStopMarkerPress(id: string) {
    const busStop = BUS_STOPS.find((s) => s.id === id);
    if (!busStop) return;

    setSelectedPlaceId(null);
    clearSearchResult();
    setSelectedBuildingId(null);
    setSelectedCategoryCode(null);
    setSelectedSheetMode('bus');
    setSelectedStation(busStop.station);
    mapRef.current?.animateCameraTo(busStop.latitude, busStop.longitude);
    bottomSheetRef.current?.snapToIndex(1);
  }

  // 검색 버튼 클릭
  function onSearchButtonPress() {
    router.push('/maps/search');
  }

  // 칩 클릭 동작 정의
  function onQuickChipPress(chipId: string) {
    // 버스 정류장 칩 클릭
    if (chipId === 'bus') {
      setSelectedPlaceId(null);
      clearSearchResult();
      setSelectedBuildingId(null);
      setSelectedCategoryCode(null);
      setSelectedSheetMode('bus');
      setSelectedStation('A');
      const stationA = BUS_STOPS.find((s) => s.station === 'A');
      if (stationA) mapRef.current?.animateCameraTo(stationA.latitude, stationA.longitude);
      bottomSheetRef.current?.snapToIndex(1);
      return;
    }

    // 그 외 칩 클릭 시 해당 카테고리의 장소/건물 목록 조회
    setSelectedPlaceId(null);
    clearSearchResult();
    setSelectedBuildingId(null);
    setSelectedSheetMode('places');
    setSelectedCategoryCode(chipId);
    bottomSheetRef.current?.snapToIndex(1);
  }

  // 사용자 위치 추적 시작 (native 전용, 지도의 현위치 오버레이 표시용)
  async function startWatchingUserLocation() {
    if (Platform.OS === 'web' || locationSubscriptionRef.current) return;

    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) return;

    locationSubscriptionRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 5 },
      (location) => {
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          heading: location.coords.heading ?? undefined,
        });
      }
    );
  }

  // 이미 위치 권한이 허용된 경우, 화면 진입 시 바로 위치 추적 시작
  React.useEffect(() => {
    if (Platform.OS === 'web') return;

    Location.getForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') startWatchingUserLocation();
    });

    return () => {
      locationSubscriptionRef.current?.remove();
      locationSubscriptionRef.current = null;
    };
  }, []);

  // 현위치 찾기 버튼 클릭
  async function onCurrentLocationPress() {
    if (Platform.OS === 'web') {
      const geolocation = globalThis.navigator?.geolocation;

      if (!geolocation) {
        showAlert('위치 오류', '이 브라우저에서는 현재 위치를 사용할 수 없습니다.');
        return;
      }

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000,
          });
        });

        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          heading: position.coords.heading ?? undefined,
        });
        mapRef.current?.animateCameraTo(position.coords.latitude, position.coords.longitude, 16);
      } catch {
        showAlert('위치 오류', '현재 위치를 가져올 수 없습니다.');
      }

      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      showAlert('위치 서비스 비활성화', '기기의 위치 서비스를 켜주세요.');
      return;
    }

    startWatchingUserLocation();

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      mapRef.current?.animateCameraTo(location.coords.latitude, location.coords.longitude, 16);
    } catch {
      showAlert('위치 오류', '현재 위치를 가져올 수 없습니다.');
    }
  }

  function onResetMapPress() {
    clearSearchResult();
    setSelectedPlaceId(null);
    setSelectedBuildingId(null);
    setSelectedCategoryCode(null);
    setSelectedStation(null);
    setSelectedSheetMode('category');
    mapRef.current?.animateCameraTo(CAMPUS_LATITUDE, CAMPUS_LONGITUDE, CAMPUS_ZOOM);
    bottomSheetRef.current?.snapToIndex(0);
  }

  // 더보기 버튼 클릭 (카테고리 시트 표시)
  function handleMoreCategories() {
    setSelectedSheetMode('category');
    setSelectedPlaceId(null);
    clearSearchResult();
    setSelectedBuildingId(null);
    setSelectedCategoryCode(null);
    bottomSheetRef.current?.snapToIndex(1);
  }

  // 바텀 시트 렌더링
  function renderBottomSheetContent() {
    if (selectedSearchResult) {
      return <MapSearchSummary item={selectedSearchResult} />;
    }

    if (selectedSheetMode === 'bus' && selectedStation) {
      return <BusInfoSheet station={selectedStation} />;
    }

    if (selectedSheetMode === 'building' && selectedBuildingDetail) {
      return <BuildingDetailSheet building={selectedBuildingDetail} />;
    }

    if (selectedSheetMode === 'place' && selectedPlaceDetail) {
      return <PlaceDetailSheet place={selectedPlaceDetail} />;
    }

    if (selectedSheetMode === 'places' && selectedCategoryCode) {
      if (selectedCategoryCode === 'daedong') {
        return (
          <DaedongPlaceListSheet
            places={categoryPins}
            onPlacePress={selectCategoryPin}
            isFetchingNextPage={isFetchingNextPage}
          />
        );
      }
      return (
        <PlaceListSheet
          places={categoryPins}
          onPlacePress={selectCategoryPin}
          isFetchingNextPage={isFetchingNextPage}
        />
      );
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
        camera={selectedCamera}
        busStopMarkers={BUS_STOPS}
        buildingMarkers={selectedSearchResult || selectedCategoryCode ? [] : buildingMarkers}
        placeMarkers={
          selectedSearchResult ? searchResultMarkers : selectedCategoryCode ? categoryMarkers : []
        }
        placeMarkerIcon={selectedSearchResult ? searchResultMarkerIcon : categoryMarkerIcon}
        userLocation={userLocation}
        onBusStopMarkerPress={onBusStopMarkerPress}
        onBuildingMarkerPress={onBuildingMarkerPress}
        onPlaceMarkerPress={onPlaceMarkerPress}
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

      {/* 지도 컨트롤 버튼 */}
      <View
        className="absolute right-4 flex-row items-center gap-2"
        style={{ bottom: insets.bottom + 64 }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="현재 위치로 이동"
          onPress={onCurrentLocationPress}
          className="h-12 w-12 items-center justify-center rounded-full bg-white active:bg-grey-02 active:opacity-80"
          style={MAP_CONTROL_SHADOW}
        >
          <CurrentLocationIcon size={28} className="text-blue-35" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="지도 보기 초기화"
          onPress={onResetMapPress}
          className="h-10 w-10 items-center justify-center rounded-full bg-white active:bg-grey-02 active:opacity-80"
          style={MAP_CONTROL_SHADOW}
        >
          <ResetIcon size={22} className="text-grey-40" />
        </Pressable>
      </View>

      {/* 바텀시트 */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={SNAP_POINTS}
        handleComponent={SheetHandle}
        topInset={insets.top}
        onChange={setBottomSheetIndex}
      >
        <BottomSheetScrollView onScroll={onBottomSheetScroll}>
          {renderBottomSheetContent()}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}
