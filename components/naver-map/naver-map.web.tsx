/// <reference types="navermaps" />
import * as React from 'react';
import { getAssetByID } from '@react-native/assets-registry/registry';
import {
  BUILDING_LABEL_COLORS,
  BUILDING_LABEL_FONT_SIZE,
  BUILDING_LABEL_HEIGHT,
  buildingLabelWidth,
} from './building-label';
import {
  Container,
  CustomOverlay,
  Marker as NaverMarker,
  NaverMap as RNaverMap,
  NavermapsProvider,
  useNavermaps,
} from 'react-naver-maps';
import { CATEGORY_MARKER_ACTIVE_IMAGES, CATEGORY_MARKER_IMAGES } from '@/assets/map-markers';

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

// 네이티브(naver-map.native.tsx)의 건물 이름 라벨과 같은 모양을 HTML 마커로 그린다
// 겹쳐서 숨길 때 DOM을 다시 만들지 않고 투명도만 바꿔 서서히 사라지고 나타나게 한다 (네이버 지도 글자처럼). 그래서 id로 찾는다
function buildingLabelElementId(id: string) {
  return `thingo-building-label-${id}`;
}

function buildingLabelHtml(id: string, name: string, width: number, isActive: boolean) {
  const background = isActive
    ? BUILDING_LABEL_COLORS.activeBackground
    : BUILDING_LABEL_COLORS.background;
  const border = isActive ? BUILDING_LABEL_COLORS.activeBackground : BUILDING_LABEL_COLORS.border;
  const color = isActive ? BUILDING_LABEL_COLORS.activeText : BUILDING_LABEL_COLORS.text;
  // 정적 렌더링(서버)에서도 돌 수 있게 document 없이 문자열로 만든다. 이름은 서버 데이터라 HTML 이스케이프한다
  const escapedName = name.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
  const style = [
    `width:${width}px`,
    `height:${BUILDING_LABEL_HEIGHT}px`,
    'box-sizing:border-box',
    `border-radius:${BUILDING_LABEL_HEIGHT / 2}px`,
    `border:1px solid ${border}`,
    `background:${background}`,
    `color:${color}`,
    'font-family:Pretendard',
    'font-weight:600',
    `font-size:${BUILDING_LABEL_FONT_SIZE}px`,
    `line-height:${BUILDING_LABEL_HEIGHT - 2}px`,
    'text-align:center',
    'white-space:nowrap',
    'cursor:pointer',
    `transition:opacity ${BUILDING_LABEL_FADE_MS}ms ease`,
  ].join(';');
  return `<div id="${buildingLabelElementId(id)}" style="${style}">${escapedName}</div>`;
}

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
  name: string;
}

export interface ReviewSuggestionMarkerData {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  photoCount: number;
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
  // 내 사진첩 기준 "다녀온 곳" 핀. 사진첩은 iOS 앱에서만 읽으므로 웹에서는 항상 비어 있어 그리지 않는다
  reviewSuggestionMarkers?: ReviewSuggestionMarkerData[];
  // 내가 리뷰를 남긴 곳. 다녀온 곳 핀과 같이 앱에서만 띄워서 웹에서는 그리지 않는다
  myReviewMarkers?: { id: string; latitude: number; longitude: number }[];
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
  onReviewSuggestionMarkerPress?: (id: string) => void;
  onMyReviewMarkerPress?: (id: string) => void;
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
// 건물 라벨끼리 이만큼은 떨어져 있어야 겹치지 않은 것으로 본다. native SDK처럼 닿기만 안 하면 보여준다
// (국제관과 도서관은 기본 줌에서 2px 떨어져 있어 여유를 두면 도서관이 늘 숨는다)
const BUILDING_LABEL_GAP = 0;
const BUILDING_LABEL_FADE_MS = 200;

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

function sameIds(a: Set<string>, b: Set<string>) {
  return a.size === b.size && [...a].every((id) => b.has(id));
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
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null);

