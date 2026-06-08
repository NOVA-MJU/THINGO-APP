import { SearchIcon, ThingoLogoSmall } from '@/components/icons';
import { NaverMap, NaverMapHandle } from '@/components/naver-map';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import * as React from 'react';
import { Alert, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import SheetHandle from './_components/sheets/sheet-handle';
import { MoreIcon, StarIcon } from './_components/icons';
import CategoryList from './_components/sheets/category-list';
import { CATEGORIES } from './_constants/category-data';

const MARKERS = [
  { id: '1', latitude: 37.58036, longitude: 126.92343 },
  { id: '2', latitude: 37.57951, longitude: 126.922684 },
  { id: '3', latitude: 37.580226, longitude: 126.922582 },
  { id: '4', latitude: 37.580131, longitude: 126.921645 },
  { id: '5', latitude: 37.580793, longitude: 126.923835 },
  { id: '6', latitude: 37.580746, longitude: 126.92448 },
  { id: '7', latitude: 37.580102, longitude: 126.924266 },
  { id: '8', latitude: 37.580815, longitude: 126.923101 },
];

const QUICK_CHIP_IDS = ['bus', 'daedong', 'printer', 'lounge', 'bank'];

const QUICK_CHIPS = CATEGORIES.flatMap((c) =>
  c.chips.map((chip) => ({ ...chip, iconClassName: c.iconClassName }))
)
  .filter((chip) => QUICK_CHIP_IDS.includes(chip.id))
  .sort((a, b) => QUICK_CHIP_IDS.indexOf(a.id) - QUICK_CHIP_IDS.indexOf(b.id));

const SNAP_POINTS = ['10%', '50%', '100%'];

export default function MapsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [, setSelectedMarkerId] = React.useState<string | null>(null);
  const mapRef = React.useRef<NaverMapHandle>(null);
  const bottomSheetRef = React.useRef<BottomSheet>(null);

  function onMarkerPress(id: string) {
    setSelectedMarkerId(id);
    bottomSheetRef.current?.snapToIndex(0);
  }

  function onBottomSheetClose() {
    setSelectedMarkerId(null);
  }

  function onSearchButtonPress() {
    router.push('/maps/search');
  }

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
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      mapRef.current?.animateCameraTo(location.coords.latitude, location.coords.longitude, 16);
    } catch {
      Alert.alert('위치 오류', '현재 위치를 가져올 수 없습니다.');
    }
  }

  function handleMoreCategories() {}

  return (
    <View style={{ flex: 1 }}>
      <NaverMap
        ref={mapRef}
        initialLatitude={37.579711}
        initialLongitude={126.923186}
        initialZoom={16}
        markers={MARKERS}
        onMarkerPress={onMarkerPress}
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
          style={{
            position: 'absolute',
            bottom: insets.bottom + 24,
            right: 16,
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: 'white',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Text style={{ fontSize: 22 }}>◎</Text>
        </TouchableOpacity>
      )}

      {/* 바텀시트 */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={SNAP_POINTS}
        // enablePanDownToClose
        handleComponent={SheetHandle}
        topInset={insets.top}
        onClose={onBottomSheetClose}
      >
        <BottomSheetScrollView>
          {/* <PlaceList /> */}
          {/* <PlaceDetail /> */}
          <CategoryList />
          {/* <BusInfoSheet /> */}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}
