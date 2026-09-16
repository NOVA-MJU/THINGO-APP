import {
  NaverMapView,
  NaverMapMarkerOverlay,
  NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';
import {
  BUILDING_MARKER_ACTIVE_IMAGES,
  BUILDING_MARKER_EMPTY_ACTIVE_IMAGE,
  BUILDING_MARKER_EMPTY_IMAGE,
  BUILDING_MARKER_IMAGES,
  CATEGORY_MARKER_ACTIVE_IMAGES,
  CATEGORY_MARKER_IMAGES,
} from '@/assets/map-markers';
import * as React from 'react';
import { StyleSheet } from 'react-native';

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

export interface BusStopMarkerData {
  id: string;
  latitude: number;
  longitude: number;
}

export interface BuildingMarkerData {
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
  // assets/map-markers의 CATEGORY_MARKER_IMAGES 조회용 키
  placeMarkerIcon?: string;
  userLocation?: UserLocationData | null;
  // 각 마커 목록에서 활성(선택) 표시할 마커 id. 클릭한 핀만 active 이미지로 전환하는 데 쓴다.
  selectedBusStopId?: string;
  selectedBuildingId?: string;
  selectedPlaceId?: string;
  onInteraction?: () => void;
  onBusStopMarkerPress?: (id: string) => void;
  onBuildingMarkerPress?: (id: string) => void;
  onPlaceMarkerPress?: (id: string) => void;
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
    placeMarkerIcon,
    userLocation,
    selectedBusStopId,
    selectedBuildingId,
    selectedPlaceId,
    onInteraction,
    onBusStopMarkerPress,
    onBuildingMarkerPress,
    onPlaceMarkerPress,
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
      onCameraChanged={(params) => {
        if (params.reason === 'Gesture' || params.reason === 'Control') {
          onInteraction?.();
        }
      }}
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
            onTap={() => onBusStopMarkerPress?.(marker.id)}
          />
        );
      })}
      {buildingMarkers.map((marker) => {
        const isActive = marker.id === selectedBuildingId;
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
                ? (BUILDING_MARKER_ACTIVE_IMAGES[marker.id] ?? BUILDING_MARKER_EMPTY_ACTIVE_IMAGE)
                : (BUILDING_MARKER_IMAGES[marker.id] ?? BUILDING_MARKER_EMPTY_IMAGE)
            }
            onTap={() => onBuildingMarkerPress?.(marker.id)}
          />
        );
      })}
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
              onTap={() => onPlaceMarkerPress?.(marker.id)}
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
