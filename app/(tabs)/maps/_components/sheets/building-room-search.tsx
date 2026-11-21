import { MAP_FLOOR_PLANS } from '@/assets/map-floors';
import { ArrowRightIcon, SearchIcon, XThinIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { searchBuildingsFloorPlanTexts, searchFloorPlanTexts } from '@/lib/maps/floor-plan-search';
import { loadBuildingFloorPlans } from '@/lib/maps/floor-plan-buildings';
import { formatFloorPlanLabel } from '@/lib/maps/format';
import { cn } from '@/lib/utils';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Pressable, type TextStyle, TouchableOpacity, View } from 'react-native';

// 한 번에 보여줄 결과 수 (시트가 너무 길어지지 않게)
const MAX_RESULTS = 8;
const MAX_OTHER_BUILDING_RESULTS = 5;
// 웹에서 입력하면 브라우저 포커스 테두리(:focus-visible, outline auto)가 검게 그려진다. auto는 굵기 0도 무시해서 none으로 꺼야 하는데
// RN 타입에는 'none'이 없다 (react-native-web은 그대로 CSS로 넘긴다). className은 BottomSheetTextInput에 적용되지 않는다
const WEB_NO_OUTLINE = { outlineStyle: 'none' } as unknown as TextStyle;

// 건물 시트의 호실·시설 검색. 층별 안내도 카드 맨 위에 붙어 있다. 이 건물 층별 안내도에 적힌 글자에서 찾고(서버를 거치지 않음),
// 누르면 그 층 안내도를 열어 찾은 글자를 강조한다. 도면이 없는 건물은 그리지 않는다.
// 이 건물에 없으면 다른 건물 도면에서 찾아 어느 건물 몇 층인지 같이 보여준다
export default function BuildingRoomSearch({
  buildingId,
  buildingNames,
  onOpenRoom,
}: {
  buildingId: string;
  // 다른 건물 결과에 붙일 이름 (건물 id → 이름)
  buildingNames: Record<string, string>;
  onOpenRoom: (buildingId: string, floorLabel: string, target: string) => void;
}) {
  const [query, setQuery] = React.useState('');

  const current = React.useMemo(() => loadBuildingFloorPlans(buildingId), [buildingId]);
  const others = React.useMemo(
    () =>
      Object.keys(MAP_FLOOR_PLANS)
        .filter((id) => id !== buildingId)
        .map(loadBuildingFloorPlans),
    [buildingId]
  );
  const results = React.useMemo(
    () => searchFloorPlanTexts(current.floors, current.floorOrder, query, MAX_RESULTS),
    [current, query]
  );
  // 이 건물에서 하나라도 찾으면 다른 건물은 보지 않는다 ('화장실'처럼 어느 건물에나 있는 이름이 섞이지 않게)
  const otherResults = React.useMemo(
    () =>
      results.length > 0
        ? []
        : searchBuildingsFloorPlanTexts(others, query, MAX_OTHER_BUILDING_RESULTS),
    [others, query, results.length]
  );

  if (current.floorOrder.length === 0) return null;

  const hasQuery = query.trim().length > 0;
  const isEmpty = hasQuery && results.length === 0 && otherResults.length === 0;

  // 카드 안의 "크게 보기" 알약과 같은 흰 알약 모양으로 작게 둔다. 결과가 없을 때도 줄을 늘리지 않고 입력창 안에 짧게 알린다
  return (
    <View className="gap-1.5 px-2 pt-2">
      <View className="h-9 flex-row items-center gap-1.5 rounded-full border border-grey-10 bg-white pl-3 pr-2.5">
        <SearchIcon size={16} className="text-grey-40" />
        <BottomSheetTextInput
          value={query}
          onChangeText={setQuery}
          placeholder="강의실·시설 찾기 (예: 1353)"
          placeholderTextColor="#909499"
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          style={[{ flex: 1, fontSize: 13, color: '#0B1215', paddingVertical: 0 }, WEB_NO_OUTLINE]}
        />
        {isEmpty && <Text className="text-grey-40 text-caption02">결과 없음</Text>}
        {hasQuery && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="검색어 지우기"
            hitSlop={8}
            onPress={() => setQuery('')}
          >
            <XThinIcon size={14} className="text-grey-40" />
          </Pressable>
        )}
      </View>

      {(results.length > 0 || otherResults.length > 0) && (
        <View className="rounded-xl bg-white px-3 py-1">
          {results.map((result, index) => (
            <TouchableOpacity
              key={`${result.floorLabel}:${result.key}`}
              accessibilityRole="button"
              accessibilityLabel={`${formatFloorPlanLabel(result.floorLabel)} ${result.text} 안내도에서 보기`}
              activeOpacity={0.7}
              onPress={() => onOpenRoom(buildingId, result.floorLabel, result.key)}
              className={cn(
                'flex-row items-center gap-2.5 py-2',
                index > 0 && 'border-t border-grey-02'
              )}
            >
              <FloorBadge floorLabel={result.floorLabel} />
              <Text className="flex-1 text-black text-body05" numberOfLines={1}>
                {result.text}
              </Text>
              <ArrowRightIcon size={14} className="text-grey-30" />
            </TouchableOpacity>
          ))}

          {otherResults.length > 0 && (
            <Text className="pt-1.5 text-grey-40 text-caption03">
              이 건물엔 없고 다른 건물에 있어요
            </Text>
          )}
          {otherResults.map((result, index) => {
            const buildingName = buildingNames[result.buildingId] ?? '다른 건물';
            return (
              <TouchableOpacity
                key={`${result.buildingId}:${result.floorLabel}:${result.key}`}
                accessibilityRole="button"
                accessibilityLabel={`${buildingName} ${formatFloorPlanLabel(result.floorLabel)} ${result.text} 안내도에서 보기`}
                activeOpacity={0.7}
                onPress={() => onOpenRoom(result.buildingId, result.floorLabel, result.key)}
                className={cn(
                  'flex-row items-center gap-2 py-2',
                  index > 0 && 'border-t border-grey-02'
                )}
              >
                <Text className="text-black text-body04">{buildingName}</Text>
                <FloorBadge floorLabel={result.floorLabel} />
                <Text className="flex-1 text-black text-body05" numberOfLines={1}>
                  {result.text}
                </Text>
                <ArrowRightIcon size={14} className="text-grey-30" />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

function FloorBadge({ floorLabel }: { floorLabel: string }) {
  return (
    <View className="min-w-[36px] items-center rounded-md bg-blue-05 px-1.5 py-0.5">
      <Text className="text-blue-35 text-caption01">{formatFloorPlanLabel(floorLabel)}</Text>
    </View>
  );
}
