import type { MapSearchItem } from '@/api/maps';
import { FavoriteIcon } from '@/components/icons/map';
import { XIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { useToggleMapFavorite } from '@/hooks/useToggleMapFavorite';
import { formatMapDistance, getOperatingStatusClassName } from '@/lib/maps/format';
import { getMapIcon, getMapIconClassName } from '@/lib/maps/icons';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { Image, TouchableOpacity, View } from 'react-native';

interface MapSearchSummaryProps {
  item: MapSearchItem;
  onClose?: () => void;
}

export default function MapSearchSummary({ item, onClose }: MapSearchSummaryProps) {
  const Icon = getMapIcon(item.iconKey, item.categoryCode);
  const secondaryText = item.classroomCode || item.location;
  const toggleFavorite = useToggleMapFavorite();
  // item은 검색 선택 컨텍스트의 스냅샷이라 react-query 무효화로 갱신되지 않으므로 로컬로 낙관 반영
  const [favorite, setFavorite] = React.useState(item.favorite);

  React.useEffect(() => {
    setFavorite(item.favorite);
  }, [item.favorite]);

  return (
    <View className="pb-4">
      <View className="flex-row items-center gap-3.5 px-4">
        <View className="rounded bg-blue-05 p-2">
          <Icon size={28} className={getMapIconClassName(item.categoryCode)} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-title03 text-black" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-body05 text-grey-80" numberOfLines={1}>
            {secondaryText ?? (item.type === 'BUILDING' ? '건물' : '장소')}
          </Text>
        </View>
        <TouchableOpacity
          hitSlop={4}
          onPress={() => toggleFavorite(item.id, { onToggled: setFavorite })}
        >
          <FavoriteIcon size={28} active={favorite} />
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
          <Text className="text-body05 text-grey-30">{formatMapDistance(item.distanceMeters)}</Text>
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
          <Text className="text-caption01 text-grey-40">위치</Text>
          <Text className="mt-1 text-body05 text-grey-80">{item.location}</Text>
        </View>
      )}
    </View>
  );
}
