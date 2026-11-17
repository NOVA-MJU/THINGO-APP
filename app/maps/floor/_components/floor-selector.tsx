import { Text } from '@/components/ui/text';
import { formatFloorPlanLabel, formatMapFloorLabel } from '@/lib/maps/format';
import { cn } from '@/lib/utils';
import * as React from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';

// 층 항목 하나의 높이(px). 아래 TouchableOpacity의 h-10과 반드시 같아야 한다 (스크롤 위치 계산에 쓰임)
const ITEM_HEIGHT = 40;
// 한 번에 보이는 층 수 (층이 이보다 적으면 층 수만큼)
const MAX_VISIBLE_ITEMS = 5;
// 스크롤이 멈췄다고 보고 가운데 층을 고르기까지 기다리는 시간. 넘기는 중간마다 무거운 도면을 다시 그리지 않게 한다
const SETTLE_MS = 140;
// 웹은 snapToInterval이 없어서 CSS scroll-snap으로 항목 가운데에 멈추게 한다 (RN 타입에 없는 CSS 속성이라 웹에서만 붙인다)
const WEB_SNAP_CONTAINER =
  Platform.OS === 'web' ? ({ scrollSnapType: 'y mandatory' } as unknown as ViewStyle) : undefined;
const WEB_SNAP_ITEM =
  Platform.OS === 'web' ? ({ scrollSnapAlign: 'center' } as unknown as ViewStyle) : undefined;

interface FloorSelectorProps {
  // 건물 상세 API의 floorLabel('B1', 'F1', 'F2'...) 목록. 도면 파일명과 동일한 값이라 그대로 식별자로 쓴다
  floorLabels: string[];
  selectedFloorLabel: string | null;
  onSelectFloor: (floorLabel: string) => void;
}

// 층별 안내도 화면 좌측 하단의 세로 층 선택 UI (도면 위에 떠 있는 알약 모양 리스트)
// 위에서부터 높은 층 → 아래로 갈수록 낮은 층(지하) 순으로 보여준다.
// 엘리베이터 층 표시처럼 지금 보는 층 표시(파란 칸)는 항상 가운데에 고정돼 있고, 층 목록이 위아래로 움직인다.
// 목록을 굴려 멈추면 가운데 층이 선택되고, 층을 누르거나 다른 경로로 층이 바뀌면 그 층이 가운데로 굴러온다
export default function FloorSelector({
  floorLabels,
  selectedFloorLabel,
  onSelectFloor,
}: FloorSelectorProps) {
  const sortedLabels = React.useMemo(
    () => [...floorLabels].sort((a, b) => floorSortValue(b) - floorSortValue(a)),
    [floorLabels]
  );
  const visibleCount = Math.min(sortedLabels.length, MAX_VISIBLE_ITEMS);
  const height = visibleCount * ITEM_HEIGHT;
  // 맨 위·맨 아래 층도 가운데까지 올 수 있게 위아래로 비워 둔다. 그러면 i번째 층이 가운데일 때 스크롤 위치가 i * ITEM_HEIGHT
  const edgePadding = (height - ITEM_HEIGHT) / 2;

  const selectedIndex = selectedFloorLabel ? sortedLabels.indexOf(selectedFloorLabel) : -1;
  // 굴리는 동안 가운데에 온 층 (멈추기 전에도 글자 색을 바로 바꿔 준다)
  const [centeredIndex, setCenteredIndex] = React.useState(selectedIndex);
  const scrollRef = React.useRef<ScrollView>(null);
  const offsetRef = React.useRef(0);
  const settleTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasScrolledRef = React.useRef(false);

  // 선택된 층이 바뀌면(처음 열 때, 층을 눌렀을 때, 굴려서 골랐을 때) 그 층을 가운데로. 이미 가운데면 그대로 둔다
  React.useEffect(() => {
    if (selectedIndex === -1) return;
    setCenteredIndex(selectedIndex);
    const y = selectedIndex * ITEM_HEIGHT;
    if (Math.abs(offsetRef.current - y) < 1) return;
    scrollRef.current?.scrollTo({ y, animated: hasScrolledRef.current });
    hasScrolledRef.current = true;
  }, [selectedIndex]);

  React.useEffect(
    () => () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    },
    []
  );

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const y = event.nativeEvent.contentOffset.y;
    offsetRef.current = y;
    const index = Math.min(Math.max(Math.round(y / ITEM_HEIGHT), 0), sortedLabels.length - 1);
    setCenteredIndex((prev) => (prev === index ? prev : index));

    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => {
      const label = sortedLabels[index];
      if (label && label !== selectedFloorLabel) onSelectFloor(label);
    }, SETTLE_MS);
  }

  if (sortedLabels.length === 0) return null;

  return (
    // 그림자용 View와 클리핑용 View를 분리한다. iOS에서 overflow: hidden은 masksToBounds로 매핑돼
    // 뷰 바깥에 그려지는 그림자까지 잘라버리기 때문에, 한 View에 둘을 같이 주면 iOS에서만 그림자가 사라진다
    <View
      className="w-12 rounded-full bg-white"
      style={{
        height,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 5,
      }}
    >
      <View className="flex-1 overflow-hidden rounded-full">
        {/* 지금 보는 층 표시. 목록 뒤에 고정돼 있고 층 글자만 그 위로 지나간다 */}
        <View
          pointerEvents="none"
          className="absolute left-1 right-1 rounded-full bg-blue-02"
          style={{ top: edgePadding, height: ITEM_HEIGHT }}
        />
        <ScrollView
          ref={scrollRef}
          bounces={false}
          showsVerticalScrollIndicator={false}
          // 처음 그릴 때부터 선택된 층이 가운데에 있게 (iOS는 아래 scrollTo 전에 한 번 그려진다)
          contentOffset={{ x: 0, y: Math.max(selectedIndex, 0) * ITEM_HEIGHT }}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={onScroll}
          style={WEB_SNAP_CONTAINER}
          contentContainerStyle={{ paddingVertical: edgePadding }}
        >
          {sortedLabels.map((floorLabel, index) => {
            const active = index === centeredIndex;

            return (
              <TouchableOpacity
                key={floorLabel}
                accessibilityRole="button"
                accessibilityLabel={`${formatMapFloorLabel(floorLabel)}층 안내도 보기`}
                accessibilityState={{ selected: floorLabel === selectedFloorLabel }}
                onPress={() => onSelectFloor(floorLabel)}
                className="h-10 items-center justify-center"
                style={WEB_SNAP_ITEM}
              >
                <Text
                  className={cn(active ? 'text-blue-35 text-body04' : 'text-grey-60 text-body05')}
                >
                  {formatFloorPlanLabel(floorLabel)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

// 정렬용 숫자값: 'F3' → 3, 'B1' → -1 (지하는 아래쪽에 오도록 음수)
function floorSortValue(floorLabel: string): number {
  const match = floorLabel.match(/^([BF])(\d+)$/i);
  if (!match) return 0;

  const [, prefix, digits] = match;
  const value = Number(digits);
  return prefix.toUpperCase() === 'B' ? -value : value;
}
