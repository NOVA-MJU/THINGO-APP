import { getBuildingDetail } from '@/api/maps';
import {
  findFloorPlanTargetTexts,
  getFloorPlan,
  getFloorPlanLabels,
  getFloorPlanLayout,
} from '@/assets/map-floors';
import { CATEGORY_MARKER_ACTIVE_IMAGES } from '@/assets/map-markers';
import { ArrowLeftIcon, MinusIcon, PlusIcon, XThinIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { CAMPUS_LATITUDE, CAMPUS_LONGITUDE } from '@/lib/maps/campus';
import { formatFloorPlanLabel } from '@/lib/maps/format';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { Image, LayoutChangeEvent, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FloorPlanDrawing from './_components/floor-plan-drawing';
import FloorSelector from './_components/floor-selector';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
// +/- 버튼 한 번에 바뀌는 배율
const ZOOM_STEP = 1.5;
// 대상 핀은 명지도 지도의 선택(active) 마커와 같은 PNG·크기를 쓴다 (components/naver-map의 ACTIVE_MARKER_WIDTH/HEIGHT)
const TARGET_PIN_WIDTH = 24;
const TARGET_PIN_HEIGHT = 32;
// 확대한 상태를 선명하게 다시 그릴 때 화면 바깥으로 더 그려두는 비율(한쪽 기준).
// 이동하는 동안 이만큼은 선명한 그림이 따라오고, 그 너머만 기본(흐린) 레이어가 보인다
const SHARP_MARGIN = 0.25;

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
  const { buildingId, floorLabel, placeId, target, markerIcon } = useLocalSearchParams<{
    buildingId?: string;
    floorLabel?: string;
    placeId?: string;
    // 강조할 도면 텍스트 (서버 링크가 호실 코드, 없으면 장소명을 넣어준다)
    target?: string;
    // 핀 이미지 키 (CATEGORY_MARKER_ACTIVE_IMAGES 키, 검색 화면이 장소 카테고리로 붙여준다)
    markerIcon?: string;
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
  // 확대·이동이 끝난 시점의 배율/이동량. 도면 SVG는 처음 그린 크기의 비트맵을 늘려 보여주기 때문에 확대하면 흐려진다.
  // 그래서 멈춘 상태의 보이는 영역만 viewBox로 잘라 화면 해상도로 다시 그린 레이어를 위에 덮는다 (배율 1이면 필요 없음)
  const [sharpView, setSharpView] = React.useState<{ scale: number; x: number; y: number } | null>(
    null
  );

  const floorLayout = getFloorPlanLayout(buildingId ?? '', selectedFloorLabel ?? '');
  const pinImage =
    CATEGORY_MARKER_ACTIVE_IMAGES[markerIcon ?? ''] ?? CATEGORY_MARKER_ACTIVE_IMAGES.PinIcon;

  // 대상은 링크로 들어온 층에서만 표시한다 (다른 층으로 바꾸면 같은 이름이 있어도 다른 장소)
  const targetTexts = React.useMemo(() => {
    if (!buildingId || !target || selectedFloorLabel !== floorLabel) return [];
    return findFloorPlanTargetTexts(buildingId, floorLabel, target);
  }, [buildingId, floorLabel, selectedFloorLabel, target]);

  // 첫 번째 대상의 핀 위치 (확대 전 뷰포트 좌표). 도면 좌표(viewBox)를 SVG 기본 preserveAspectRatio(xMidYMid meet)와
  // 같은 방식으로 뷰포트에 맞춘다. 층 전체가 보여야 건물 안 위치를 바로 알 수 있어 자동 확대는 하지 않는다
  const targetMarker = React.useMemo(() => {
    const [firstText] = targetTexts;
    if (!firstText || !floorLayout || viewportSize.width === 0) return null;

    const fit = Math.min(
      viewportSize.width / floorLayout.width,
      viewportSize.height / floorLayout.height
    );
    const offsetX = (viewportSize.width - floorLayout.width * fit) / 2;
    const offsetY = (viewportSize.height - floorLayout.height * fit) / 2;
    return {
      x: offsetX + firstText.center[0] * fit,
      top: offsetY + firstText.top * fit,
    };
  }, [floorLayout, targetTexts, viewportSize]);

  function onViewportLayout({ nativeEvent }: LayoutChangeEvent) {
    const { width, height } = nativeEvent.layout;
    viewportWidth.value = width;
    viewportHeight.value = height;
    setViewportSize({ width, height });
  }

  function commitSharpView(nextScale: number, nextX: number, nextY: number) {
    setSharpView(nextScale > MIN_SCALE ? { scale: nextScale, x: nextX, y: nextY } : null);
  }

  function resetViewport() {
    scale.value = withTiming(MIN_SCALE);
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedScale.value = MIN_SCALE;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    setSharpView(null);
  }

  // +/- 버튼: 기준점이 화면에서 제자리에 남도록 확대·축소한다. 찾은 장소가 있으면 그 핀을 기준으로 해서
  // 확대해도 핀이 화면 밖으로 밀려나지 않고, 없으면 화면 가운데를 기준으로 한다.
  // 기준점의 도면 좌표 오프셋 d(뷰포트 중심 기준)가 화면에서 t + d * scale 에 있으므로 t' = t + d * (scale - scale')
  // (핀치 제스처와 같은 최소·최대 배율과 이동 범위를 따른다)
  function zoomBy(factor: number) {
    const currentScale = savedScale.value;
    const nextScale = clampValue(currentScale * factor, MIN_SCALE, MAX_SCALE);
    const anchorX = targetMarker
      ? targetMarker.x - viewportWidth.value / 2
      : -savedTranslateX.value / currentScale;
    const anchorY = targetMarker
      ? targetMarker.top - viewportHeight.value / 2
      : -savedTranslateY.value / currentScale;
    const { maxX, maxY } = getPanBounds(nextScale, viewportWidth.value, viewportHeight.value);
    const nextX = clampValue(
      savedTranslateX.value + anchorX * (currentScale - nextScale),
      -maxX,
      maxX
    );
    const nextY = clampValue(
      savedTranslateY.value + anchorY * (currentScale - nextScale),
      -maxY,
      maxY
    );
    scale.value = withTiming(nextScale);
    translateX.value = withTiming(nextX);
    translateY.value = withTiming(nextY);
    savedScale.value = nextScale;
    savedTranslateX.value = nextX;
    savedTranslateY.value = nextY;
    commitSharpView(nextScale, nextX, nextY);
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
      runOnJS(commitSharpView)(savedScale.value, savedTranslateX.value, savedTranslateY.value);
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
      runOnJS(commitSharpView)(savedScale.value, savedTranslateX.value, savedTranslateY.value);
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

  // 선명한 레이어는 멈춘 상태(sharpView)의 화면을 그린 것이라, 그 뒤 확대·이동한 만큼만 상대적으로 따라가게 한다.
  // 화면 점 q가 멈춘 상태에서 c + t0 + (p - c) * s0 였다면 지금은 c + t + (p - c) * s 이므로
  // 레이어 중심(c) 기준으로 배율 s / s0, 이동 t - t0 * (s / s0) 를 주면 된다.
  // sharpView를 의존성으로 넣어, 새 viewBox로 다시 그리는 렌더와 같은 시점에 기준값이 바뀌게 한다
  const sharpStyle = useAnimatedStyle(() => {
    if (!sharpView) return {};
    const ratio = scale.value / sharpView.scale;
    return {
      transform: [
        { translateX: translateX.value - sharpView.x * ratio },
        { translateY: translateY.value - sharpView.y * ratio },
        { scale: ratio },
      ],
    };
  }, [sharpView]);

  // 멈춘 상태에서 화면(+여유분)에 보이는 도면 영역을 도면 좌표(viewBox)로 바꾼다.
  // 뷰포트 점 p는 화면에서 c + t + (p - c) * s 에 있고, 도면 좌표는 (p - 맞춤 여백) / 맞춤 배율 이다
  const sharpLayer = React.useMemo(() => {
    if (!sharpView || !floorLayout || viewportSize.width === 0) return null;
    const { width, height } = viewportSize;
    const fit = Math.min(width / floorLayout.width, height / floorLayout.height);
    const offsetX = (width - floorLayout.width * fit) / 2;
    const offsetY = (height - floorLayout.height * fit) / 2;
    const layerWidth = width * (1 + SHARP_MARGIN * 2);
    const layerHeight = height * (1 + SHARP_MARGIN * 2);
    const leftX = width / 2 + (-width * SHARP_MARGIN - width / 2 - sharpView.x) / sharpView.scale;
    const topY = height / 2 + (-height * SHARP_MARGIN - height / 2 - sharpView.y) / sharpView.scale;
    return {
      width: layerWidth,
      height: layerHeight,
      viewBox: [
        (leftX - offsetX) / fit,
        (topY - offsetY) / fit,
        layerWidth / sharpView.scale / fit,
        layerHeight / sharpView.scale / fit,
      ].join(' '),
    };
  }, [floorLayout, sharpView, viewportSize]);

  // 핀은 확대해도 지도 마커처럼 크기가 그대로여야 해서 도면(확대 레이어) 밖 최상단에 두고 위치만 따라가게 한다.
  // 확대 레이어의 점 p는 화면에서 c + t + (p - c) * scale 에 그려진다 (c: 뷰포트 중심, t: 이동량)
  const pinStyle = useAnimatedStyle(() => {
    if (!targetMarker) return { opacity: 0 };
    const centerX = viewportWidth.value / 2;
    const centerY = viewportHeight.value / 2;
    return {
      opacity: 1,
      transform: [
        {
          translateX:
            centerX +
            translateX.value +
            (targetMarker.x - centerX) * scale.value -
            TARGET_PIN_WIDTH / 2,
        },
        {
          translateY:
            centerY +
            translateY.value +
            (targetMarker.top - centerY) * scale.value -
            TARGET_PIN_HEIGHT,
        },
      ],
    };
  }, [targetMarker]);

  // 층을 바꾸면 확대/이동 상태 초기화 (이전 층에서 확대해둔 채로 열리면 어색함)
  function onSelectFloor(nextFloorLabel: string) {
    setSelectedFloorLabel(nextFloorLabel);
    resetViewport();
  }

  // 뒤로가기: 이전 화면(건물 상세 시트 등)으로 복귀
  function onBackPress() {
    router.back();
  }

  // 닫기: 건물 상세 시트나 검색 화면에서 push로 들어오므로, 스택에 남아 있는 이전 화면으로 back()으로 되돌아간다
  function onClosePress() {
    router.back();
  }

  // 장소 시트를 지도에서 열기: 스택에 있는 지도 화면까지 되돌아가면서 placeId로 장소 시트/핀을 띄운다
  // (navigate로 새 지도 화면을 쌓으면 스택이 중복되므로 dismissTo를 쓴다 — favorites 화면과 동일한 방식)
  function onShowOnMapPress() {
    if (!placeId) return;
    router.dismissTo({ pathname: '/maps', params: { placeId } });
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
        <Text className="flex-1 text-center text-black text-body02" numberOfLines={1}>
          {/* 검색으로 바로 들어와도 어느 건물 몇 층인지 알 수 있도록 층을 같이 보여준다 */}
          {building
            ? [building.name, selectedFloorLabel && formatFloorPlanLabel(selectedFloorLabel)]
                .filter(Boolean)
                .join(' ')
            : '층별 안내도'}
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
            <View className="flex-1">
              <Animated.View style={[{ flex: 1 }, contentStyle]}>
                {/* 도면에 이미 있는 대상 이름을 같은 자리·글꼴·크기·회전으로 강조색으로 덮어 그린다.
                    도면과 같은 viewBox·크기라 맞춤(fit) 계산 없이 원본 글자와 정확히 겹친다 */}
                {viewportSize.width > 0 && (
                  <FloorPlanDrawing
                    FloorPlan={FloorPlan}
                    width={viewportSize.width}
                    height={viewportSize.height}
                    layoutViewBox={
                      floorLayout ? `0 0 ${floorLayout.width} ${floorLayout.height}` : undefined
                    }
                    targetTexts={targetTexts}
                  />
                )}
              </Animated.View>
              {/* 확대된 상태를 화면 해상도로 다시 그린 선명한 레이어. 터치는 아래 제스처 영역이 받는다 */}
              {sharpLayer && floorLayout ? (
                <Animated.View
                  key={sharpLayer.viewBox}
                  style={[
                    {
                      position: 'absolute',
                      left: -viewportSize.width * SHARP_MARGIN,
                      top: -viewportSize.height * SHARP_MARGIN,
                      pointerEvents: 'none',
                    },
                    sharpStyle,
                  ]}
                >
                  <FloorPlanDrawing
                    FloorPlan={FloorPlan}
                    width={sharpLayer.width}
                    height={sharpLayer.height}
                    viewBox={sharpLayer.viewBox}
                    layoutViewBox={`0 0 ${floorLayout.width} ${floorLayout.height}`}
                    targetTexts={targetTexts}
                  />
                </Animated.View>
              ) : null}
            </View>
          </GestureDetector>
        ) : (
          <View className="flex-1 items-center justify-center gap-1">
            <Text className="text-grey-40 text-body04">준비 중인 도면이에요</Text>
            <Text className="text-grey-20 text-caption02">
              buildingId: {buildingId ?? '-'} / floorLabel: {floorLabel ?? '-'}
              {placeId ? ` / placeId: ${placeId}` : ''}
            </Text>
          </View>
        )}
        {targetMarker ? (
          <Animated.View
            style={[{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }, pinStyle]}
          >
            <Image
              source={pinImage}
              style={{ width: TARGET_PIN_WIDTH, height: TARGET_PIN_HEIGHT }}
              accessibilityIgnoresInvertColors
            />
          </Animated.View>
        ) : null}
      </View>

      {/* 우측 확대/축소 버튼 - 핀치 확대를 모르는 사용자도 도면을 키워 볼 수 있게 한다.
          층 선택 UI와 같은 모양(흰 바탕 둥근 기둥, 같은 그림자)으로 맞추고, '지도에서 보기' 버튼 위에 둔다 */}
      {FloorPlan ? (
        <View
          className="w-12 rounded-full bg-white"
          style={{
            position: 'absolute',
            right: 16,
            bottom: insets.bottom + 76,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.18,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="도면 확대"
            onPress={() => zoomBy(ZOOM_STEP)}
            className="h-10 items-center justify-center"
            hitSlop={4}
          >
            <PlusIcon size={16} className="text-grey-60" />
          </TouchableOpacity>
          <View className="mx-3 h-px bg-grey-10" />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="도면 축소"
            onPress={() => zoomBy(1 / ZOOM_STEP)}
            className="h-10 items-center justify-center"
            hitSlop={4}
          >
            <MinusIcon size={16} className="text-grey-60" />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* 좌측 하단 층 선택 UI */}
      <View style={{ position: 'absolute', left: 16, bottom: insets.bottom + 16 }}>
        <FloorSelector
          floorLabels={floorLabels}
          selectedFloorLabel={selectedFloorLabel}
          onSelectFloor={onSelectFloor}
        />
      </View>

      {placeId ? (
        <View style={{ position: 'absolute', right: 16, bottom: insets.bottom + 16 }}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onShowOnMapPress}
            className="rounded-full bg-white px-4 py-2.5 shadow-sm"
          >
            <Text className="text-black text-body04">지도에서 보기</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
