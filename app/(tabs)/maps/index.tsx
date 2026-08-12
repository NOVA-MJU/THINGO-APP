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
  ActivityIndicator,
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
import SheetStackLayer from './_components/sheet-stack-layer';
import CATEGORIES from './_constants/category-data';
import { CurrentLocationIcon, MoreIcon, ResetIcon, StarIcon } from '@/components/icons/map';
import { useMapSearchSelection } from '@/context/map-search-selection';
import { showAlert } from '@/lib/alert';
import { CAMPUS_LATITUDE, CAMPUS_LONGITUDE, CAMPUS_ZOOM } from '@/lib/maps/campus';
import { getMapIconKey } from '@/lib/maps/icons';

const QUICK_CHIP_IDS = ['bus', 'daedong', 'printer', 'lounge', 'bank'];

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

// base(카테고리) 시트를 가리키는 키. 스택 레이어들과 동일한 index-복원 로직을 타도록 맞춰둔 값
const BASE_LAYER_KEY = '__base__';

// 카테고리 시트 위에 쌓이는 스택 레이어. 마운트 상태를 유지한 채 index 0으로 접혔다가 복귀하므로
// (places 목록의) 스크롤 위치·페이지네이션이 자동으로 보존된다.
// 주의: 현재 UI 흐름상 스택에 동시에 존재하는 places/building/place는 각각 최대 1개라 아래 useQuery들도
// 하나씩만 두면 충분하다 — 나중에 같은 종류를 여러 겹 쌓는 흐름이 생기면 레이어별로 쿼리를 분리해야 한다.
type SheetScreenInit =
  | { kind: 'places'; categoryCode: string }
  | { kind: 'building'; buildingId: number }
  | { kind: 'place'; placeId: number };
type SheetScreen = SheetScreenInit & { key: string; initialIndex: number };

