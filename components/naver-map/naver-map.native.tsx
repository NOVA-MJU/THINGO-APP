import * as Haptics from 'expo-haptics';
import {
  NaverMapView,
  NaverMapMarkerOverlay,
  NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';
import { CATEGORY_MARKER_ACTIVE_IMAGES, CATEGORY_MARKER_IMAGES } from '@/assets/map-markers';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  BUILDING_LABEL_COLORS,
  BUILDING_LABEL_FONT_SIZE,
  BUILDING_LABEL_HEIGHT,
  buildingLabelWidth,
  REVIEW_PIN_BODY_HEIGHT,
  REVIEW_PIN_ACTIVE_COLOR,
  REVIEW_PIN_COLOR,
  REVIEW_PIN_FONT_SIZE,
  REVIEW_PIN_TAIL_HEIGHT,
  reviewPinText,
  reviewPinWidth,
} from './building-label';

const MARKER_SIZE = 24;

/**
 * 원형 PNG 마커라 좌표가 원 중앙에 오도록 앵커를 중앙으로 지정 (SDK 기본값 {0.5,1}은 핀 끝이
 * 좌표를 가리키는 방식이라, 그대로 두면 원이 좌표보다 위쪽에 떠 보인다).
 */
const MARKER_ANCHOR = { x: 0.5, y: 0.5 };

/**
 * active(선택) 마커는 24x24 원형이 아니라 37x50 비율의 물방울(pin) 모양 PNG라
 * 앵커/크기를 별도로 둔다. 뾰족한 끝이 이미지 맨 아래 가장자리에 있어 SDK 기본값과
 * 동일한 하단 중앙(0.5, 1)이 좌표를 정확히 가리킨다.
 */
const ACTIVE_MARKER_ANCHOR = { x: 0.5, y: 1 };
// 37:50 비율 근사치. 비활성 마커와 가로폭(24)을 맞춰 선택 시 폭이 급변하지 않도록 한다.
const ACTIVE_MARKER_WIDTH = 24;
const ACTIVE_MARKER_HEIGHT = 32;

/**
 * 바텀시트가 항상 화면 하단을 가리고 있어, 카메라 이동 대상 좌표가 화면 정중앙(0.5) 대신
 * 상단 1/3 지점에 오도록 피벗을 옮긴다.
 */
const CAMERA_PIVOT = { x: 0.5, y: 2 / 5 };

// 누른(선택한) 마커는 다른 마커 아래 깔려 있었어도 맨 위로 올린다
const SELECTED_MARKER_Z_INDEX = 100000;

// 핀을 누르면 가볍게 진동을 줘서 눌렸다는 느낌을 준다
function tapFeedback() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export interface BusStopMarkerData {
  id: string;
  latitude: number;
  longitude: number;
}

export interface BuildingMarkerData {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
}

export interface ReviewSuggestionMarkerData {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  photoCount: number;
}

// 내가 리뷰를 남긴 곳 (가는 파란 핀, 글자 없음)
export interface MyReviewMarkerData {
  id: string;
  latitude: number;
  longitude: number;
}

export interface PlaceMarkerData {
  id: string;
  latitude: number;
  longitude: number;
  name?: string;
}

export interface UserLocationData {
  latitude: number;
  longitude: number;
  heading?: number;
}

interface Props {
  initialLatitude?: number;
  initialLongitude?: number;
  initialZoom?: number;
  camera?: {
    latitude: number;
    longitude: number;
    zoom?: number;
  };
  busStopMarkers?: BusStopMarkerData[];
  buildingMarkers?: BuildingMarkerData[];
  placeMarkers?: PlaceMarkerData[];
  // 내 사진첩 기준 "다녀온 곳" 핀 (리뷰를 남길 수 있는 가게)
  reviewSuggestionMarkers?: ReviewSuggestionMarkerData[];
  // 내가 리뷰를 남긴 곳. 다녀온 곳 핀을 켰을 때 같이 띄워 어디에 리뷰를 남겼는지 보여준다
  myReviewMarkers?: MyReviewMarkerData[];
  // assets/map-markers의 CATEGORY_MARKER_IMAGES 조회용 키
  placeMarkerIcon?: string;
  userLocation?: UserLocationData | null;
  // 각 마커 목록에서 활성(선택) 표시할 마커 id. 클릭한 핀만 active 이미지로 전환하는 데 쓴다.
  selectedBusStopId?: string;
  selectedBuildingId?: string;
  selectedPlaceId?: string;
  selectedReviewSuggestionId?: string;
  onInteraction?: () => void;
  onBusStopMarkerPress?: (id: string) => void;
  onBuildingMarkerPress?: (id: string) => void;
  onPlaceMarkerPress?: (id: string) => void;
  onReviewSuggestionMarkerPress?: (id: string) => void;
  onMyReviewMarkerPress?: (id: string) => void;
  // 네이버 기본 글자(가게·건물 등 심벌)를 눌렀을 때. 앱 전용이다 (웹 JS SDK는 심벌 터치를 알려주지 않는다)
  onSymbolPress?: (symbol: { caption: string; latitude: number; longitude: number }) => void;
  // 지도 이동·확대가 끝났을 때 화면 가운데와 줌. 다녀온 곳 핀 묶음과 목록 순서를 다시 계산하는 데 쓴다
  onCameraSettle?: (camera: { latitude: number; longitude: number; zoom: number }) => void;
}

