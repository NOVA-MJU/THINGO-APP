/// <reference types="navermaps" />
import * as React from 'react';
import { getAssetByID } from '@react-native/assets-registry/registry';
import {
  Container,
  CustomOverlay,
  Marker as NaverMarker,
  NaverMap as RNaverMap,
  NavermapsProvider,
  useNavermaps,
} from 'react-naver-maps';
import {
  BUILDING_MARKER_ACTIVE_IMAGES,
  BUILDING_MARKER_EMPTY_ACTIVE_IMAGE,
  BUILDING_MARKER_EMPTY_IMAGE,
  BUILDING_MARKER_IMAGES,
  CATEGORY_MARKER_ACTIVE_IMAGES,
  CATEGORY_MARKER_IMAGES,
} from '@/assets/map-markers';

/**
 * 바텀시트가 항상 화면 하단을 가리고 있어, 카메라 이동 대상 좌표가 화면 정중앙(0.5) 대신
 * 상단 쪽에 오도록 옮긴다. native(naver-map.native.tsx)의 CAMERA_PIVOT.y와 동일한 값으로 맞춘다.
 */
const CAMERA_PIVOT_Y_RATIO = 2 / 5;

const MARKER_ICON_SIZE = 24;
/**
 * resolveMarkerIconUri가 항상 @3x 자산을 요청하므로, size(원본 비트맵 크기)도 그에 맞춰야 한다.
 * 표시 크기(scaledSize)만 24로 줄이고 size를 24로 두면, SDK가 이미지의 실제 크기를 24라고
 * 착각해 72x72 이미지 중 좌상단 24x24만 잘라 쓰는 것처럼 보여서 흐릿/깨진 아이콘으로 나온다.
 */
const MARKER_ICON_ASSET_SIZE = MARKER_ICON_SIZE * 3;

/**
 * active(선택) 마커는 24x24 원형이 아니라 37x50 비율의 물방울(pin) 모양 PNG라
 * 표시/원본 크기를 별도로 둔다. 원본(1x) 픽셀 크기가 24x24와 다르므로 MARKER_ICON_ASSET_SIZE처럼
 * 표시 크기에 배율만 곱해서 구할 수 없다 - 실제 PNG 픽셀 크기(37x50)에 배율(3)을 곱해야 한다.
 */
const ACTIVE_MARKER_ASSET_WIDTH = 37 * 3;
const ACTIVE_MARKER_ASSET_HEIGHT = 50 * 3;
// 비활성 마커와 가로폭(24)을 맞춰 선택 시 폭이 급변하지 않도록 한다. 37:50 비율 근사치.
const ACTIVE_MARKER_ICON_WIDTH = 24;
const ACTIVE_MARKER_ICON_HEIGHT = 32;

/**
 * 아이콘이 24px 안팎으로 작아 마우스로는 클릭 판정을 놓치기 쉽다. `shape`로 실제 아이콘보다
 * 여유 있는 사각 영역을 클릭 가능 영역으로 지정한다 (좌표는 아이콘 좌상단(0,0) 기준 픽셀).
 */
const MARKER_HIT_SLOP = 10;

function markerHitShape(width: number, height: number): naver.maps.MarkerShape {
  return {
    type: 'rect',
    coords: [-MARKER_HIT_SLOP, -MARKER_HIT_SLOP, width + MARKER_HIT_SLOP, height + MARKER_HIT_SLOP],
  };
}

// 파일 확장자 바로 앞에 @3x를 끼워 넣는다 (bus.png → bus@3x.png).
function insertScaleSuffix(path: string): string {
  return path.replace(/(\.[a-zA-Z0-9]+)$/, '@3x$1');
}

function resolveMarkerIconUri(source: number | string | { uri: string }): string {
  if (typeof source === 'string') {
    const url = new URL(source, window.location.origin);
    const unstablePath = url.searchParams.get('unstable_path');
    if (unstablePath) {
      url.searchParams.set('unstable_path', insertScaleSuffix(unstablePath));
      return url.toString();
    }
    return insertScaleSuffix(source);
  }
  if (typeof source === 'object' && source !== null) return insertScaleSuffix(source.uri);

  // 기기 배율과 상관없이 항상 @3x 자산을 로드한다 (네이티브 asset id로 등록되는 경우 대비).
  const asset = getAssetByID(source);
  return `${asset.httpServerLocation}/${asset.name}@3x.${asset.type}`;
}

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
  // assets/map-markers의 CATEGORY_MARKER_IMAGES 조회용 키
  placeMarkerIcon?: string;
  userLocation?: UserLocationData | null;
  // 각 마커 목록에서 활성(선택) 표시할 마커 id. 클릭한 핀만 active 이미지로 전환하는 데 쓴다.
  selectedBusStopId?: string;
  selectedBuildingId?: string;
  selectedPlaceId?: string;
  onInteraction?: () => void;
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
  placeMarkerIcon?: string;
  userLocation?: UserLocationData | null;
  selectedBusStopId?: string;
  selectedBuildingId?: string;
  selectedPlaceId?: string;
  onInteraction?: () => void;
  onBusStopMarkerPress: (id: string) => void;
  onBuildingMarkerPress: (id: string) => void;
  onPlaceMarkerPress: (id: string) => void;
};

