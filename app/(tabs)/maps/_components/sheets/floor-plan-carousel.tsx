import {
  getFloorPlan,
  getFloorPlanContentViewBox,
  getFloorPlanLabels,
  getFloorPlanLayout,
} from '@/assets/map-floors';
import { ArrowRightIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { sortFloorLabels } from '@/lib/maps/floor-plan-search';
import { formatFloorPlanLabel } from '@/lib/maps/format';
import { cn } from '@/lib/utils';
import * as React from 'react';
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  View,
  type ViewStyle,
} from 'react-native';
import { NativeViewGestureHandler } from 'react-native-gesture-handler';

// 카드 안쪽 여백. 도면이 카드 가장자리에 붙지 않을 만큼만 둔다
const PAGE_PADDING = 10;
// 카드 높이 범위. 가로로 긴 층은 낮게, 정사각형에 가까운 층은 높게 (층마다 높이가 바뀌면 넘길 때 시트가 출렁여서 건물 안 가장 높은 층에 맞춘다)
const MIN_HEIGHT = 170;
const MAX_HEIGHT = 380;
// 넘기는 동안 그려 둘 앞뒤 층 수 (도면 SVG가 무거워 모든 층을 한 번에 그리지 않는다)
const RENDER_RANGE = 1;
// 웹은 pagingEnabled가 CSS scroll-snap(mandatory)이라 한 번 세게 밀면 관성으로 여러 층을 건너뛴다.
// 페이지마다 멈추게(scroll-snap-stop: always) 해서 앱처럼 한 번에 한 층씩 넘어가게 한다.
// RN 타입에는 없는 CSS 속성이라 react-native-web이 그대로 넘기도록 웹에서만 붙인다
const WEB_SNAP_STOP =
  Platform.OS === 'web'
    ? ({ scrollSnapAlign: 'start', scrollSnapStop: 'always' } as unknown as ViewStyle)
    : undefined;

// 건물 시트의 층별 안내도 카드. 층마다 한 장씩 좌우로 넘겨 보고, 도면은 잘리지 않게 층 모양 전체를 카드에 꽉 맞춰 그린다.
// 처음엔 1층(없으면 가장 아래층)을 보여주고, 누르면 그 층 안내도 화면이 열린다. 도면이 없는 건물은 아무것도 그리지 않는다
export default function FloorPlanCarousel({
  buildingId,
  buildingName,
  header,
  onOpenFloor,
}: {
  buildingId: string;
  buildingName: string;
  // 카드 맨 위(도면 위)에 붙일 내용. 호실 검색창을 도면과 한 카드로 묶어 눈에 띄게 한다
  header?: React.ReactNode;
  onOpenFloor: (floorLabel: string) => void;
}) {
  const floorLabels = React.useMemo(
    () => sortFloorLabels(getFloorPlanLabels(buildingId)),
    [buildingId]
  );
  const startIndex = Math.max(0, floorLabels.indexOf('F1'));
  const [pageWidth, setPageWidth] = React.useState(0);
  const [pageIndex, setPageIndex] = React.useState(startIndex);
  const scrollRef = React.useRef<ScrollView>(null);
  const didScrollToStartRef = React.useRef(false);

  const height = React.useMemo(() => {
    if (pageWidth === 0) return MIN_HEIGHT;
    const innerWidth = pageWidth - PAGE_PADDING * 2;
    const tallest = Math.max(
      ...floorLabels.map((label) => {
        const content = getFloorPlanLayout(buildingId, label)?.content;
        if (!content) return 0;
        const [minX, minY, maxX, maxY] = content;
        return (innerWidth * (maxY - minY)) / (maxX - minX);
      })
    );
    return Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, tallest + PAGE_PADDING * 2));
  }, [buildingId, floorLabels, pageWidth]);

  if (floorLabels.length === 0) return null;

  function onLayout(event: LayoutChangeEvent) {
    setPageWidth(event.nativeEvent.layout.width);
  }

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (pageWidth === 0) return;
    const next = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    setPageIndex((prev) => (prev === next ? prev : next));
  }

  const currentLabel = floorLabels[pageIndex] ?? floorLabels[startIndex];

  return (
    <View className="mx-4 overflow-hidden rounded-2xl border border-grey-10 bg-grey-02">
      {header}
      {/* 아래 표시들을 도면 영역 기준으로 놓으려고 한 번 더 감싼다 */}
      <View>
        {/* 페이지 폭은 테두리 안쪽 폭이어야 넘길 때 한 장씩 정확히 맞는다 */}
        <View onLayout={onLayout} style={{ minHeight: height }}>
          {pageWidth > 0 && (
            <NativeViewGestureHandler disallowInterruption>
              <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                nestedScrollEnabled
                directionalLockEnabled
                showsHorizontalScrollIndicator={false}
                contentOffset={{ x: startIndex * pageWidth, y: 0 }}
                // contentOffset을 무시하는 플랫폼(웹)에서도 1층에서 시작하도록 처음 한 번만 맞춘다
                onLayout={() => {
                  if (didScrollToStartRef.current) return;
                  didScrollToStartRef.current = true;
                  scrollRef.current?.scrollTo({ x: startIndex * pageWidth, animated: false });
                }}
                onScroll={onScroll}
                scrollEventThrottle={16}
              >
                {floorLabels.map((label, index) => {
                  const FloorPlan = getFloorPlan(buildingId, label);
                  const viewBox = getFloorPlanContentViewBox(buildingId, label);
                  const isNear = Math.abs(index - pageIndex) <= RENDER_RANGE;
                  return (
                    <Pressable
                      key={label}
                      accessibilityRole="button"
                      accessibilityLabel={`${buildingName} ${formatFloorPlanLabel(label)} 층별 안내도 크게 보기`}
                      onPress={() => onOpenFloor(label)}
                      style={[{ width: pageWidth, height, padding: PAGE_PADDING }, WEB_SNAP_STOP]}
                    >
                      {/* viewBox를 undefined로 넘기면 도면 원래 viewBox가 지워지므로 있을 때만 넘긴다 */}
                      {FloorPlan && isNear && (
                        <FloorPlan width="100%" height="100%" {...(viewBox ? { viewBox } : {})} />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </NativeViewGestureHandler>
          )}
        </View>

        {/* 도면 위에 얹는 표시. 누르기는 아래 도면 페이지가 받는다 */}
        <View
          className="absolute left-3 top-3 rounded-full bg-blue-35 px-2.5 py-1"
          pointerEvents="none"
        >
          <Text className="text-white text-caption01">{formatFloorPlanLabel(currentLabel)}</Text>
        </View>
        <View
          className="absolute right-3 top-3 flex-row items-center gap-0.5 rounded-full bg-white/90 py-1 pl-2.5 pr-1.5"
          pointerEvents="none"
        >
          <Text className="text-grey-80 text-caption01">크게 보기</Text>
          <ArrowRightIcon size={14} className="text-grey-60" />
        </View>
        {floorLabels.length > 1 && (
          <View
            className="absolute bottom-2.5 left-0 right-0 flex-row justify-center gap-1"
            pointerEvents="none"
          >
            {floorLabels.map((label, index) => (
              <View
                key={label}
                className={cn(
                  'h-1.5 rounded-full',
                  index === pageIndex ? 'w-3.5 bg-blue-35' : 'w-1.5 bg-grey-20'
                )}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