export interface NaverMapHandle {
  animateCameraTo: (latitude: number, longitude: number, zoom?: number) => void;
}

type PendingCamera = {
  latitude: number;
  longitude: number;
  zoom?: number;
};

export const NaverMap = React.forwardRef<NaverMapHandle, Props>(function NaverMap(
  {
    initialLatitude = 37.5665,
    initialLongitude = 126.978,
    initialZoom = 14,
    camera,
    busStopMarkers = [],
    buildingMarkers = [],
    placeMarkers = [],
    reviewSuggestionMarkers = [],
    myReviewMarkers = [],
    placeMarkerIcon,
    userLocation,
    selectedBusStopId,
    selectedBuildingId,
    selectedPlaceId,
    selectedReviewSuggestionId,
    onInteraction,
    onBusStopMarkerPress,
    onBuildingMarkerPress,
    onPlaceMarkerPress,
    onReviewSuggestionMarkerPress,
    onMyReviewMarkerPress,
    onSymbolPress,
    onCameraSettle,
  },
  ref
) {
  const mapRef = React.useRef<NaverMapViewRef>(null);
  const isInitializedRef = React.useRef(false);
  const pendingCameraRef = React.useRef<PendingCamera | null>(null);

  React.useImperativeHandle(
    ref,
    () => ({
      // zoom을 생략하면 SDK가 현재 줌 레벨을 유지한 채로 카메라만 이동시킨다
      // (네이티브 SDK가 zoom 미지정 시 내부적으로 NULL_NUMBER 센티널을 넘겨 "줌 변경 없음"으로 처리함)
      animateCameraTo: (latitude, longitude, zoom) => {
        if (!isInitializedRef.current) {
          pendingCameraRef.current = { latitude, longitude, zoom };
          return;
        }

        mapRef.current?.animateCameraTo({
          latitude,
          longitude,
          zoom,
          duration: 500,
          pivot: CAMERA_PIVOT,
        });
      },
    }),
    []
  );

  function onInitialized() {
    isInitializedRef.current = true;

    const pendingCamera = pendingCameraRef.current;
    if (!pendingCamera) return;

    pendingCameraRef.current = null;
    mapRef.current?.animateCameraTo({
      ...pendingCamera,
      duration: 500,
      pivot: CAMERA_PIVOT,
    });
  }

  return (
    <NaverMapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      isShowZoomControls={false}
      initialCamera={{
        latitude: initialLatitude,
        longitude: initialLongitude,
        zoom: initialZoom,
      }}
      camera={camera}
      animationDuration={500}
      onTouchStart={onInteraction}
      onTapMap={onInteraction}
      onTapSymbol={(symbol) => {
        tapFeedback();
        onSymbolPress?.(symbol);
      }}
      onCameraChanged={(params) => {
        if (params.reason === 'Gesture' || params.reason === 'Control') {
          onInteraction?.();
        }
      }}
      onCameraIdle={
        onCameraSettle
          ? ({ latitude, longitude, zoom }) =>
              zoom != null && onCameraSettle({ latitude, longitude, zoom })
          : undefined
      }
      onInitialized={onInitialized}
      locationOverlay={{
        isVisible: !!userLocation,
        position: userLocation ?? undefined,
        bearing: userLocation?.heading ?? 0,
        image: require('@/assets/map-marker-overlay.png'),
        imageWidth: 50,
        imageHeight: 50,
        // anchor.y: dot(원)의 실제 중심 y좌표(74/150 지점)를 이미지 픽셀 디코딩으로 측정한 값 (150×150px 에셋 기준)
        anchor: { x: 0.5, y: 0.493 },
      }}
    >
      {busStopMarkers.map((marker) => {
        const isActive = marker.id === selectedBusStopId;
        return (
          <NaverMapMarkerOverlay
            key={marker.id}
            latitude={marker.latitude}
            longitude={marker.longitude}
            width={isActive ? ACTIVE_MARKER_WIDTH : MARKER_SIZE}
            height={isActive ? ACTIVE_MARKER_HEIGHT : MARKER_SIZE}
            anchor={isActive ? ACTIVE_MARKER_ANCHOR : MARKER_ANCHOR}
            image={
              isActive ? CATEGORY_MARKER_ACTIVE_IMAGES.BusIcon : CATEGORY_MARKER_IMAGES.BusIcon
            }
            onTap={() => {
              tapFeedback();
              onBusStopMarkerPress?.(marker.id);
            }}
          />
        );
      })}
      {buildingMarkers.map((marker, index) => {
        const isActive = marker.id === selectedBuildingId;
        const width = buildingLabelWidth(marker.name);
        return (
          <NaverMapMarkerOverlay
            key={`${marker.id}-${isActive}`}
            latitude={marker.latitude}
            longitude={marker.longitude}
            width={width}
            height={BUILDING_LABEL_HEIGHT}
            anchor={MARKER_ANCHOR}
            // 라벨끼리 겹치면 zIndex가 낮은 쪽을 SDK가 숨긴다 (줌인하면 다시 보인다).
            // 선택한 건물 > 목록 앞쪽(건물 번호순) 순으로 남기고, 선택한 건물은 항상 보이게 한다
            zIndex={isActive ? SELECTED_MARKER_Z_INDEX : buildingMarkers.length - index}
            isHideCollidedMarkers
            isForceShowIcon={isActive}
            isHideCollidedSymbols
            onTap={() => {
              tapFeedback();
              onBuildingMarkerPress?.(marker.id);
            }}
            caption={{
              text: marker.name,
              align: 'Center',
              textSize: BUILDING_LABEL_FONT_SIZE,
              color: isActive ? BUILDING_LABEL_COLORS.activeText : BUILDING_LABEL_COLORS.text,
            }}
          >
            {/* iOS는 자식 뷰를 이미지로 찍어 마커로 쓰는데, 찍는 시점에 RN Text가 아직 그려지지 않아 글자가 빠진다.
                그래서 알약 배경만 뷰로 그리고 글자는 SDK 캡션(가운데 정렬)으로 위에 얹는다. key가 바뀌어야 다시 찍는다 */}
            <View
              key={`${marker.name}/${width}/${isActive}`}
              collapsable={false}
              style={[
                styles.buildingLabel,
                {
                  width,
                  backgroundColor: isActive
                    ? BUILDING_LABEL_COLORS.activeBackground
                    : BUILDING_LABEL_COLORS.background,
                  borderColor: isActive
                    ? BUILDING_LABEL_COLORS.activeBackground
                    : BUILDING_LABEL_COLORS.border,
                },
              ]}
            />
          </NaverMapMarkerOverlay>
        );
      })}
      {reviewSuggestionMarkers.map((marker, index) => {
        const isActive = marker.id === selectedReviewSuggestionId;
        const color = isActive ? REVIEW_PIN_ACTIVE_COLOR : REVIEW_PIN_COLOR;
        const width = reviewPinWidth(marker.name, marker.photoCount);
        // SDK 캡션(가운데 정렬)은 마커 전체 높이의 가운데에 놓인다. 꼬리만큼 위에 빈칸을 둬서 글자가 알약 상하 가운데에 오게 한다
        const height = REVIEW_PIN_TAIL_HEIGHT + REVIEW_PIN_BODY_HEIGHT + REVIEW_PIN_TAIL_HEIGHT;
        const onTap = () => {
          tapFeedback();
          onReviewSuggestionMarkerPress?.(marker.id);
        };
        return (
          <NaverMapMarkerOverlay
            key={`review-${marker.id}-${isActive}`}
            latitude={marker.latitude}
            longitude={marker.longitude}
            width={width}
            height={height}
            anchor={ACTIVE_MARKER_ANCHOR}
            // 겹치는 다녀온 곳은 화면(index.tsx)에서 "대표 외 N곳"으로 미리 묶는다. 그래도 겹치면 앞쪽(최근)만 남긴다. 건물 라벨보다는 항상 위
            zIndex={
              isActive
                ? SELECTED_MARKER_Z_INDEX
                : buildingMarkers.length + 2 + reviewSuggestionMarkers.length - index
            }
            isHideCollidedMarkers
            isForceShowIcon={isActive}
            isHideCollidedSymbols
            onTap={onTap}
            caption={{
              text: reviewPinText(marker.name, marker.photoCount),
              align: 'Center',
              textSize: REVIEW_PIN_FONT_SIZE,
              color: '#FFFFFF',
            }}
          >
            <View
              key={`${marker.name}/${marker.photoCount}/${width}/${isActive}`}
              collapsable={false}
              style={{ width, height, alignItems: 'center', paddingTop: REVIEW_PIN_TAIL_HEIGHT }}
            >
              <View style={[styles.reviewPinBody, { width, backgroundColor: color }]} />
              <View style={[styles.reviewPinTail, { borderTopColor: color }]} />
            </View>
          </NaverMapMarkerOverlay>
        );
      })}
      {/* 내가 리뷰한 곳: 눈에 띄지 않게 가는 파란 핀(머리 점 + 얇은 기둥)만 그리고 글자는 두지 않는다.
          다녀온 곳 핀·건물 라벨보다 아래에 깔고 겹쳐도 숨기지 않는다 */}
      {myReviewMarkers.map((marker) => (
        <NaverMapMarkerOverlay
          key={`my-review-${marker.id}`}
          latitude={marker.latitude}
          longitude={marker.longitude}
          width={MY_REVIEW_PIN_WIDTH}
          height={MY_REVIEW_PIN_HEIGHT}
          anchor={ACTIVE_MARKER_ANCHOR}
          zIndex={1}
          onTap={() => {
            tapFeedback();
            onMyReviewMarkerPress?.(marker.id);
          }}
        >
          <View collapsable={false} style={styles.myReviewPin}>
            <View style={styles.myReviewPinHead} />
            <View style={styles.myReviewPinStem} />
          </View>
        </NaverMapMarkerOverlay>
      ))}
      {placeMarkerIcon &&
        placeMarkers.map((marker) => {
          const isActive = marker.id === selectedPlaceId;
          return (
            <NaverMapMarkerOverlay
              key={marker.id}
              latitude={marker.latitude}
              longitude={marker.longitude}
              width={isActive ? ACTIVE_MARKER_WIDTH : MARKER_SIZE}
              height={isActive ? ACTIVE_MARKER_HEIGHT : MARKER_SIZE}
              anchor={isActive ? ACTIVE_MARKER_ANCHOR : MARKER_ANCHOR}
              image={
                isActive
                  ? CATEGORY_MARKER_ACTIVE_IMAGES[placeMarkerIcon]
                  : CATEGORY_MARKER_IMAGES[placeMarkerIcon]
              }
              zIndex={isActive ? SELECTED_MARKER_Z_INDEX : 0}
              isForceShowIcon={isActive}
              onTap={() => {
                tapFeedback();
                onPlaceMarkerPress?.(marker.id);
              }}
              caption={
                marker.name
                  ? { text: marker.name, color: '#0B1215', haloColor: '#FFFFFF' }
                  : undefined
              }
              isHideCollidedCaptions
            />
          );
        })}
    </NaverMapView>
  );
});

