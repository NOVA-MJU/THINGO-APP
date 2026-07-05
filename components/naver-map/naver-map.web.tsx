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

export interface PlaceMarkerData {
  id: string;
  latitude: number;
  longitude: number;
}

type Camera = {
  latitude: number;
  longitude: number;
  zoom?: number;
};

interface Props {
  initialLatitude?: number;
  initialLongitude?: number;
  initialZoom?: number;
  camera?: Camera;
  busStopMarkers?: BusStopMarkerData[];
  buildingMarkers?: BuildingMarkerData[];
  placeMarkers?: PlaceMarkerData[];
  onBusStopMarkerPress?: (id: string) => void;
  onBuildingMarkerPress?: (id: string) => void;
  onPlaceMarkerPress?: (id: string) => void;
}

export interface NaverMapHandle {
  animateCameraTo: (latitude: number, longitude: number, zoom?: number) => void;
}

type MapContentProps = {
  initialLatitude: number;
  initialLongitude: number;
  initialZoom: number;
  camera?: Camera;
  busStopMarkers: BusStopMarkerData[];
  buildingMarkers: BuildingMarkerData[];
  placeMarkers: PlaceMarkerData[];
  onBusStopMarkerPress: (id: string) => void;
  onBuildingMarkerPress: (id: string) => void;
  onPlaceMarkerPress: (id: string) => void;
};

type PendingCamera = Required<Camera>;

const MapContent = React.forwardRef<NaverMapHandle, MapContentProps>(function MapContent(
  {
    initialLatitude,
    initialLongitude,
    initialZoom,
    camera,
    busStopMarkers,
    buildingMarkers,
    placeMarkers,
    onBusStopMarkerPress,
    onBuildingMarkerPress,
    onPlaceMarkerPress,
  },
  ref
) {
  const navermaps = useNavermaps();
  const mapRef = React.useRef<React.ComponentRef<typeof RNaverMap>>(null);
  const pendingCameraRef = React.useRef<PendingCamera | null>(null);

  const moveCamera = React.useCallback(
    (nextCamera: PendingCamera) => {
      const map = mapRef.current;
      if (!map) {
        pendingCameraRef.current = nextCamera;
        return;
      }

      map.morph(new navermaps.LatLng(nextCamera.latitude, nextCamera.longitude), nextCamera.zoom, {
        duration: 500,
      });
    },
    [navermaps]
  );

  React.useImperativeHandle(
    ref,
    () => ({
      animateCameraTo: (latitude, longitude, zoom = 16) => {
        moveCamera({ latitude, longitude, zoom });
      },
    }),
    [moveCamera]
  );

  React.useEffect(() => {
    if (!camera) return;
    moveCamera({
      latitude: camera.latitude,
      longitude: camera.longitude,
      zoom: camera.zoom ?? 16,
    });
  }, [camera, moveCamera]);

  function onInit() {
    const pendingCamera = pendingCameraRef.current;
    if (!pendingCamera) return;

    pendingCameraRef.current = null;
    moveCamera(pendingCamera);
  }

  return (
    <RNaverMap
      ref={mapRef}
      defaultCenter={{ lat: initialLatitude, lng: initialLongitude }}
      defaultZoom={initialZoom}
      onInit={onInit}
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
      {placeMarkers.map((marker) => (
        <NaverMarker
          key={marker.id}
          position={new navermaps.LatLng(marker.latitude, marker.longitude)}
          onClick={() => onPlaceMarkerPress(marker.id)}
        />
      ))}
    </RNaverMap>
  );
});

export const NaverMap = React.forwardRef<NaverMapHandle, Props>(function NaverMap(
  {
    initialLatitude = 37.5665,
    initialLongitude = 126.978,
    initialZoom = 14,
    camera,
    busStopMarkers = [],
    buildingMarkers = [],
    placeMarkers = [],
    onBusStopMarkerPress,
    onBuildingMarkerPress,
    onPlaceMarkerPress,
  },
  ref
) {
  return (
    <NavermapsProvider ncpKeyId={process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID ?? ''}>
      <Container style={{ width: '100%', height: '100%' }}>
        <MapContent
          ref={ref}
          initialLatitude={initialLatitude}
          initialLongitude={initialLongitude}
          initialZoom={initialZoom}
          camera={camera}
          busStopMarkers={busStopMarkers}
          buildingMarkers={buildingMarkers}
          placeMarkers={placeMarkers}
          onBusStopMarkerPress={onBusStopMarkerPress ?? (() => {})}
          onBuildingMarkerPress={onBuildingMarkerPress ?? (() => {})}
          onPlaceMarkerPress={onPlaceMarkerPress ?? (() => {})}
        />
      </Container>
    </NavermapsProvider>
  );
});
