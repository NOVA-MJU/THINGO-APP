import { NaverMapView, NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import * as React from 'react';
import { StyleSheet } from 'react-native';

export interface Marker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
}

interface Props {
  initialLatitude?: number;
  initialLongitude?: number;
  initialZoom?: number;
  markers?: Marker[];
}

export function NaverMap({
  initialLatitude = 37.5665,
  initialLongitude = 126.978,
  initialZoom = 14,
  markers = [],
}: Props) {
  return (
    <NaverMapView
      style={StyleSheet.absoluteFill}
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
        />
      ))}
    </NaverMapView>
  );
}