export default function MapsScreen() {
  const router = useRouter();
  const { exactMatch, expanded, placeId } = useLocalSearchParams<{
    exactMatch?: string;
    expanded?: string;
    placeId?: string;
  }>();
  const { selectedSearchResult, clearSearchResult } = useMapSearchSelection();
  const insets = useSafeAreaInsets();
  const [sheetStack, setSheetStack] = React.useState<SheetScreen[]>([]);
  const [selectedSheetMode, setSelectedSheetMode] = React.useState<'category' | 'bus'>('category');
  const [selectedStation, setSelectedStation] = React.useState<BusStopStation | null>(null);
  const [userLocation, setUserLocation] = React.useState<UserLocationData | null>(null);
  const mapRef = React.useRef<NaverMapHandle>(null);
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const locationSubscriptionRef = React.useRef<Location.LocationSubscription | null>(null);

  // 스택 레이어별 ref/현재 index/가려지기 전 index 를 추적 (렌더링 없이 즉시 스냅해야 해서 state가 아닌 ref로 관리)
  const layerRefsRef = React.useRef(new Map<string, React.RefObject<BottomSheet | null>>());
  const layerIndexRef = React.useRef(new Map<string, number>([[BASE_LAYER_KEY, 0]]));
  const restoreIndexRef = React.useRef(new Map<string, number>());
  // close()로 완전히 숨긴 레이어의 key. close()는 index -1에 도달하면 항상 onClose를 발생시키는데,
  // 위에 새 레이어가 덮여서 숨겨진 것도 실제 pop과 똑같이 onClose가 발생하므로 이 표시로 구분해서
  // handleLayerClosed가 "덮여서 숨겨진 것"은 스택에서 제거하지 않고 그냥 무시하도록 한다.
  const suppressCloseRef = React.useRef(new Set<string>());

  function getLayerRef(key: string): React.RefObject<BottomSheet | null> {
    if (key === BASE_LAYER_KEY) return bottomSheetRef;
    let ref = layerRefsRef.current.get(key);
    if (!ref) {
      ref = React.createRef<BottomSheet>();
      layerRefsRef.current.set(key, ref);
    }
    return ref;
  }

  function updateLayerIndex(key: string, index: number) {
    layerIndexRef.current.set(key, index);
  }

  // 새 레이어를 스택 맨 위에 push. 지금 맨 위에 있던 레이어(또는 base)는 애니메이션 없이 즉시 완전히 숨긴다(close)
  function pushSheet(screen: SheetScreenInit, initialIndex = 1) {
    const belowKey = sheetStack.length > 0 ? sheetStack[sheetStack.length - 1].key : BASE_LAYER_KEY;
    restoreIndexRef.current.set(belowKey, layerIndexRef.current.get(belowKey) ?? 1);
    if (belowKey !== BASE_LAYER_KEY) suppressCloseRef.current.add(belowKey);
    getLayerRef(belowKey).current?.close({ duration: 0 });

    const key = `${screen.kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setSheetStack((prev) => [...prev, { ...screen, key, initialIndex }]);
  }

  // 맨 위 레이어를 pop (닫힘 애니메이션이 끝나면 handleLayerClosed에서 실제로 스택/아래 레이어 복원 처리)
  function popSheet() {
    if (sheetStack.length === 0) return;
    const top = sheetStack[sheetStack.length - 1];
    getLayerRef(top.key).current?.close({ duration: 0 });
  }

  // 레이어 하나의 닫힘이 끝났을 때: 위에 새 레이어가 덮여서 숨겨진 것이면 무시하고,
  // 실제로 pop된 것이면 스택에서 제거하고 가려져 있던 아래 레이어를 원래 index로 즉시 복원
  function handleLayerClosed(key: string, belowKey: string) {
    if (suppressCloseRef.current.has(key)) {
      suppressCloseRef.current.delete(key);
      return;
    }

    setSheetStack((prev) => {
      const index = prev.findIndex((s) => s.key === key);
      return index === -1 ? prev : prev.slice(0, index);
    });
    layerRefsRef.current.delete(key);

    const restoreIndex = restoreIndexRef.current.get(belowKey) ?? 1;
    restoreIndexRef.current.delete(belowKey);
    getLayerRef(belowKey).current?.snapToIndex(restoreIndex, { duration: 0 });
  }

  // 스택을 통째로 비움 (애니메이션 없이 즉시 언마운트 — bus/칩 재선택처럼 완전히 다른 컨텍스트로 전환할 때 사용)
  function resetStack() {
    setSheetStack([]);
    layerRefsRef.current.clear();
    restoreIndexRef.current.clear();
    suppressCloseRef.current.clear();
  }

  // 스택에서 각 종류별 활성 식별자 도출 (현재는 종류당 최대 1개만 존재하므로 find로 충분)
  const selectedCategoryCode = React.useMemo(
    () =>
      sheetStack.find((s): s is Extract<SheetScreen, { kind: 'places' }> => s.kind === 'places')
        ?.categoryCode ?? null,
    [sheetStack]
  );
  const selectedBuildingId = React.useMemo(
    () =>
      sheetStack.find((s): s is Extract<SheetScreen, { kind: 'building' }> => s.kind === 'building')
        ?.buildingId ?? null,
    [sheetStack]
  );
  const selectedPlaceId = React.useMemo(
    () =>
      sheetStack.find((s): s is Extract<SheetScreen, { kind: 'place' }> => s.kind === 'place')
        ?.placeId ?? null,
    [sheetStack]
  );

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
  // placeholderData(keepPreviousData)를 쓰지 않는다: 스택 레이어는 building이 바뀌면 새로 push되는데,
  // 이전 건물의 데이터를 placeholder로 유지하면 renderStackScreenContent의 로딩 스피너 분기가
  // 건너뛰어져서 새 레이어에 이전 건물 정보가 잠깐 그대로 보이는 버그가 생긴다.
  const { data: selectedBuildingDetail } = useQuery({
    queryKey: ['map-building-detail', selectedBuildingId],
    queryFn: () => getBuildingDetail(selectedBuildingId!, CAMPUS_LATITUDE, CAMPUS_LONGITUDE),
    enabled: selectedBuildingId !== null,
  });

  // 장소(비건물) 상세 조회 (건물 상세와 동일한 이유로 placeholderData 미사용)
  const { data: selectedPlaceDetail } = useQuery({
    queryKey: ['map-place-detail', selectedPlaceId],
    queryFn: () => getPlaceDetail(selectedPlaceId!, CAMPUS_LATITUDE, CAMPUS_LONGITUDE),
    enabled: selectedPlaceId !== null,
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

  // places 스택 레이어 스크롤이 하단에 가까워지면 다음 페이지 로드
  function onPlacesScroll({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    const isCloseToBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 100;
    if (isCloseToBottom) onCategoryPinsEndReached();
  }

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

  // 딥링크(placeId 쿼리 파라미터)로 진입한 경우: place 레이어를 바로 push (expanded=true면 100%로)
  React.useEffect(() => {
    const rawPlaceId = Array.isArray(placeId) ? placeId[0] : placeId;
    const numericPlaceId = rawPlaceId ? Number(rawPlaceId) : NaN;
    if (Number.isNaN(numericPlaceId)) return;

    clearSearchResult();
    resetStack();
    setSelectedSheetMode('category');
    pushSheet({ kind: 'place', placeId: numericPlaceId }, expanded === 'true' ? 2 : 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearSearchResult, expanded, exactMatch, placeId]);

  React.useEffect(() => {
    if (!selectedSearchResult) return;

    resetStack();
    setSelectedSheetMode('category');
    mapRef.current?.animateCameraTo(
      selectedSearchResult.latitude,
      selectedSearchResult.longitude,
      17
    );
    bottomSheetRef.current?.snapToIndex(1);
  }, [selectedSearchResult]);

  // 캠퍼스 건물 마커 클릭 → building 레이어를 base 위에 바로 push
  function onBuildingMarkerPress(id: string) {
    const building = buildings.find((b) => String(b.id) === id);
    if (!building) return;

    clearSearchResult();
    resetStack();
    mapRef.current?.animateCameraTo(building.latitude, building.longitude);
    pushSheet({ kind: 'building', buildingId: building.id });
  }

  // 칩 조회 결과 핀 선택 (건물 핀이면 건물 상세, 그 외는 장소 상세로 조회) - places 목록 위에 push
  // 마커 클릭과 리스트 항목 클릭에서 공통으로 사용
  function selectCategoryPin(pin: MapCategoryPin) {
    clearSearchResult();
    mapRef.current?.animateCameraTo(pin.latitude, pin.longitude);

    if (pin.type === 'BUILDING') {
      pushSheet({ kind: 'building', buildingId: pin.id });
      return;
    }
    pushSheet({ kind: 'place', placeId: pin.id });
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

    clearSearchResult();
    resetStack();
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
      clearSearchResult();
      resetStack();
      setSelectedSheetMode('bus');
      setSelectedStation('A');
      const stationA = BUS_STOPS.find((s) => s.station === 'A');
      if (stationA) mapRef.current?.animateCameraTo(stationA.latitude, stationA.longitude);
      bottomSheetRef.current?.snapToIndex(1);
      return;
    }

    // 그 외 칩 클릭 시 해당 카테고리의 장소/건물 목록 조회
    clearSearchResult();
    resetStack();
    setSelectedSheetMode('category');
    pushSheet({ kind: 'places', categoryCode: chipId });
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
    resetStack();
    setSelectedStation(null);
    setSelectedSheetMode('category');
    mapRef.current?.animateCameraTo(CAMPUS_LATITUDE, CAMPUS_LONGITUDE, CAMPUS_ZOOM);
    bottomSheetRef.current?.snapToIndex(0);
  }

  // 더보기 버튼 클릭 (카테고리 시트 표시)
  function handleMoreCategories() {
    clearSearchResult();
    resetStack();
    setSelectedSheetMode('category');
    bottomSheetRef.current?.snapToIndex(1);
  }

  // base 시트(카테고리/버스/검색 요약) 우측 상단 닫기 버튼 클릭 → category로 복귀 후 10%로 접음
  // (places/building/place는 스택 레이어라 각자 popSheet로 처리 — 여기서 다루지 않음)
  function handleCloseSheet() {
    clearSearchResult();
    setSelectedSheetMode('category');
    setSelectedStation(null);
    bottomSheetRef.current?.snapToIndex(0);
  }

  // base 시트 렌더링 (category / bus / 검색 요약만 담당)
  function renderBaseSheetContent() {
    if (selectedSearchResult) {
      return <MapSearchSummary item={selectedSearchResult} onClose={handleCloseSheet} />;
    }

    if (selectedSheetMode === 'bus' && selectedStation) {
      return <BusInfoSheet station={selectedStation} onClose={handleCloseSheet} />;
    }

    return <CategoryList onChipPress={onQuickChipPress} />;
  }

  // 스택 레이어 하나의 콘텐츠 렌더링 (상세 데이터 로딩 중에는 스피너 표시)
  function renderStackScreenContent(screen: SheetScreen) {
    if (screen.kind === 'places') {
      if (screen.categoryCode === 'daedong') {
        return (
          <DaedongPlaceListSheet
            places={categoryPins}
            onPlacePress={selectCategoryPin}
            isFetchingNextPage={isFetchingNextPage}
            onClose={popSheet}
          />
        );
      }
      return (
        <PlaceListSheet
          places={categoryPins}
          onPlacePress={selectCategoryPin}
          isFetchingNextPage={isFetchingNextPage}
          onClose={popSheet}
        />
      );
    }

    if (screen.kind === 'building') {
      if (!selectedBuildingDetail) {
        return (
          <View className="items-center py-8">
            <ActivityIndicator />
          </View>
        );
      }
      return <BuildingDetailSheet building={selectedBuildingDetail} onClose={popSheet} />;
    }

    if (!selectedPlaceDetail) {
      return (
        <View className="items-center py-8">
          <ActivityIndicator />
        </View>
      );
    }
    return <PlaceDetailSheet place={selectedPlaceDetail} onClose={popSheet} />;
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

      {/* 바텀시트 (base: category/bus/검색 요약) */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={SNAP_POINTS}
        handleComponent={SheetHandle}
        topInset={insets.top}
        onChange={(index) => updateLayerIndex(BASE_LAYER_KEY, index)}
      >
        <BottomSheetScrollView>{renderBaseSheetContent()}</BottomSheetScrollView>
      </BottomSheet>

      {/* base 위에 쌓이는 스택 레이어 (places → building/place 드릴다운) */}
      {sheetStack.map((screen, i) => {
        const belowKey = i === 0 ? BASE_LAYER_KEY : sheetStack[i - 1].key;
        return (
          <SheetStackLayer
            key={screen.key}
            sheetRef={getLayerRef(screen.key)}
            initialIndex={screen.initialIndex}
            snapPoints={SNAP_POINTS}
            topInset={insets.top}
            onChange={(index) => updateLayerIndex(screen.key, index)}
            onClose={() => handleLayerClosed(screen.key, belowKey)}
            onScroll={screen.kind === 'places' ? onPlacesScroll : undefined}
          >
            {renderStackScreenContent(screen)}
          </SheetStackLayer>
        );
      })}
    </View>
  );
}
