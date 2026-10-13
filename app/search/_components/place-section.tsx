import { getMapSearchResults, type MapSearchItem } from '@/api/maps';
import { ArrowRightIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { formatPlaceLocation, getFloorPlanHref } from '@/lib/maps/floor-plan-href';
import { getMapIcon, getMapIconClassName } from '@/lib/maps/icons';
import { listItemEnter } from '@/lib/motion';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';

const PLACE_LIMIT = 3;

// 통합검색 맨 위 '명지도 장소' 칸. '보건실', '학생지원팀'처럼 장소를 찾는 검색은 공지보다 위치가 답이라
// 이름이 확실히 맞는 교내 장소(엄격 검색)가 있을 때만 보여준다
export default function PlaceSection({ query }: { query: string }) {
  const router = useRouter();
  const { data: places = [] } = useQuery({
    queryKey: ['map-place-matches', query],
    queryFn: () => getMapSearchResults({ keyword: query, strict: true, size: PLACE_LIMIT }),
    enabled: !!query,
    staleTime: 5 * 60 * 1000,
  });

  if (places.length === 0) return null;

  // 층별 안내도가 있는 교내 시설은 도면으로, 그 외(건물·도면 없는 층·외부 장소)는 지도 핀으로 보여준다
  function openPlace(place: MapSearchItem) {
    const floorPlanHref = getFloorPlanHref(place);
    if (floorPlanHref) {
      router.push(floorPlanHref);
      return;
    }
    const params =
      place.type === 'BUILDING' ? { buildingId: String(place.id) } : { placeId: String(place.id) };
    router.navigate({ pathname: '/maps', params });
  }

  return (
    <View className="px-4 pt-5">
      <Text className="text-black text-body02">명지도 장소</Text>
      <View className="mt-2">
        {places.map((place, index) => {
          const Icon = getMapIcon(place.iconKey ?? '', place.categoryCode);
          const hasFloorPlan = getFloorPlanHref(place) !== null;
          return (
            <Animated.View key={`${place.type}:${place.id}`} entering={listItemEnter(index)}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openPlace(place)}
                className="flex-row items-center gap-3 border-b border-grey-02 py-2.5"
              >
                <View className="rounded-lg bg-blue-05 p-2">
                  <Icon size={20} className={getMapIconClassName(place.categoryCode)} />
                </View>
                <View className="min-w-0 flex-1 gap-0.5">
                  <Text className="text-black text-body04" numberOfLines={1}>
                    {place.name}
                  </Text>
                  {place.location ? (
                    <Text className="text-grey-40 text-caption02" numberOfLines={1}>
                      {formatPlaceLocation(place.location)}
                    </Text>
                  ) : null}
                </View>
                <Text className="text-blue-35 text-caption02">
                  {hasFloorPlan ? '층별 안내도' : '지도에서 보기'}
                </Text>
                <ArrowRightIcon size={16} className="text-grey-30" />
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}