  // JS SDK 지도는 처음 그릴 때의 크기를 기억하고 창(window) 크기 변화에만 맞춰 다시 그린다.
  // 층별 안내도 등 다른 화면으로 가 있는 동안 지도 화면이 가려진 채로 모바일 주소창이 접히거나 펴지면
  // 잘못된 크기로 굳어, 돌아왔을 때 지도가 일부만 그려진다. 그래서 지도 요소 크기가 바뀔 때마다 다시 맞춘다
  React.useEffect(() => () => resizeObserverRef.current?.disconnect(), []);

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
    const map = mapRef.current;
    if (map && typeof ResizeObserver !== 'undefined') {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = new ResizeObserver(([entry]) => {
        // 가려진 동안(크기 0)에는 맞추지 않고, 다시 보일 때 실제 크기로 맞춘다
        if (entry.contentRect.width === 0 || entry.contentRect.height === 0) return;
        map.autoResize();
      });
      resizeObserverRef.current.observe(map.getElement());
    }

    const pendingCamera = pendingCameraRef.current;
    if (pendingCamera) {
      pendingCameraRef.current = null;
      moveCamera(pendingCamera);
    }
    recomputeCaptionVisibility();
  }

  // 상점 이름 라벨(캡션) 겹침 회피: 화면 픽셀 좌표로 변환해 겹치는 라벨만 숨긴다 (아이콘은 항상 표시)
  const [visibleCaptionIds, setVisibleCaptionIds] = React.useState<Set<string>>(new Set());
  // 건물 이름 라벨도 겹치면 숨긴다 (native는 SDK의 isHideCollidedMarkers). 계산 전에는 전부 보인다
  const [hiddenBuildingIds, setHiddenBuildingIds] = React.useState<Set<string>>(new Set());

  const recomputeCaptionVisibility = React.useCallback(() => {
    const map = mapRef.current;
    const ctx = getCaptionMeasureCtx();
    if (!map || !ctx) return;

    const projection = map.getProjection();

    // 선택한 건물 > 목록 앞쪽(건물 번호순) 순으로 남긴다 (native zIndex 순서와 같다)
    const acceptedBuildings: CaptionRect[] = [];
    const nextHiddenBuildings = new Set<string>();
    const orderedBuildings = [...buildingMarkers].sort(
      (a, b) => Number(b.id === selectedBuildingId) - Number(a.id === selectedBuildingId)
    );
    for (const marker of orderedBuildings) {
      const point = projection.fromCoordToOffset(
        new navermaps.LatLng(marker.latitude, marker.longitude)
      );
      const width = buildingLabelWidth(marker.name);
      const rect: CaptionRect = {
        left: point.x - width / 2 - BUILDING_LABEL_GAP,
        right: point.x + width / 2 + BUILDING_LABEL_GAP,
        top: point.y - BUILDING_LABEL_HEIGHT / 2,
        bottom: point.y + BUILDING_LABEL_HEIGHT / 2,
      };
      if (acceptedBuildings.some((other) => rectsOverlap(rect, other))) {
        nextHiddenBuildings.add(marker.id);
      } else {
        acceptedBuildings.push(rect);
      }
    }
    setHiddenBuildingIds((prev) =>
      sameIds(prev, nextHiddenBuildings) ? prev : nextHiddenBuildings
    );
    for (const marker of buildingMarkers) {
      const element = document.getElementById(buildingLabelElementId(marker.id));
      if (element) element.style.opacity = nextHiddenBuildings.has(marker.id) ? '0' : '1';
    }

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

    setVisibleCaptionIds((prev) => (sameIds(prev, nextVisible) ? prev : nextVisible));
  }, [navermaps, placeMarkers, buildingMarkers, selectedBuildingId]);

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
      // 줌 단계가 바뀔 때마다 다시 계산해, 지도가 멈춘 뒤 한꺼번에 바뀌지 않고 확대·축소를 따라 라벨이 나타나고 사라지게 한다
      onZoomChanged={recomputeCaptionVisibility}
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
        const width = buildingLabelWidth(marker.name);
        return (
          <NaverMarker
            key={marker.id}
            position={new navermaps.LatLng(marker.latitude, marker.longitude)}
            zIndex={isActive ? 2 : 1}
            // 겹친 라벨은 숨기는 대신 투명하게 만들고(recomputeCaptionVisibility) 눌리지 않게만 한다
            clickable={!hiddenBuildingIds.has(marker.id)}
            icon={{
              content: buildingLabelHtml(marker.id, marker.name, width, isActive),
              size: new navermaps.Size(width, BUILDING_LABEL_HEIGHT),
              anchor: new navermaps.Point(width / 2, BUILDING_LABEL_HEIGHT / 2),
            }}
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
