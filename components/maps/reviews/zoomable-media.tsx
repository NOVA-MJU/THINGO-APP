import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const MIN_ZOOM_SCALE = 1;
const MAX_ZOOM_SCALE = 3;
// 확대하지 않은 상태에서 이만큼 옆으로 밀거나 빠르게 튕기면 이전·다음 사진으로 넘긴다 (onSwipe를 넘겼을 때만)
const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 500;

type ZoomableMediaProps = {
  children: React.ReactNode;
  overlay?: React.ReactNode;
  resetKey: string;
  onZoomActiveChange: (active: boolean) => void;
  onZoomedChange: (zoomed: boolean) => void;
  // 두 번 탭해서 확대. 스토리 화면은 탭이 이전/다음 넘기기라 끈다 (두 손가락 확대·축소는 그대로)
  doubleTapToZoom?: boolean;
  // 확대하지 않은 상태에서 좌우로 밀면 부른다 (왼쪽으로 밀면 next). 미는 동안 사진이 손가락을 따라 움직인다
  onSwipe?: (direction: 'previous' | 'next') => void;
};

export function ZoomableMedia({
  children,
  overlay,
  resetKey,
  onZoomActiveChange,
  onZoomedChange,
  doubleTapToZoom = true,
  onSwipe,
}: ZoomableMediaProps) {
  const canSwipe = onSwipe != null;
  const handleSwipe = React.useCallback(
    (direction: 'previous' | 'next') => onSwipe?.(direction),
    [onSwipe]
  );
  const scale = useSharedValue(MIN_ZOOM_SCALE);
  const savedScale = useSharedValue(MIN_ZOOM_SCALE);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const viewportWidth = useSharedValue(0);
  const viewportHeight = useSharedValue(0);

  const resetZoom = React.useCallback(() => {
    scale.value = withTiming(MIN_ZOOM_SCALE);
    savedScale.value = MIN_ZOOM_SCALE;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    onZoomActiveChange(false);
    onZoomedChange(false);
  }, [
    onZoomActiveChange,
    onZoomedChange,
    savedScale,
    savedTranslateX,
    savedTranslateY,
    scale,
    translateX,
    translateY,
  ]);

  React.useEffect(() => {
    resetZoom();
  }, [resetKey, resetZoom]);

  const pinchGesture = React.useMemo(
    () =>
      Gesture.Pinch()
        .onBegin(() => {
          runOnJS(onZoomActiveChange)(true);
        })
        .onUpdate((event) => {
          scale.value = Math.min(
            Math.max(savedScale.value * event.scale, MIN_ZOOM_SCALE),
            MAX_ZOOM_SCALE
          );
        })
        .onEnd(() => {
          const nextScale = Math.min(Math.max(scale.value, MIN_ZOOM_SCALE), MAX_ZOOM_SCALE);

          if (nextScale <= MIN_ZOOM_SCALE + 0.01) {
            scale.value = withTiming(MIN_ZOOM_SCALE);
            savedScale.value = MIN_ZOOM_SCALE;
            translateX.value = withTiming(0);
            translateY.value = withTiming(0);
            savedTranslateX.value = 0;
            savedTranslateY.value = 0;
            runOnJS(onZoomedChange)(false);
            return;
          }

          const maxX = Math.max(0, (viewportWidth.value * (nextScale - 1)) / 2);
          const maxY = Math.max(0, (viewportHeight.value * (nextScale - 1)) / 2);
          savedScale.value = nextScale;
          savedTranslateX.value = Math.min(Math.max(translateX.value, -maxX), maxX);
          savedTranslateY.value = Math.min(Math.max(translateY.value, -maxY), maxY);
          translateX.value = withTiming(savedTranslateX.value);
          translateY.value = withTiming(savedTranslateY.value);
          runOnJS(onZoomedChange)(true);
        })
        .onFinalize(() => {
          runOnJS(onZoomActiveChange)(false);
        }),
    [
      onZoomActiveChange,
      onZoomedChange,
      savedScale,
      savedTranslateX,
      savedTranslateY,
      scale,
      translateX,
      translateY,
      viewportHeight,
      viewportWidth,
    ]
  );

  const panGesture = React.useMemo(
    () =>
      Gesture.Pan()
        .minDistance(4)
        .onBegin(() => {
          if (scale.value > MIN_ZOOM_SCALE + 0.01) {
            runOnJS(onZoomActiveChange)(true);
          }
        })
        .onUpdate((event) => {
          if (scale.value <= MIN_ZOOM_SCALE + 0.01) {
            if (canSwipe) translateX.value = event.translationX;
            return;
          }

          const maxX = Math.max(0, (viewportWidth.value * (scale.value - 1)) / 2);
          const maxY = Math.max(0, (viewportHeight.value * (scale.value - 1)) / 2);
          translateX.value = Math.min(
            Math.max(savedTranslateX.value + event.translationX, -maxX),
            maxX
          );
          translateY.value = Math.min(
            Math.max(savedTranslateY.value + event.translationY, -maxY),
            maxY
          );
        })
        .onEnd((event) => {
          if (canSwipe && scale.value <= MIN_ZOOM_SCALE + 0.01) {
            translateX.value = withTiming(0);
            if (
              Math.abs(event.translationX) > SWIPE_DISTANCE ||
              Math.abs(event.velocityX) > SWIPE_VELOCITY
            ) {
              runOnJS(handleSwipe)(event.translationX < 0 ? 'next' : 'previous');
            }
            return;
          }
          savedTranslateX.value = translateX.value;
          savedTranslateY.value = translateY.value;
        })
        .onFinalize(() => {
          runOnJS(onZoomActiveChange)(false);
        }),
    [
      canSwipe,
      handleSwipe,
      onZoomActiveChange,
      savedTranslateX,
      savedTranslateY,
      scale,
      translateX,
      translateY,
      viewportHeight,
      viewportWidth,
    ]
  );

  const doubleTapGesture = React.useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
          if (scale.value > MIN_ZOOM_SCALE + 0.01) {
            scale.value = withTiming(MIN_ZOOM_SCALE);
            savedScale.value = MIN_ZOOM_SCALE;
            translateX.value = withTiming(0);
            translateY.value = withTiming(0);
            savedTranslateX.value = 0;
            savedTranslateY.value = 0;
            runOnJS(onZoomedChange)(false);
            return;
          }

          scale.value = withTiming(2);
          savedScale.value = 2;
          runOnJS(onZoomedChange)(true);
        }),
    [onZoomedChange, savedScale, savedTranslateX, savedTranslateY, scale, translateX, translateY]
  );

  // 핀치, 드래그, 더블 탭 확대 제스처 결합 (doubleTapToZoom이 꺼져 있으면 핀치·드래그만)
  const zoomGesture = React.useMemo(() => {
    const pinchAndPan = Gesture.Simultaneous(pinchGesture, panGesture);
    return doubleTapToZoom ? Gesture.Race(doubleTapGesture, pinchAndPan) : pinchAndPan;
  }, [doubleTapGesture, doubleTapToZoom, panGesture, pinchGesture]);

  const zoomStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={zoomGesture}>
      <Reanimated.View
        style={styles.zoomableMediaSurface}
        onLayout={(event) => {
          viewportWidth.value = event.nativeEvent.layout.width;
          viewportHeight.value = event.nativeEvent.layout.height;
        }}
      >
        <Reanimated.View style={[styles.zoomableMediaContent, zoomStyle]}>
          {children}
        </Reanimated.View>
        {overlay}
      </Reanimated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  zoomableMediaSurface: {
    flex: 1,
    overflow: 'hidden',
  },
  zoomableMediaContent: {
    flex: 1,
  },
});
