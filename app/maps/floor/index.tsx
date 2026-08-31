import { getBuildingDetail } from '@/api/maps';
import { getFloorPlan, getFloorPlanLabels } from '@/assets/map-floors';
import { ArrowLeftIcon, XThinIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { CAMPUS_LATITUDE, CAMPUS_LONGITUDE } from '@/lib/maps/campus';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { LayoutChangeEvent, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FloorSelector from './_components/floor-selector';

const MIN_SCALE = 1;
const MAX_SCALE = 4;

// 도면 가장자리에서 더 끌어낼 수 있는 여유 폭(px). 도면이 세로로 길쭉해 좌우가 남고,
// 좌측 하단 층 선택 UI에 가려지는 부분도 있어서 배율 1에서도 좌우로 밀어볼 수 있게 한다.
const PAN_GAP_X = 80;
const PAN_GAP_Y = 0;

function clampValue(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

// 현재 배율에서 이동 가능한 범위 (확대된 만큼 + 위 여유 갭)
function getPanBounds(currentScale: number, viewportW: number, viewportH: number) {
  'worklet';
  return {
    maxX: ((currentScale - 1) * viewportW) / 2 + PAN_GAP_X,
    maxY: ((currentScale - 1) * viewportH) / 2 + PAN_GAP_Y,
  };
}

// 건물 층별 안내도 화면 - (tabs) 바깥의 최상위 라우트라 하단 네비게이션 바까지 덮으며 push된다
// (app/notifications, app/posts, app/search와 동일한 패턴)
export default function MapFloorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { buildingId, floorLabel, highlightPlaceId } = useLocalSearchParams<{
    buildingId?: string;
    floorLabel?: string;
    highlightPlaceId?: string;
  }>();

  // 헤더에 표시할 건물명 조회.
  // 지도 화면의 건물 상세와 쿼리 키·인자를 맞춰뒀기 때문에, 건물 상세 시트에서 들어온 경우엔
  // 이미 캐시된 값을 그대로 써서 로딩 없이 이름이 바로 보인다 (딥링크 진입 시에만 실제로 요청이 나감)
  const numericBuildingId = Number(buildingId);
  const { data: building } = useQuery({
    queryKey: ['map-building-detail', numericBuildingId],
    queryFn: () => getBuildingDetail(numericBuildingId, CAMPUS_LATITUDE, CAMPUS_LONGITUDE),
    enabled: Number.isFinite(numericBuildingId),
  });

  // 도면이 준비된 층 목록과 현재 선택된 층. 백엔드 floorLabel('B1','F1'...)이 곧 도면 파일명이라 그대로 식별자로 쓴다
  const floorLabels = React.useMemo(() => getFloorPlanLabels(buildingId ?? ''), [buildingId]);
  const [selectedFloorLabel, setSelectedFloorLabel] = React.useState(() =>
    floorLabel && floorLabels.includes(floorLabel) ? floorLabel : (floorLabels[0] ?? null)
  );

  const FloorPlan = selectedFloorLabel ? getFloorPlan(buildingId ?? '', selectedFloorLabel) : null;

  // 도면 뷰포트의 확대 배율/이동량
  const scale = useSharedValue(MIN_SCALE);
  const savedScale = useSharedValue(MIN_SCALE);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  // 이동 가능 범위 계산에 뷰포트 크기가 필요해서 onLayout으로 채운다
  const viewportWidth = useSharedValue(0);
  const viewportHeight = useSharedValue(0);
  const [viewportSize, setViewportSize] = React.useState({ width: 0, height: 0 });

  function onViewportLayout({ nativeEvent }: LayoutChangeEvent) {
    const { width, height } = nativeEvent.layout;
    viewportWidth.value = width;
    viewportHeight.value = height;
    setViewportSize({ width, height });
  }

  function resetViewport() {
    scale.value = withTiming(MIN_SCALE);
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedScale.value = MIN_SCALE;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = clampValue(savedScale.value * event.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      // 축소하면서 도면이 뷰포트 밖으로 밀려나 있을 수 있어 경계 안으로 되돌린다
      const { maxX, maxY } = getPanBounds(scale.value, viewportWidth.value, viewportHeight.value);
      savedTranslateX.value = clampValue(translateX.value, -maxX, maxX);
      savedTranslateY.value = clampValue(translateY.value, -maxY, maxY);
      translateX.value = withTiming(savedTranslateX.value);
      translateY.value = withTiming(savedTranslateY.value);
    });

  // 확대된 만큼 + 여유 갭(PAN_GAP_X/Y)만큼 이동 가능
  const pan = Gesture.Pan()
    .onUpdate((event) => {
      const { maxX, maxY } = getPanBounds(scale.value, viewportWidth.value, viewportHeight.value);
      translateX.value = clampValue(savedTranslateX.value + event.translationX, -maxX, maxX);
      translateY.value = clampValue(savedTranslateY.value + event.translationY, -maxY, maxY);
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // 더블탭으로 원래 배율 복귀
  const doubleTap = Gesture.Tap().numberOfTaps(2).onEnd(resetViewport);

  const viewportGesture = Gesture.Race(doubleTap, Gesture.Simultaneous(pinch, pan));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // 층을 바꾸면 확대/이동 상태 초기화 (이전 층에서 확대해둔 채로 열리면 어색함)
  function onSelectFloor(nextFloorLabel: string) {
    setSelectedFloorLabel(nextFloorLabel);
    resetViewport();
  }

  // 뒤로가기: 이전 화면(건물 상세 시트 등)으로 복귀
  function onBackPress() {
    router.back();
  }

  // 닫기: 이 화면은 항상 지도 화면(건물 상세 시트)에서 push로만 진입하므로(외부 딥링크 진입 없음),
  // router.navigate('/maps')로 새 스택을 열지 않고 back()으로 기존 지도 화면으로 되돌아간다
  function onClosePress() {
    router.back();
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* 헤더 */}
      <View className="h-[60px] flex-row items-center gap-2 border-b border-grey-10 bg-white">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          onPress={onBackPress}
          hitSlop={8}
          className="ms-3.5"
        >
          <ArrowLeftIcon size={24} className="text-grey-20" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-body02 text-black" numberOfLines={1}>
          {building?.name ?? '층별 안내도'}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="닫기"
          onPress={onClosePress}
          hitSlop={8}
          className="me-4"
        >
          <XThinIcon size={24} className="text-grey-20" />
        </TouchableOpacity>
      </View>

      {/* 도면 뷰포트 - 이 영역 안에서만 확대/이동되고 헤더·층 선택 UI는 영향받지 않는다
          (bg-grey-02 = #f5f7f9 로, 도면 SVG가 갖고 있는 자체 배경색과 동일해 여백이 이어져 보인다) */}
      <View className="flex-1 overflow-hidden bg-grey-02" onLayout={onViewportLayout}>
        {FloorPlan ? (
          <GestureDetector gesture={viewportGesture}>
            <Animated.View className="flex-1" style={contentStyle}>
              {viewportSize.width > 0 && (
                <FloorPlan width={viewportSize.width} height={viewportSize.height} />
              )}
            </Animated.View>
          </GestureDetector>
        ) : (
          <View className="flex-1 items-center justify-center gap-1">
            <Text className="text-body04 text-grey-40">준비 중인 도면이에요</Text>
            <Text className="text-caption02 text-grey-20">
              buildingId: {buildingId ?? '-'} / floorLabel: {floorLabel ?? '-'}
              {highlightPlaceId ? ` / highlightPlaceId: ${highlightPlaceId}` : ''}
            </Text>
          </View>
        )}
      </View>

      {/* 좌측 하단 층 선택 UI */}
      <View style={{ position: 'absolute', left: 16, bottom: insets.bottom + 16 }}>
        <FloorSelector
          floorLabels={floorLabels}
          selectedFloorLabel={selectedFloorLabel}
          onSelectFloor={onSelectFloor}
        />
      </View>
    </View>
  );
}
