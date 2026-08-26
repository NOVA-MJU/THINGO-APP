import { Text } from '@/components/ui/text';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { FavoriteIcon, InfoIcon } from '@/components/icons/map';
import { XIcon } from '@/components/icons';
import type { MapPlaceDetail } from '@/api/maps';
import { formatMapDistance } from '@/lib/maps/format';
import { getMapIcon, getMapIconClassName } from '@/lib/maps/icons';
import { useAuth } from '@/context/auth-context';
import { useLoginRequiredModal } from '@/context/login-required-modal-context';
import * as React from 'react';
import FavoriteSaveSheet, {
  type FavoriteSaveSheetHandle,
} from '@/app/(tabs)/maps/_components/sheets/favorite-save-sheet';

// 명지도 장소(비건물) 상세보기 시트 - 건물 상세와 달리 강의실 코드·운영시간은 없고 위치·추가정보(infoText)를 제공
export default function PlaceDetailSheet({
  place,
  onClose,
}: {
  place: MapPlaceDetail;
  onClose?: () => void;
}) {
  const Icon = getMapIcon(place.iconKey ?? '', place.categoryCode);
  const { user } = useAuth();
  const { showLoginRequiredModal } = useLoginRequiredModal();
  const favoriteSaveSheetRef = React.useRef<FavoriteSaveSheetHandle>(null);

  // 즐겨찾기 버튼 클릭 → 기존 즉시 토글(useToggleMapFavorite) API 연결은 해제하고,
  // 그룹 선택 바텀시트를 여는 방식으로 교체 (디자인/기능 미확정 — 지금은 뼈대만 연결)
  // 로그인 안 돼 있으면 시트를 열지 않고 로그인 필요 모달을 표시
  function onFavoritePress() {
    if (!user) {
      showLoginRequiredModal();
      return;
    }
    favoriteSaveSheetRef.current?.open({ pinId: place.id, name: place.name });
  }

  return (
    <>
      <ScrollView>
        <View>
          <View className="flex-row gap-3.5 px-4">
            <View className="rounded bg-blue-05 p-2">
              <Icon size={28} className={getMapIconClassName(place.categoryCode)} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-title03 text-black" numberOfLines={1}>
                {place.name}
              </Text>
              {place.location && (
                <Text className="text-body05 text-grey-80" numberOfLines={1}>
                  {place.location}
                </Text>
              )}
            </View>
            <TouchableOpacity hitSlop={4} onPress={onFavoritePress}>
              <FavoriteIcon size={28} active={place.favorite} />
            </TouchableOpacity>
            <TouchableOpacity
              hitSlop={4}
              onPress={onClose}
              className="h-7 w-7 items-center justify-center rounded-full bg-grey-02"
            >
              <XIcon size={14} className="text-grey-30" />
            </TouchableOpacity>
          </View>

          {(place.distanceMeters != null || place.infoText) && (
            <View className="mt-2.5 gap-1 px-4">
              {place.distanceMeters != null && (
                <Text className="text-body05 text-grey-30">
                  {formatMapDistance(place.distanceMeters)}
                </Text>
              )}
              {place.infoText && (
                <View className="flex-row items-start gap-1">
                  <InfoIcon size={16} className="mt-0.5 text-grey-20" />
                  <Text className="flex-1 text-caption02 text-grey-40">{place.infoText}</Text>
                </View>
              )}
            </View>
          )}

          {/* 썸네일 */}
          <View className="mt-2 px-4">
            {place.imageUrl ? (
              <Image
                source={{ uri: place.imageUrl }}
                className="h-[200px] w-full rounded-lg bg-grey-10"
              />
            ) : (
              <View className="h-[200px] rounded-lg bg-grey-10" />
            )}
          </View>

          {/* 커뮤니티 */}
          <View className="mt-4 px-4 py-5">
            <Text className="text-title03 text-black">커뮤니티</Text>
            <View className="h-24 items-center justify-center rounded-sm border border-grey-10">
              <Text className="text-body05 text-grey-30">곧 만나볼 수 있어요!</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <FavoriteSaveSheet ref={favoriteSaveSheetRef} />
    </>
  );
}
