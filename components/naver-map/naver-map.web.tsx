import * as React from 'react';
import {
  Container,
  CustomOverlay,
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
  name?: string;
}

type Camera = {
  latitude: number;
  longitude: number;
  zoom?: number;
};

export interface UserLocationData {
  latitude: number;
  longitude: number;
  heading?: number;
}

interface Props {
  initialLatitude?: number;
  initialLongitude?: number;
  initialZoom?: number;
  camera?: Camera;
  busStopMarkers?: BusStopMarkerData[];
  buildingMarkers?: BuildingMarkerData[];
  placeMarkers?: PlaceMarkerData[];
  userLocation?: UserLocationData | null;
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
  userLocation?: UserLocationData | null;
  onBusStopMarkerPress: (id: string) => void;
  onBuildingMarkerPress: (id: string) => void;
  onPlaceMarkerPress: (id: string) => void;
};

type PendingCamera = Required<Camera>;

// 마커 이름 라벨(캡션) 겹침 회피 로직
// 네이버 지도 JS SDK(web)는 네이티브 SDK의 isHideCollidedCaptions 같은 자동 겹침 처리 기능이 없어 직접 구현한다.
const CAPTION_FONT_SIZE = 12;
const CAPTION_FONT_WEIGHT = 600;
const CAPTION_FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif';
const CAPTION_FONT = `${CAPTION_FONT_WEIGHT} ${CAPTION_FONT_SIZE}px ${CAPTION_FONT_FAMILY}`;
const CAPTION_TEXT_COLOR = '#0b1215';
const CAPTION_HALO_COLOR = '#ffffff';
const CAPTION_GAP = 8; // 마커 좌표에서 캡션까지의 세로 간격
const CAPTION_HEIGHT = 14; // 겹침 판정에 사용할 캡션 한 줄 높이(대략치)
const CAPTION_PADDING_X = 4; // 겹침 판정 시 캡션 좌우 여유폭

let captionMeasureCtx: CanvasRenderingContext2D | null | undefined;

function getCaptionMeasureCtx(): CanvasRenderingContext2D | null {
  if (captionMeasureCtx !== undefined) return captionMeasureCtx;
  if (typeof document === 'undefined') {
    captionMeasureCtx = null;
    return captionMeasureCtx;
  }
  const ctx = document.createElement('canvas').getContext('2d');
  if (ctx) ctx.font = CAPTION_FONT;
  captionMeasureCtx = ctx;
  return captionMeasureCtx;
}

type CaptionRect = { left: number; right: number; top: number; bottom: number };

function rectsOverlap(a: CaptionRect, b: CaptionRect) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

const MapContent = React.forwardRef<NaverMapHandle, MapContentProps>(function MapContent(
  {
    initialLatitude,
    initialLongitude,
    initialZoom,
    camera,
    busStopMarkers,
    buildingMarkers,
    placeMarkers,
    userLocation,
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
    if (pendingCamera) {
      pendingCameraRef.current = null;
      moveCamera(pendingCamera);
    }
    recomputeCaptionVisibility();
  }

  // 상점 이름 라벨(캡션) 겹침 회피: 화면 픽셀 좌표로 변환해 겹치는 라벨만 숨긴다 (아이콘은 항상 표시)
  const [visibleCaptionIds, setVisibleCaptionIds] = React.useState<Set<string>>(new Set());

  const recomputeCaptionVisibility = React.useCallback(() => {
    const map = mapRef.current;
    const ctx = getCaptionMeasureCtx();
    if (!map || !ctx) return;

    const projection = map.getProjection();
    const accepted: CaptionRect[] = [];
    const nextVisible = new Set<string>();

    for (const marker of placeMarkers) {
      if (!marker.name) continue;

      const point = projection.fromCoordToOffset(
        new navermaps.LatLng(marker.latitude, marker.longitude)
      );
      const textWidth = ctx.measureText(marker.name).width;
      const rect: CaptionRect = {
        left: point.x - textWidth / 2 - CAPTION_PADDING_X,
        right: point.x + textWidth / 2 + CAPTION_PADDING_X,
        top: point.y + CAPTION_GAP,
        bottom: point.y + CAPTION_GAP + CAPTION_HEIGHT,
      };

      if (accepted.some((other) => rectsOverlap(rect, other))) continue;

      accepted.push(rect);
      nextVisible.add(marker.id);
    }

    setVisibleCaptionIds((prev) => {
      if (prev.size === nextVisible.size && [...prev].every((id) => nextVisible.has(id))) {
        return prev;
      }
      return nextVisible;
    });
  }, [navermaps, placeMarkers]);

  React.useEffect(() => {
    recomputeCaptionVisibility();
  }, [recomputeCaptionVisibility]);

  return (
    <RNaverMap
      ref={mapRef}
      defaultCenter={{ lat: initialLatitude, lng: initialLongitude }}
      defaultZoom={initialZoom}
      onInit={onInit}
      onIdle={recomputeCaptionVisibility}
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
        <React.Fragment key={marker.id}>
          <NaverMarker
            position={new navermaps.LatLng(marker.latitude, marker.longitude)}
            onClick={() => onPlaceMarkerPress(marker.id)}
          />
          {marker.name && visibleCaptionIds.has(marker.id) && (
            <CustomOverlay
              position={new navermaps.LatLng(marker.latitude, marker.longitude)}
              anchor={new navermaps.Point(0, -CAPTION_GAP)}
            >
              <span
                style={{
                  display: 'inline-block',
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                  fontSize: CAPTION_FONT_SIZE,
                  fontWeight: CAPTION_FONT_WEIGHT,
                  fontFamily: CAPTION_FONT_FAMILY,
                  color: CAPTION_TEXT_COLOR,
                  textShadow: [-1, 1]
                    .flatMap((x) => [-1, 1].map((y) => `${x}px ${y}px 0 ${CAPTION_HALO_COLOR}`))
                    .join(', '),
                  pointerEvents: 'none',
                }}
              >
                {marker.name}
              </span>
            </CustomOverlay>
          )}
        </React.Fragment>
      ))}
      {userLocation && (
        <NaverMarker
          position={new navermaps.LatLng(userLocation.latitude, userLocation.longitude)}
          clickable={false}
          zIndex={10}
        />
      )}
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
    userLocation,
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
          userLocation={userLocation}
          onBusStopMarkerPress={onBusStopMarkerPress ?? (() => {})}
          onBuildingMarkerPress={onBuildingMarkerPress ?? (() => {})}
          onPlaceMarkerPress={onPlaceMarkerPress ?? (() => {})}
        />
      </Container>
    </NavermapsProvider>
  );
});
