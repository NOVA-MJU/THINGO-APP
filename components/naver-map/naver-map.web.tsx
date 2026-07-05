import * as React from 'react';
import {
  Container,
  Marker as NaverMarker,
  NaverMap as RNaverMap,
  NavermapsProvider,
  useNavermaps,
} from 'react-naver-maps';

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

function MapContent({
  initialLatitude,
  initialLongitude,
  initialZoom,
  busStopMarkers,
  buildingMarkers,
  onBusStopMarkerPress,
  onBuildingMarkerPress,
}: Required<Props>) {
  const navermaps = useNavermaps();

  return (
    <RNaverMap
      defaultCenter={{ lat: initialLatitude, lng: initialLongitude }}
      defaultZoom={initialZoom}
    >
      {busStopMarkers.map((marker) => (
        <NaverMarker
          key={marker.id}
          position={new navermaps.LatLng(marker.latitude, marker.longitude)}
          onClick={() => onBusStopMarkerPress(marker.id)}
        />
      ))}
      {buildingMarkers.map((marker) => (
        <NaverMarker
          key={marker.id}
          position={new navermaps.LatLng(marker.latitude, marker.longitude)}
          onClick={() => onBuildingMarkerPress(marker.id)}
        />
      ))}
    </RNaverMap>
  );
}

export function NaverMap({
  initialLatitude = 37.5665,
  initialLongitude = 126.978,
  initialZoom = 14,
  busStopMarkers = [],
  buildingMarkers = [],
  onBusStopMarkerPress,
  onBuildingMarkerPress,
}: Props) {
  return (
    <NavermapsProvider ncpKeyId={process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID ?? ''}>
      <Container style={{ width: '100%', height: '100%' }}>
        <MapContent
          initialLatitude={initialLatitude}
          initialLongitude={initialLongitude}
          initialZoom={initialZoom}
          busStopMarkers={busStopMarkers}
          buildingMarkers={buildingMarkers}
          onBusStopMarkerPress={onBusStopMarkerPress ?? (() => {})}
          onBuildingMarkerPress={onBuildingMarkerPress ?? (() => {})}
        />
      </Container>
    </NavermapsProvider>
  );
}
