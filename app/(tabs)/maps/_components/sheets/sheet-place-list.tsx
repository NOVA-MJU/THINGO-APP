import { MapCategoryPin } from '@/api/maps';
import { BuildingIcon, FavoriteIcon } from '@/components/icons/map';
import { XIcon } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/auth-context';
import { useLoginRequiredModal } from '@/context/login-required-modal-context';
import { ComponentType, Fragment, useRef } from 'react';
import { ActivityIndicator, Image, ScrollView, TouchableOpacity, View } from 'react-native';
import FavoriteSaveSheet, { type FavoriteSaveSheetHandle } from './favorite-save-sheet';
import CATEGORIES from '../../_constants/category-data';

interface PlaceListSheetProps {
  // 테마지도처럼 목록에 이름이 있는 경우 닫기 버튼 왼쪽에 제목·부제를 보여준다 (칩 목록은 칩이 곧 제목이라 없음)
  title?: string;
  subtitle?: string;
  places: MapCategoryPin[];
  onPlacePress?: (place: MapCategoryPin) => void;
  isFetchingNextPage?: boolean;
  isLoading?: boolean;
  onClose?: () => void;
}

// 칩의 카테고리 코드로 아이콘 조회 (일치하는 칩이 없으면 기본 건물 아이콘 사용)
function resolvePlaceIcon(categoryCode: string): {
  Icon: ComponentType<{ size?: number; className?: string }>;
  iconClassName: string;
} {
  for (const category of CATEGORIES) {
    const chip = category.chips.find((c) => c.id === categoryCode);
    if (chip) return { Icon: chip.Icon, iconClassName: category.iconClassName };
  }

  return { Icon: BuildingIcon, iconClassName: 'text-blue-15' };
}

function SheetHeader({
  title,
  subtitle,
  onClose,
}: Pick<PlaceListSheetProps, 'title' | 'subtitle' | 'onClose'>) {
  return (
    <View className="flex-row items-start justify-between gap-3 px-4 pb-1">
      {title ? (
        <View className="flex-1 gap-0.5">
          <Text className="text-black text-title03">{title}</Text>
          {subtitle ? <Text className="text-grey-40 text-body05">{subtitle}</Text> : null}
        </View>
      ) : null}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="닫기"
        hitSlop={4}
        onPress={onClose}
        className="ms-auto h-7 w-7 items-center justify-center rounded-full bg-grey-02"
      >
        <XIcon size={14} className="text-grey-30" />
      </TouchableOpacity>
    </View>
  );
}

// 장소 목록 표시 시트
export default function PlaceListSheet({
  title,
  subtitle,
  places,
  onPlacePress,
  isFetchingNextPage,
  isLoading,
  onClose,
}: PlaceListSheetProps) {
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

  if (isLoading) {
    return (
      <View>
        <SheetHeader title={title} subtitle={subtitle} onClose={onClose} />
        {Array.from({ length: 6 }).map((_, index) => (
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
        ))}
      </View>
    );
  }

  if (places.length === 0) {
    return (
      <View>
        <SheetHeader title={title} subtitle={subtitle} onClose={onClose} />
        <View className="items-center px-4 py-10">
          <Text className="text-grey-40 text-body04">표시할 장소가 없습니다.</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <ScrollView>
        <SheetHeader title={title} subtitle={subtitle} onClose={onClose} />
        {places.map((place, index) => {
          const { Icon, iconClassName } = resolvePlaceIcon(place.categoryCode);

          return (
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
                    <Icon size={28} className={iconClassName} />
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
                  {place.distanceMeters != null && (
                    <>
                      <View className="px-1.5">
                        <View className="h-[3px] w-[3px] rounded-full bg-grey-30" />
                      </View>
                      <Text className="text-grey-30 text-body05">{place.distanceMeters}m</Text>
                    </>
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
          );
        })}
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