// 내가 리뷰한 곳 핀 크기 (머리 10pt 원 + 기둥 2pt x 12pt)
const MY_REVIEW_PIN_WIDTH = 12;
const MY_REVIEW_PIN_HEIGHT = 24;
const MY_REVIEW_PIN_COLOR = '#1778FF';

const styles = StyleSheet.create({
  myReviewPin: {
    width: MY_REVIEW_PIN_WIDTH,
    height: MY_REVIEW_PIN_HEIGHT,
    alignItems: 'center',
  },
  myReviewPinHead: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: MY_REVIEW_PIN_COLOR,
  },
  myReviewPinStem: {
    width: 2,
    height: 13,
    marginTop: -1,
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
    backgroundColor: MY_REVIEW_PIN_COLOR,
  },
  buildingLabel: {
    height: BUILDING_LABEL_HEIGHT,
    borderRadius: BUILDING_LABEL_HEIGHT / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewPinBody: {
    height: REVIEW_PIN_BODY_HEIGHT,
    borderRadius: REVIEW_PIN_BODY_HEIGHT / 2,
    backgroundColor: REVIEW_PIN_COLOR,
  },
  // 아래로 뾰족한 꼬리 (테두리 삼각형)
  reviewPinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: REVIEW_PIN_TAIL_HEIGHT,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: REVIEW_PIN_COLOR,
  },
});
