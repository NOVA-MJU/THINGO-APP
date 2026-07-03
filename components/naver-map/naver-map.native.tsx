import {
  NaverMapView,
  NaverMapMarkerOverlay,
  NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';
import BusStopMarker from '@/app/(tabs)/maps/_components/markers/bus-stop-marker';
import * as React from 'react';
import { StyleSheet } from 'react-native';

export interface Marker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
}

export interface BusStopMarkerData {
  id: string;
  latitude: number;
  longitude: number;
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
  markers?: Marker[];
  busStopMarkers?: BusStopMarkerData[];
  onMarkerPress?: (id: string) => void;
  onBusStopMarkerPress?: (id: string) => void;
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
    markers = [],
    busStopMarkers = [],
    onMarkerPress,
    onBusStopMarkerPress,
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
    >
      {markers.map((marker) => (
        <NaverMapMarkerOverlay
          key={marker.id}
          latitude={marker.latitude}
          longitude={marker.longitude}
          image={{ symbol: 'blue' }}
          width={20}
          height={28}
          caption={{ text: marker.title ?? '' }}
          // 마커 글씨가 지도의 글씨를 가리지 않도록 함
          isHideCollidedSymbols={!!marker.title}
          onTap={() => onMarkerPress?.(marker.id)}
        />
      ))}
      {busStopMarkers.map((marker) => (
        <NaverMapMarkerOverlay
          key={marker.id}
          latitude={marker.latitude}
          longitude={marker.longitude}
          width={32}
          height={32}
          onTap={() => onBusStopMarkerPress?.(marker.id)}
        >
          <BusStopMarker />
        </NaverMapMarkerOverlay>
      ))}
    </NaverMapView>
  );
});
