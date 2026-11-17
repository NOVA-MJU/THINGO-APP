import { getFloorPlanLabels, getFloorPlanLayout } from '@/assets/map-floors';
import { ArrowRightIcon, SearchIcon, XThinIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { searchFloorPlanTexts, sortFloorLabels } from '@/lib/maps/floor-plan-search';
import { formatFloorPlanLabel } from '@/lib/maps/format';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Pressable, TouchableOpacity, View } from 'react-native';

// 한 번에 보여줄 결과 수 (시트가 너무 길어지지 않게)
const MAX_RESULTS = 8;

// 건물 시트의 호실·시설 검색. 이 건물 층별 안내도에 적힌 글자에서 찾고(서버를 거치지 않음),
// 누르면 그 층 안내도를 열어 찾은 글자를 강조한다. 도면이 없는 건물은 그리지 않는다
export default function BuildingRoomSearch({
  buildingId,
  onOpenRoom,
}: {
  buildingId: string;
  onOpenRoom: (floorLabel: string, target: string) => void;
}) {
  const [query, setQuery] = React.useState('');

  const floorLabels = React.useMemo(
    () => sortFloorLabels(getFloorPlanLabels(buildingId)),
    [buildingId]
  );
  const floors = React.useMemo(
    () =>
      Object.fromEntries(
        floorLabels.flatMap((label) => {
          const layout = getFloorPlanLayout(buildingId, label);
          return layout ? [[label, layout]] : [];
        })
      ),
    [buildingId, floorLabels]
  );
  const results = React.useMemo(
    () => searchFloorPlanTexts(floors, floorLabels, query, MAX_RESULTS),
    [floors, floorLabels, query]
  );

  if (floorLabels.length === 0) return null;

  const hasQuery = query.trim().length > 0;

  return (
    <View className="mx-4 gap-1">
      <View className="h-11 flex-row items-center gap-2 rounded-xl bg-grey-02 px-3">
        <SearchIcon size={18} className="text-grey-40" />
        <BottomSheetTextInput
          value={query}
          onChangeText={setQuery}
          placeholder="호실·시설 검색 (예: 1353)"
          placeholderTextColor="#909499"
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          className="outline-none"
          style={{ flex: 1, fontSize: 14, color: '#0B1215', paddingVertical: 0 }}
        />
        {hasQuery && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="검색어 지우기"
            hitSlop={8}
            onPress={() => setQuery('')}
          >
            <XThinIcon size={16} className="text-grey-40" />
          </Pressable>
        )}
      </View>

      {hasQuery &&
        (results.length > 0 ? (
          <View>
            {results.map((result) => (
              <TouchableOpacity
                key={`${result.floorLabel}:${result.key}`}
                accessibilityRole="button"
                accessibilityLabel={`${formatFloorPlanLabel(result.floorLabel)} ${result.text} 안내도에서 보기`}
                activeOpacity={0.7}
                onPress={() => onOpenRoom(result.floorLabel, result.key)}
                className="flex-row items-center gap-3 border-b border-grey-02 py-3"
              >
                <View className="min-w-[36px] items-center rounded-md bg-blue-05 px-1.5 py-0.5">
                  <Text className="text-blue-35 text-caption01">
                    {formatFloorPlanLabel(result.floorLabel)}
                  </Text>
                </View>
                <Text className="flex-1 text-black text-body05" numberOfLines={1}>
                  {result.text}
                </Text>
                <ArrowRightIcon size={16} className="text-grey-30" />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text className="py-3 text-grey-40 text-caption02">이 건물 안내도에서 찾지 못했어요</Text>
        ))}
    </View>
  );
}
