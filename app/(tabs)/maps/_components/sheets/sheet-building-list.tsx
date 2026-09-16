import { MapBuilding } from '@/api/maps';
import { BuildingIcon, FavoriteIcon } from '@/components/icons/map';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/auth-context';
import { useLoginRequiredModal } from '@/context/login-required-modal-context';
import { Fragment, useRef } from 'react';
import { ActivityIndicator, Image, ScrollView, TouchableOpacity, View } from 'react-native';
import FavoriteSaveSheet, { type FavoriteSaveSheetHandle } from './favorite-save-sheet';

interface BuildingListSheetProps {
  buildings: MapBuilding[];
  onBuildingPress?: (building: MapBuilding) => void;
  isFetchingNextPage?: boolean;
  isLoading?: boolean;
}

// 학교 건물 목록 표시 시트 (sheet-place-list.tsx를 그대로 복사해 MapBuilding용으로 맞춘 것)
// 항상 학교 building만 다루므로 카테고리별 아이콘 분기 없이 BuildingIcon/blue-15로 고정
// base 시트 전용이라 닫을 대상(popSheet)이 없다 — 다른 스택 시트들과 달리 닫기(X) 버튼을 두지 않음
export default function BuildingListSheet({
  buildings,
  onBuildingPress,
  isFetchingNextPage,
  isLoading,
}: BuildingListSheetProps) {
  const { user } = useAuth();
  const { showLoginRequiredModal } = useLoginRequiredModal();
  const favoriteSaveSheetRef = useRef<FavoriteSaveSheetHandle>(null);

  // 즐겨찾기 버튼 클릭 → 그룹 선택 바텀시트를 연다 (건물/장소 상세 시트와 동일한 방식)
  function onFavoritePress(building: MapBuilding) {
    if (!user) {
      showLoginRequiredModal();
      return;
    }
    favoriteSaveSheetRef.current?.open({ pinId: building.id, name: building.name });
  }

  // 로딩 시트
  if (isLoading) {
    return (
      <View>
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

  // 에러 시트
  if (buildings.length === 0) {
    return (
      <View className="items-center px-4 py-10">
        <Text className="text-grey-40 text-body04">표시할 건물이 없습니다.</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView>
        {buildings.map((building, index) => (
          <Fragment key={building.id}>
            {index > 0 && <View className="m-4 h-[1.5px] bg-grey-02" />}
            <TouchableOpacity
              className="px-4"
              activeOpacity={0.7}
              disabled={!onBuildingPress}
              onPress={() => onBuildingPress?.(building)}
            >
              <View className="flex-row items-center gap-3.5">
                <View className="rounded bg-blue-05 p-2">
                  <BuildingIcon size={28} className="text-blue-15" />
                </View>
                <View className="flex-1">
                  <Text className="text-black text-title03">{building.name}</Text>
                  {building.classroomCode ? (
                    <Text className="text-grey-80 text-body05">{building.classroomCode}</Text>
                  ) : building.location ? (
                    <View className="flex-row items-center gap-1">
                      <View className="rounded bg-grey-02 px-1">
                        <Text className="text-grey-60 text-caption02">도로명</Text>
                      </View>
                      <Text className="text-grey-80 text-caption02" numberOfLines={1}>
                        {building.location}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <TouchableOpacity hitSlop={4} onPress={() => onFavoritePress(building)}>
                  <FavoriteIcon size={28} active={building.favorite} />
                </TouchableOpacity>
              </View>
              <View className="mt-2.5 flex-row items-center">
                <Text className="text-grey-40 text-body04">
                  {building.operatingStatus || '운영 정보 없음'}
                </Text>
                <View className="px-1.5">
                  <View className="h-[3px] w-[3px] rounded-full bg-grey-30" />
                </View>
                {building.distanceMeters !== null && (
                  <Text className="text-grey-30 text-body05">{building.distanceMeters}m</Text>
                )}
              </View>
              {building.imageUrl && (
                <Image
                  source={{ uri: building.imageUrl }}
                  className="mt-2 h-[200px] rounded-lg"
                  resizeMode="cover"
                />
              )}
            </TouchableOpacity>
          </Fragment>
        ))}
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