type PendingCamera = Camera;

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
    placeMarkerIcon,
    userLocation,
    selectedBusStopId,
    selectedBuildingId,
    selectedPlaceId,
    onInteraction,
    onBusStopMarkerPress,
    onBuildingMarkerPress,
    onPlaceMarkerPress,
  },
  ref
) {
  const navermaps = useNavermaps();
  const mapRef = React.useRef<React.ComponentRef<typeof RNaverMap>>(null);
  const pendingCameraRef = React.useRef<PendingCamera | null>(null);

  // 대상 좌표를 화면 픽셀 기준으로 위로 밀어서, 지도 정중앙이 아니라 상단 쪽에 오도록 만든다.
  // JS SDK v3의 panTo/morph는 넘긴 좌표를 항상 정중앙에 두는 방식이라 native의 pivot 같은
  // 옵션이 없어서, 실제로 이동시킬 좌표 자체를 미리 치환하는 방식으로 우회한다.
  // 픽셀↔좌표 변환(fromCoordToOffset/fromOffsetToCoord)은 지도의 "현재" 줌을 기준으로 동작하므로,
  // 목표 줌이 현재 줌과 다르면 줌 레벨 차이(2^Δzoom)만큼 픽셀량을 보정해 같은 화면 비율이 되도록 맞춘다.
  const shiftCoordForPivot = React.useCallback(
    (coord: naver.maps.LatLng, targetZoom: number): naver.maps.Coord => {
      const map = mapRef.current;
      if (!map) return coord;

      const projection = map.getProjection();
      const size = map.getSize();
      const zoomRatio = 2 ** (map.getZoom() - targetZoom);
      const desiredShift = size.height * (0.5 - CAMERA_PIVOT_Y_RATIO) * zoomRatio;

      const point = projection.fromCoordToOffset(coord);
      const shiftedPoint = new navermaps.Point(point.x, point.y + desiredShift);
      return projection.fromOffsetToCoord(shiftedPoint);
    },
    [navermaps]
  );

  const moveCamera = React.useCallback(
    (nextCamera: PendingCamera) => {
      const map = mapRef.current;
      if (!map) {
        pendingCameraRef.current = nextCamera;
        return;
      }

      const coord = new navermaps.LatLng(nextCamera.latitude, nextCamera.longitude);

      // zoom을 생략하면 panTo로 줌 레벨 변경 없이 카메라만 이동시킨다 (morph는 zoom을 항상 요구하는
      // 카메라 이동 방식이라 현재 줌을 유지하려는 의도를 표현할 수 없다)
      if (nextCamera.zoom === undefined) {
        map.panTo(shiftCoordForPivot(coord, map.getZoom()), { duration: 500 });
        return;
      }

      map.morph(shiftCoordForPivot(coord, nextCamera.zoom), nextCamera.zoom, { duration: 500 });
    },
    [navermaps, shiftCoordForPivot]
  );

  React.useImperativeHandle(
    ref,
    () => ({
      animateCameraTo: (latitude, longitude, zoom) => {
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
      onMousedown={onInteraction}
      onTouchstart={onInteraction}
      onDragstart={onInteraction}
      onPinchstart={onInteraction}
      onTap={onInteraction}
      onZooming={onInteraction}
    >
      {busStopMarkers.map((marker) => {
        const isActive = marker.id === selectedBusStopId;
        return (
          <NaverMarker
            key={marker.id}
            position={new navermaps.LatLng(marker.latitude, marker.longitude)}
            icon={
              isActive
                ? {
                    url: resolveMarkerIconUri(CATEGORY_MARKER_ACTIVE_IMAGES.BusIcon),
                    size: new navermaps.Size(ACTIVE_MARKER_ASSET_WIDTH, ACTIVE_MARKER_ASSET_HEIGHT),
                    scaledSize: new navermaps.Size(
                      ACTIVE_MARKER_ICON_WIDTH,
                      ACTIVE_MARKER_ICON_HEIGHT
                    ),
                    anchor: new navermaps.Point(
                      ACTIVE_MARKER_ICON_WIDTH / 2,
                      ACTIVE_MARKER_ICON_HEIGHT
                    ),
                  }
                : {
                    url: resolveMarkerIconUri(CATEGORY_MARKER_IMAGES.BusIcon),
                    size: new navermaps.Size(MARKER_ICON_ASSET_SIZE, MARKER_ICON_ASSET_SIZE),
                    scaledSize: new navermaps.Size(MARKER_ICON_SIZE, MARKER_ICON_SIZE),
                    anchor: new navermaps.Point(MARKER_ICON_SIZE / 2, MARKER_ICON_SIZE / 2),
                  }
            }
            shape={markerHitShape(
              isActive ? ACTIVE_MARKER_ICON_WIDTH : MARKER_ICON_SIZE,
              isActive ? ACTIVE_MARKER_ICON_HEIGHT : MARKER_ICON_SIZE
            )}
            onClick={() => onBusStopMarkerPress(marker.id)}
          />
        );
      })}
      {buildingMarkers.map((marker) => {
        const isActive = marker.id === selectedBuildingId;
        return (
          <NaverMarker
            key={marker.id}
            position={new navermaps.LatLng(marker.latitude, marker.longitude)}
            icon={
              isActive
                ? {
                    url: resolveMarkerIconUri(
                      BUILDING_MARKER_ACTIVE_IMAGES[marker.id] ?? BUILDING_MARKER_EMPTY_ACTIVE_IMAGE
                    ),
                    size: new navermaps.Size(ACTIVE_MARKER_ASSET_WIDTH, ACTIVE_MARKER_ASSET_HEIGHT),
                    scaledSize: new navermaps.Size(
                      ACTIVE_MARKER_ICON_WIDTH,
                      ACTIVE_MARKER_ICON_HEIGHT
                    ),
                    anchor: new navermaps.Point(
                      ACTIVE_MARKER_ICON_WIDTH / 2,
                      ACTIVE_MARKER_ICON_HEIGHT
                    ),
                  }
                : {
                    url: resolveMarkerIconUri(
                      BUILDING_MARKER_IMAGES[marker.id] ?? BUILDING_MARKER_EMPTY_IMAGE
                    ),
                    size: new navermaps.Size(MARKER_ICON_ASSET_SIZE, MARKER_ICON_ASSET_SIZE),
                    scaledSize: new navermaps.Size(MARKER_ICON_SIZE, MARKER_ICON_SIZE),
                    anchor: new navermaps.Point(MARKER_ICON_SIZE / 2, MARKER_ICON_SIZE / 2),
                  }
            }
            shape={markerHitShape(
              isActive ? ACTIVE_MARKER_ICON_WIDTH : MARKER_ICON_SIZE,
              isActive ? ACTIVE_MARKER_ICON_HEIGHT : MARKER_ICON_SIZE
            )}
            onClick={() => onBuildingMarkerPress(marker.id)}
          />
        );
      })}
      {placeMarkerIcon &&
        placeMarkers.map((marker) => {
          const isActive = marker.id === selectedPlaceId;
          return (
            <React.Fragment key={marker.id}>
              <NaverMarker
                position={new navermaps.LatLng(marker.latitude, marker.longitude)}
                icon={
                  isActive
                    ? {
                        url: resolveMarkerIconUri(CATEGORY_MARKER_ACTIVE_IMAGES[placeMarkerIcon]),
                        size: new navermaps.Size(
                          ACTIVE_MARKER_ASSET_WIDTH,
                          ACTIVE_MARKER_ASSET_HEIGHT
                        ),
                        scaledSize: new navermaps.Size(
                          ACTIVE_MARKER_ICON_WIDTH,
                          ACTIVE_MARKER_ICON_HEIGHT
                        ),
                        anchor: new navermaps.Point(
                          ACTIVE_MARKER_ICON_WIDTH / 2,
                          ACTIVE_MARKER_ICON_HEIGHT
                        ),
                      }
                    : {
                        url: resolveMarkerIconUri(CATEGORY_MARKER_IMAGES[placeMarkerIcon]),
                        size: new navermaps.Size(MARKER_ICON_ASSET_SIZE, MARKER_ICON_ASSET_SIZE),
                        scaledSize: new navermaps.Size(MARKER_ICON_SIZE, MARKER_ICON_SIZE),
                        anchor: new navermaps.Point(MARKER_ICON_SIZE / 2, MARKER_ICON_SIZE / 2),
                      }
                }
                shape={markerHitShape(
                  isActive ? ACTIVE_MARKER_ICON_WIDTH : MARKER_ICON_SIZE,
                  isActive ? ACTIVE_MARKER_ICON_HEIGHT : MARKER_ICON_SIZE
                )}
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
          );
        })}
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
    placeMarkerIcon,
    userLocation,
    selectedBusStopId,
    selectedBuildingId,
    selectedPlaceId,
    onInteraction,
    onBusStopMarkerPress,
    onBuildingMarkerPress,
    onPlaceMarkerPress,
  },
  ref
) {
  return (
    <NavermapsProvider ncpKeyId={process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID ?? ''}>
      <div
        style={{ width: '100%', height: '100%' }}
        onPointerDownCapture={onInteraction}
        onWheelCapture={onInteraction}
      >
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
            placeMarkerIcon={placeMarkerIcon}
            userLocation={userLocation}
            selectedBusStopId={selectedBusStopId}
            selectedBuildingId={selectedBuildingId}
            selectedPlaceId={selectedPlaceId}
            onInteraction={onInteraction}
            onBusStopMarkerPress={onBusStopMarkerPress ?? (() => {})}
            onBuildingMarkerPress={onBuildingMarkerPress ?? (() => {})}
            onPlaceMarkerPress={onPlaceMarkerPress ?? (() => {})}
          />
        </Container>
      </div>
    </NavermapsProvider>
  );
});
