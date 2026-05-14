import { ArrowLeftIcon, HamburgerIcon } from '@/components/icons';
import { CategoryFilter } from '@/components/ui/category-filter';
import { NaverMap } from '@/components/naver-map';
import Sidebar from '@/components/sidebar';
import * as React from 'react';
import { Platform, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';

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

const FILTER_CATEGORIES = ['버스', '대동명지도', '프린터', '라운지', '은행·ATM'];

export default function MapsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState(FILTER_CATEGORIES[0]);

  function onSearchButtonPress() {}

  return (
    <View style={{ flex: 1 }}>
      <NaverMap
        initialLatitude={37.579711}
        initialLongitude={126.923186}
        initialZoom={16}
        markers={MARKERS}
      />

      {/* 플로팅 헤더 */}
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top + 8 }}
        className="gap-2"
      >
        {/* 검색바 행 */}
        <View className="h-12 w-full flex-row gap-3 px-3">
          <View
            className="flex-1 flex-row items-center gap-3 rounded-xl bg-white p-3"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 4,
              ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' } : {}),
            }}
          >
            <TouchableOpacity onPress={router.back} hitSlop={8}>
              <ArrowLeftIcon className="text-grey-80" />
            </TouchableOpacity>
            <TouchableOpacity className="flex-1" onPress={onSearchButtonPress}>
              <Text className="text-grey-40">명지도 검색</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            className="aspect-square items-center justify-center rounded-xl bg-mju-primary"
            onPress={() => setSidebarOpen(true)}
            hitSlop={8}
          >
            <HamburgerIcon size={24} className="text-white" />
          </TouchableOpacity>
        </View>

        {/* 필터 칩 */}
        <View style={{ elevation: 4 }}>
          <CategoryFilter
            categories={FILTER_CATEGORIES}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </View>
      </View>

      <Sidebar visible={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </View>
  );
}
