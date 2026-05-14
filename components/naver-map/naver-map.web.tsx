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

interface Props {
  initialLatitude?: number;
  initialLongitude?: number;
  initialZoom?: number;
  markers?: Marker[];
}

function MapContent({ initialLatitude, initialLongitude, initialZoom, markers }: Required<Props>) {
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
}: Props) {
  return (
    <NavermapsProvider ncpKeyId={process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID ?? ''}>
      <Container style={{ width: '100%', height: '100%' }}>
        <MapContent
          initialLatitude={initialLatitude}
          initialLongitude={initialLongitude}
          initialZoom={initialZoom}
          markers={markers}
        />
      </Container>
    </NavermapsProvider>
  );
}
