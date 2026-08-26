import { Text } from '@/components/ui/text';
import { formatMapFloorLabel } from '@/lib/maps/format';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { LayoutChangeEvent, ScrollView, TouchableOpacity, View } from 'react-native';

// 층 항목 하나의 높이(px). 아래 TouchableOpacity의 h-10과 반드시 같아야 한다 (스크롤 위치 계산에 쓰임)
const ITEM_HEIGHT = 40;

interface FloorSelectorProps {
  // 건물 상세 API의 floorLabel('B1', 'F1', 'F2'...) 목록. 도면 파일명과 동일한 값이라 그대로 식별자로 쓴다
  floorLabels: string[];
  selectedFloorLabel: string | null;
  onSelectFloor: (floorLabel: string) => void;
}

// 층별 안내도 화면 좌측 하단의 세로 층 선택 UI (도면 위에 떠 있는 알약 모양 리스트)
// 위에서부터 높은 층 → 아래로 갈수록 낮은 층(지하) 순으로 보여준다
export default function FloorSelector({
  floorLabels,
  selectedFloorLabel,
  onSelectFloor,
}: FloorSelectorProps) {
  const sortedLabels = [...floorLabels].sort((a, b) => floorSortValue(b) - floorSortValue(a));

  const scrollRef = React.useRef<ScrollView>(null);
  const containerHeightRef = React.useRef(0);
  const contentHeightRef = React.useRef(0);
  // 최초 진입 때 한 번만 중앙 정렬한다 (이후 사용자가 층을 고를 땐 이미 보이는 항목을 누른 것이라 스크롤을 건드리지 않음)
  const hasCenteredRef = React.useRef(false);

  // 선택된 층이 리스트 중앙에 오도록 스크롤. 컨테이너/콘텐츠 높이가 모두 측정된 뒤에만 동작한다
  function centerSelectedFloor() {
    if (hasCenteredRef.current || !selectedFloorLabel) return;

    const containerHeight = containerHeightRef.current;
    const contentHeight = contentHeightRef.current;
    if (containerHeight === 0 || contentHeight === 0) return;

    const index = sortedLabels.indexOf(selectedFloorLabel);
    if (index === -1) return;

    const centeredOffset = index * ITEM_HEIGHT + ITEM_HEIGHT / 2 - containerHeight / 2;
    const maxOffset = Math.max(0, contentHeight - containerHeight);
    scrollRef.current?.scrollTo({
      y: Math.min(Math.max(centeredOffset, 0), maxOffset),
      animated: false,
    });
    hasCenteredRef.current = true;
  }

  function onScrollViewLayout({ nativeEvent }: LayoutChangeEvent) {
    containerHeightRef.current = nativeEvent.layout.height;
    centerSelectedFloor();
  }

  function onContentSizeChange(_width: number, height: number) {
    contentHeightRef.current = height;
    centerSelectedFloor();
  }

  if (sortedLabels.length === 0) return null;

  return (
    // 그림자용 View와 클리핑용 View를 분리한다. iOS에서 overflow: hidden은 masksToBounds로 매핑돼
    // 뷰 바깥에 그려지는 그림자까지 잘라버리기 때문에, 한 View에 둘을 같이 주면 iOS에서만 그림자가 사라진다
    <View
      className="max-h-[200px] w-12 rounded-full bg-white"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 5,
      }}
    >
      <View className="overflow-hidden rounded-full">
        <ScrollView
          ref={scrollRef}
          bounces={false}
          showsVerticalScrollIndicator={false}
          onLayout={onScrollViewLayout}
          onContentSizeChange={onContentSizeChange}
        >
          {sortedLabels.map((floorLabel) => {
            const active = floorLabel === selectedFloorLabel;

            return (
              <TouchableOpacity
                key={floorLabel}
                accessibilityRole="button"
                accessibilityLabel={`${formatMapFloorLabel(floorLabel)}층 안내도 보기`}
                onPress={() => onSelectFloor(floorLabel)}
                className={cn('h-10 items-center justify-center', active && 'bg-blue-02')}
                hitSlop={4}
              >
                <Text className={cn('text-body05', active ? 'text-blue-35' : 'text-grey-60')}>
                  {formatFloorSelectorLabel(floorLabel)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

// 선택 리스트 표시 전용 라벨: 지상층은 'F1' → '1F'처럼 층수를 앞에 두고 F를 뒤에 붙인다
// (formatMapFloorLabel은 'F1' → '1'만 반환하는 공용 포맷이라 다른 화면과 표기가 갈릴 수 있어 여기서만 별도 처리)
// 지하층('B1' 등)은 그대로 둔다
function formatFloorSelectorLabel(floorLabel: string) {
  return floorLabel.replace(/^F(\d+)$/i, '$1F');
}

// 정렬용 숫자값: 'F3' → 3, 'B1' → -1 (지하는 아래쪽에 오도록 음수)
function floorSortValue(floorLabel: string): number {
  const match = floorLabel.match(/^([BF])(\d+)$/i);
  if (!match) return 0;

  const [, prefix, digits] = match;
  const value = Number(digits);
  return prefix.toUpperCase() === 'B' ? -value : value;
}
