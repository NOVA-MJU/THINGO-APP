import { MapCategoryPin } from '@/api/maps';
import { FavoriteIcon, MyeongwolIcon, RestaurantIcon } from '@/components/icons/map';
import { XIcon } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/auth-context';
import { useLoginRequiredModal } from '@/context/login-required-modal-context';
import { Fragment, useRef } from 'react';
import { ActivityIndicator, Image, ScrollView, TouchableOpacity, View } from 'react-native';
import FavoriteSaveSheet, { type FavoriteSaveSheetHandle } from './favorite-save-sheet';

interface DaedongPlaceListSheetProps {
  places: MapCategoryPin[];
  onPlacePress?: (place: MapCategoryPin) => void;
  isFetchingNextPage?: boolean;
  isLoading?: boolean;
  onClose?: () => void;
}

// 대동명지도 목록 표시 시트
export default function DaedongPlaceListSheet({
  places,
  onPlacePress,
  isFetchingNextPage,
  isLoading,
  onClose,
}: DaedongPlaceListSheetProps) {
  const { user } = useAuth();
  const { showLoginRequiredModal } = useLoginRequiredModal();
  const favoriteSaveSheetRef = useRef<FavoriteSaveSheetHandle>(null);

  // 즐겨찾기 버튼 클릭 → 그룹 선택 바텀시트를 연다 (건물/장소 상세 시트와 동일한 방식)
  function onFavoritePress(place: MapCategoryPin) {
    if (!user) {
      showLoginRequiredModal();
      return;
    }
    favoriteSaveSheetRef.current?.open({ pinId: place.id, name: place.name });
  }

  return (
    <>
      <ScrollView>
        <View className="flex-row items-center px-4">
          <Text className="text-black text-title03">대동명지도</Text>
          <Text className="me-1 ms-3 text-grey-80 text-body05">by 명월</Text>
          <MyeongwolIcon size={24} />
          <TouchableOpacity
            hitSlop={4}
            onPress={onClose}
            className="ml-auto h-7 w-7 items-center justify-center rounded-full bg-grey-02"
          >
            <XIcon size={14} className="text-grey-30" />
          </TouchableOpacity>
        </View>
        <View className="py-2.5">
          <View className="h-1 bg-grey-02" />
        </View>

        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Fragment key={index}>
              {index > 0 && <View className="m-4 h-[1.5px] bg-grey-02" />}
              <View className="px-4">
                <View className="flex-row items-center gap-3.5">
                  <Skeleton className="h-11 w-11 rounded" />
                  <View className="flex-1 gap-1.5">
                    <Skeleton className="h-4 w-2/5" />
                    <Skeleton className="h-3.5 w-1/4" />
                  </View>
                  <Skeleton className="h-7 w-7 rounded-full" />
                </View>
                <Skeleton className="mt-2.5 h-3.5 w-1/3" />
              </View>
            </Fragment>
          ))
        ) : places.length === 0 ? (
          <View className="items-center px-4 py-10">
            <Text className="text-grey-40 text-body04">표시할 장소가 없습니다.</Text>
          </View>
        ) : (
          places.map((place, index) => (
            <Fragment key={place.id}>
              {index > 0 && <View className="m-4 h-[1.5px] bg-grey-02" />}
              <TouchableOpacity
                className="px-4"
                activeOpacity={0.7}
                disabled={!onPlacePress}
                onPress={() => onPlacePress?.(place)}
              >
                <View className="flex-row items-center gap-3.5">
                  <View className="rounded bg-blue-05 p-2">
                    <RestaurantIcon size={28} className="text-blue-15" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-black text-title03">{place.name}</Text>
                    {place.classroomCode ? (
                      <Text className="text-grey-80 text-body05">{place.classroomCode}</Text>
                    ) : place.location ? (
                      <View className="flex-row items-center gap-1">
                        <View className="rounded bg-grey-02 px-1">
                          <Text className="text-grey-60 text-caption02">도로명</Text>
                        </View>
                        <Text className="text-grey-80 text-caption02" numberOfLines={1}>
                          {place.location}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <TouchableOpacity hitSlop={4} onPress={() => onFavoritePress(place)}>
                    <FavoriteIcon size={28} active={place.favorite} />
                  </TouchableOpacity>
                </View>
                <View className="mt-2.5 flex-row items-center">
                  <Text className="text-grey-40 text-body04">
                    {place.operatingStatus || '운영 정보 없음'}
                  </Text>
                  <View className="px-1.5">
                    <View className="h-[3px] w-[3px] rounded-full bg-grey-30" />
                  </View>
                  {place.distanceMeters !== null && (
                    <Text className="text-grey-30 text-body05">{place.distanceMeters}m</Text>
                  )}
                </View>
                {place.imageUrl && (
                  <Image
                    source={{ uri: place.imageUrl }}
                    className="mt-2 h-[200px] rounded-lg"
                    resizeMode="cover"
                  />
                )}
              </TouchableOpacity>
            </Fragment>
          ))
        )}
        {isFetchingNextPage && (
          <View className="items-center py-4">
            <ActivityIndicator />
          </View>
        )}
      </ScrollView>

      <FavoriteSaveSheet ref={favoriteSaveSheetRef} />
    </>
  );
}
