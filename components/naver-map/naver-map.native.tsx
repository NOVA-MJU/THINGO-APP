import {
  NaverMapView,
  NaverMapMarkerOverlay,
  NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';
import BusStopMarker from '@/app/(tabs)/maps/_components/markers/bus-stop-marker';
import BuildingMarker from '@/app/(tabs)/maps/_components/markers/building-marker';
import MapPinMarker from '@/app/(tabs)/maps/_components/markers/map-pin';
import * as React from 'react';
import type { ComponentType } from 'react';
import { StyleSheet } from 'react-native';

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
  placeMarkerIcon?: ComponentType<{ size?: number; className?: string }>;
  userLocation?: UserLocationData | null;
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
  zoom: number;
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
      animateCameraTo: (latitude, longitude, zoom = 16) => {
        if (!isInitializedRef.current) {
          pendingCameraRef.current = { latitude, longitude, zoom };
          return;
        }

        mapRef.current?.animateCameraTo({ latitude, longitude, zoom, duration: 500 });
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
      onInitialized={onInitialized}
      locationOverlay={{
        isVisible: !!userLocation,
        position: userLocation ?? undefined,
        bearing: userLocation?.heading ?? 0,
        image: require('@/assets/map-marker-overlay.png'),
        imageWidth: 26,
        imageHeight: 36,
        anchor: { x: 0.5, y: 0.636 },
      }}
    >
      {busStopMarkers.map((marker) => (
        <NaverMapMarkerOverlay
          key={marker.id}
          latitude={marker.latitude}
          longitude={marker.longitude}
          width={24}
          height={24}
          onTap={() => onBusStopMarkerPress?.(marker.id)}
        >
          <BusStopMarker />
        </NaverMapMarkerOverlay>
      ))}
      {buildingMarkers.map((marker) => (
        <NaverMapMarkerOverlay
          key={marker.id}
          latitude={marker.latitude}
          longitude={marker.longitude}
          width={24}
          height={24}
          onTap={() => onBuildingMarkerPress?.(marker.id)}
        >
          <BuildingMarker id={marker.id} />
        </NaverMapMarkerOverlay>
      ))}
      {placeMarkerIcon &&
        placeMarkers.map((marker) => (
          <NaverMapMarkerOverlay
            key={marker.id}
            latitude={marker.latitude}
            longitude={marker.longitude}
            width={24}
            height={24}
            onTap={() => onPlaceMarkerPress?.(marker.id)}
            caption={
              marker.name
                ? { text: marker.name, color: '#0B1215', haloColor: '#FFFFFF' }
                : undefined
            }
            isHideCollidedCaptions
          >
            <MapPinMarker Icon={placeMarkerIcon} />
          </NaverMapMarkerOverlay>
        ))}
    </NaverMapView>
  );
});
