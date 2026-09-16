import type { MapSearchItem } from '@/api/maps';
import { FavoriteIcon } from '@/components/icons/map';
import { XIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/auth-context';
import { useLoginRequiredModal } from '@/context/login-required-modal-context';
import { formatMapDistance, getOperatingStatusClassName } from '@/lib/maps/format';
import { getMapIcon, getMapIconClassName } from '@/lib/maps/icons';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import FavoriteSaveSheet, { type FavoriteSaveSheetHandle } from './favorite-save-sheet';

interface MapSearchSummaryProps {
  item: MapSearchItem;
  onClose?: () => void;
}

// 이 시트는 사용하지 않음
export default function MapSearchSummary({ item, onClose }: MapSearchSummaryProps) {
  const Icon = getMapIcon(item.iconKey, item.categoryCode);
  const secondaryText = item.classroomCode || item.location;
  const { user } = useAuth();
  const { showLoginRequiredModal } = useLoginRequiredModal();
  const favoriteSaveSheetRef = React.useRef<FavoriteSaveSheetHandle>(null);

  // 즐겨찾기 버튼 클릭 → 그룹 선택 바텀시트를 연다 (건물/장소 상세 시트와 동일한 방식)
  function onFavoritePress() {
    if (!user) {
      showLoginRequiredModal();
      return;
    }
    favoriteSaveSheetRef.current?.open({ pinId: item.id, name: item.name });
  }

  return (
    <>
      <View className="pb-4">
        <View className="flex-row items-center gap-3.5 px-4">
          <View className="rounded bg-blue-05 p-2">
            <Icon size={28} className={getMapIconClassName(item.categoryCode)} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-black text-title03" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-grey-80 text-body05" numberOfLines={1}>
              {secondaryText ?? (item.type === 'BUILDING' ? '건물' : '장소')}
            </Text>
          </View>
          <TouchableOpacity hitSlop={4} onPress={onFavoritePress}>
            <FavoriteIcon size={28} active={item.favorite} />
          </TouchableOpacity>
          <TouchableOpacity
            hitSlop={4}
            onPress={onClose}
            className="h-7 w-7 items-center justify-center rounded-full bg-grey-02"
          >
            <XIcon size={14} className="text-grey-30" />
          </TouchableOpacity>
        </View>

        <View className="mt-2.5 flex-row items-center gap-1.5 px-4">
          {item.operatingStatus && (
            <Text className={cn('text-body04', getOperatingStatusClassName(item.operatingStatus))}>
              {item.operatingStatus}
            </Text>
          )}
          {item.operatingStatus && item.distanceMeters != null && (
            <View className="h-[3px] w-[3px] rounded-full bg-grey-30" />
          )}
          {item.distanceMeters != null && (
            <Text className="text-grey-30 text-body05">
              {formatMapDistance(item.distanceMeters)}
            </Text>
          )}
        </View>

        {item.imageUrl && (
          <View className="mt-3 px-4">
            <Image
              source={{ uri: item.imageUrl }}
              className="h-[200px] w-full rounded-lg bg-grey-10"
            />
          </View>
        )}

        {item.location && item.location !== secondaryText && (
          <View className="mx-4 mt-3 rounded-xl bg-grey-02 px-4 py-3">
            <Text className="text-grey-40 text-caption01">위치</Text>
            <Text className="mt-1 text-grey-80 text-body05">{item.location}</Text>
          </View>
        )}
      </View>

      <FavoriteSaveSheet ref={favoriteSaveSheetRef} />
    </>
  );
}
