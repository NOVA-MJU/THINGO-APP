import {
  NaverMapView,
  NaverMapMarkerOverlay,
  NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';
import BusStopMarker from '@/app/(tabs)/maps/_components/markers/bus-stop-marker';
import BuildingMarker from '@/app/(tabs)/maps/_components/markers/building-marker';
import * as React from 'react';
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

interface Props {
  initialLatitude?: number;
  initialLongitude?: number;
  initialZoom?: number;
  busStopMarkers?: BusStopMarkerData[];
  buildingMarkers?: BuildingMarkerData[];
  onBusStopMarkerPress?: (id: string) => void;
  onBuildingMarkerPress?: (id: string) => void;
}

export interface NaverMapHandle {
  animateCameraTo: (latitude: number, longitude: number, zoom?: number) => void;
}

export const NaverMap = React.forwardRef<NaverMapHandle, Props>(function NaverMap(
  {
    initialLatitude = 37.5665,
    initialLongitude = 126.978,
    initialZoom = 14,
    busStopMarkers = [],
    buildingMarkers = [],
    onBusStopMarkerPress,
    onBuildingMarkerPress,
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
    </NaverMapView>
  );
});
