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
import { Image, LayoutChangeEvent, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Text as SvgText, TSpan } from 'react-native-svg';
import FloorSelector from './_components/floor-selector';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
// +/- 버튼 한 번에 바뀌는 배율
const ZOOM_STEP = 1.5;
// 대상 핀은 명지도 지도의 선택(active) 마커와 같은 PNG·크기를 쓴다 (components/naver-map의 ACTIVE_MARKER_WIDTH/HEIGHT)
const TARGET_PIN_WIDTH = 24;
const TARGET_PIN_HEIGHT = 32;
// 도면의 대상 이름을 다시 그릴 강조색(blue-35)과 굵기. 굵은 글꼴은 글자 폭이 달라져 원본 회색 글자가 삐져나오므로
// 같은 글꼴·폭 그대로 같은 색 외곽선을 얇게 둘러 굵어 보이게 한다
const TARGET_TEXT_COLOR = '#2587ff';
const TARGET_TEXT_STROKE_RATIO = 0.06;

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

  function resetViewport() {
    scale.value = withTiming(MIN_SCALE);
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedScale.value = MIN_SCALE;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }

  // +/- 버튼: 화면 가운데를 기준으로 확대·축소한다. 가운데에 보이던 지점이 그대로 가운데 남으려면
  // 이동량도 배율 비율만큼 같이 늘려야 한다 (핀치 제스처와 같은 최소·최대 배율과 이동 범위를 따른다)
  function zoomBy(factor: number) {
    const nextScale = clampValue(savedScale.value * factor, MIN_SCALE, MAX_SCALE);
    const ratio = nextScale / savedScale.value;
    const { maxX, maxY } = getPanBounds(nextScale, viewportWidth.value, viewportHeight.value);
    const nextX = clampValue(savedTranslateX.value * ratio, -maxX, maxX);
    const nextY = clampValue(savedTranslateY.value * ratio, -maxY, maxY);
    scale.value = withTiming(nextScale);
    translateX.value = withTiming(nextX);
    translateY.value = withTiming(nextY);
    savedScale.value = nextScale;
    savedTranslateX.value = nextX;
    savedTranslateY.value = nextY;
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
            <Animated.View className="flex-1" style={contentStyle}>
              {viewportSize.width > 0 && (
                <FloorPlan width={viewportSize.width} height={viewportSize.height} />
              )}
              {/* 도면에 이미 있는 대상 이름을 같은 자리·글꼴·크기·회전으로 강조색으로 덮어 그린다.
                  도면과 같은 viewBox·크기라 맞춤(fit) 계산 없이 원본 글자와 정확히 겹친다 */}
              {floorLayout && viewportSize.width > 0 && targetTexts.length > 0 && (
                <Svg
                  width={viewportSize.width}
                  height={viewportSize.height}
                  viewBox={`0 0 ${floorLayout.width} ${floorLayout.height}`}
                  style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
                >
                  {targetTexts.map((text, index) => (
                    <SvgText
                      key={index}
                      transform={text.transform}
                      fontFamily="Pretendard"
                      fontSize={text.fontSize}
                      fontWeight={text.fontWeight}
                      fill={TARGET_TEXT_COLOR}
                      stroke={TARGET_TEXT_COLOR}
                      strokeWidth={text.fontSize * TARGET_TEXT_STROKE_RATIO}
                    >
                      {text.lines.map(([x, y, content], lineIndex) => (
                        <TSpan key={lineIndex} x={x} y={y}>
                          {content}
                        </TSpan>
                      ))}
                    </SvgText>
                  ))}
                </Svg>
              )}
            </Animated.View>
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
