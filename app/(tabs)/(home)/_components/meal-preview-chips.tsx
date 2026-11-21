import { Text } from '@/components/ui/text';
import * as React from 'react';
import { type LayoutChangeEvent, View } from 'react-native';

// 메뉴 칩 한 줄 높이(py-1 위아래 8 + 글자 줄 높이 19.5)와 칩 사이 간격. 아래 칩 className과 맞춘다
const CHIP_HEIGHT = 27.5;
const CHIP_GAP = 5;

// 홈 학식 카드의 메뉴 칩. maxRows 줄까지만 보여주고 넘치는 메뉴는 "외 N개"로 줄인다.
// 칩 폭이 메뉴 이름마다 달라 몇 개가 들어갈지 미리 알 수 없어서, 보이지 않는 측정용 칩을 같은 폭에 모두 깔아 각 칩의 줄(y)을 재고
// 앞의 maxRows 줄에 들어간 만큼만 그린다. 넘치면 마지막 줄에 "외 N개" 자리를 두려고 한 개를 더 뺀다
export default function MealPreviewChips({ meals, maxRows }: { meals: string[]; maxRows: number }) {
  const maxHeight = maxRows * CHIP_HEIGHT + (maxRows - 1) * CHIP_GAP;
  const mealsKey = meals.join('|');
  // 잰 칩 위치는 어떤 메뉴 목록을 잰 것인지와 같이 둔다. 메뉴가 바뀌면 측정용 칩을 새로 깔아(key) 다시 잰다
  const [measured, setMeasured] = React.useState<{ key: string; tops: Record<number, number> }>({
    key: '',
    tops: {},
  });
  const chipTops = measured.key === mealsKey ? measured.tops : {};

  const isMeasured = meals.every((_, index) => chipTops[index] !== undefined);
  const fittingCount = meals.filter(
    (_, index) => (chipTops[index] ?? Infinity) + CHIP_HEIGHT <= maxHeight + 1
  ).length;
  const visibleCount = fittingCount >= meals.length ? meals.length : Math.max(fittingCount - 1, 1);
  const hiddenCount = meals.length - visibleCount;

  function onChipLayout(index: number, event: LayoutChangeEvent) {
    const { y } = event.nativeEvent.layout;
    setMeasured((previous) => {
      const tops = previous.key === mealsKey ? previous.tops : {};
      return tops[index] === y ? previous : { key: mealsKey, tops: { ...tops, [index]: y } };
    });
  }

  return (
    <View>
      {/* 측정용: 화면에 보이지 않고 높이에도 끼지 않는다 */}
      <View
        key={mealsKey}
        pointerEvents="none"
        className="absolute left-0 right-0 flex-row flex-wrap gap-[5px] opacity-0"
      >
        {meals.map((meal, index) => (
          <MealChip
            key={`${index}:${meal}`}
            meal={meal}
            onLayout={(event) => onChipLayout(index, event)}
          />
        ))}
      </View>
      <View
        className="flex-row flex-wrap gap-[5px] overflow-hidden"
        style={{ maxHeight: maxHeight }}
      >
        {isMeasured &&
          meals
            .slice(0, visibleCount)
            .map((meal, index) => <MealChip key={`${index}:${meal}`} meal={meal} />)}
        {isMeasured && hiddenCount > 0 && (
          <Text className="self-center text-grey-40 text-caption02">외 {hiddenCount}개</Text>
        )}
      </View>
    </View>
  );
}

function MealChip({
  meal,
  onLayout,
}: {
  meal: string;
  onLayout?: (event: LayoutChangeEvent) => void;
}) {
  return (
    <View onLayout={onLayout} className="max-w-full rounded-[6px] bg-white px-[7px] py-1">
      <Text className="text-[13px] leading-[19.5px] text-black" numberOfLines={1}>
        {meal}
      </Text>
    </View>
  );
}
