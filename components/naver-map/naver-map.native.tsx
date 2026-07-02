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
  markers?: Marker[];
  busStopMarkers?: BusStopMarkerData[];
  onMarkerPress?: (id: string) => void;
  onBusStopMarkerPress?: (id: string) => void;
}

export interface NaverMapHandle {
  animateCameraTo: (latitude: number, longitude: number, zoom?: number) => void;
}

export const NaverMap = React.forwardRef<NaverMapHandle, Props>(function NaverMap(
  {
    initialLatitude = 37.5665,
    initialLongitude = 126.978,
    initialZoom = 14,
    markers = [],
    busStopMarkers = [],
    onMarkerPress,
    onBusStopMarkerPress,
  },
  ref
) {
  const mapRef = React.useRef<NaverMapViewRef>(null);

  React.useImperativeHandle(ref, () => ({
    animateCameraTo: (latitude, longitude, zoom = 16) => {
      mapRef.current?.animateCameraTo({ latitude, longitude, zoom, duration: 500 });
    },
  }));

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
