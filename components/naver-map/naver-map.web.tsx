import * as React from 'react';
import {
  Container,
  Marker as NaverMarker,
  NaverMap as RNaverMap,
  NavermapsProvider,
  useNavermaps,
} from 'react-naver-maps';

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

function MapContent({
  initialLatitude,
  initialLongitude,
  initialZoom,
  markers,
  busStopMarkers,
  onMarkerPress,
  onBusStopMarkerPress,
}: Required<Props>) {
  const navermaps = useNavermaps();

  return (
    <RNaverMap
      defaultCenter={{ lat: initialLatitude, lng: initialLongitude }}
      defaultZoom={initialZoom}
    >
      {markers.map((marker) => (
        <NaverMarker
          key={marker.id}
          position={new navermaps.LatLng(marker.latitude, marker.longitude)}
          title={marker.title}
          onClick={() => onMarkerPress(marker.id)}
        />
      ))}
      {busStopMarkers.map((marker) => (
        <NaverMarker
          key={marker.id}
          position={new navermaps.LatLng(marker.latitude, marker.longitude)}
          onClick={() => onBusStopMarkerPress(marker.id)}
        />
      ))}
    </RNaverMap>
  );
}

export function NaverMap({
  initialLatitude = 37.5665,
  initialLongitude = 126.978,
  initialZoom = 14,
  markers = [],
  busStopMarkers = [],
  onMarkerPress,
  onBusStopMarkerPress,
}: Props) {
  return (
    <NavermapsProvider ncpKeyId={process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID ?? ''}>
      <Container style={{ width: '100%', height: '100%' }}>
        <MapContent
          initialLatitude={initialLatitude}
          initialLongitude={initialLongitude}
          initialZoom={initialZoom}
          markers={markers}
          busStopMarkers={busStopMarkers}
          onMarkerPress={onMarkerPress ?? (() => {})}
          onBusStopMarkerPress={onBusStopMarkerPress ?? (() => {})}
        />
      </Container>
    </NavermapsProvider>
  );
}
