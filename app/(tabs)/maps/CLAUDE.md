# maps

## NaverMap 래퍼

`@/components/naver-map`는 `@mj-studio/react-native-naver-map`(native)과 `react-naver-maps`(web)를 하나의 인터페이스로 감싼 컴포넌트다.

- `naver-map.native.tsx` / `naver-map.web.tsx`: 실제 구현. 파일명의 `.native`/`.web` 접미사로 플랫폼별 자동 분기됨
- `naver-map.tsx`: 위 두 구현의 타입/네이티브 구현을 재노출하는 fallback (Metro가 아닌 컨텍스트에서의 타입 체크용)
- `index.ts`: 외부에 노출하는 공개 진입점

## 현위치 표시 (locationOverlay)

사용자 현재 위치는 네이버 지도 SDK가 기본 제공하는 `locationOverlay`로 표시한다 (`NaverMapView`의 `locationOverlay` prop, native 전용).

- 아이콘 에셋: `assets/map-marker-overlay.png` (84×118px, 원(dot) + 방향 화살표가 합쳐진 그래픽)
- `anchor: { x: 0.5, y: 0.636 }`: 화살표가 dot 위로 튀어나와 있어 이미지가 세로로 비대칭이다. 기본값 `{0.5, 0.5}`(이미지 정중앙)를 쓰면 GPS 좌표가 dot이 아니라 화살표 쪽으로 치우쳐 표시된다. `anchor.y`는 PNG를 직접 픽셀 디코딩해서 dot(원)의 실제 중심 y좌표(75)를 이미지 전체 높이(118)로 나눠 구한 값(75/118 ≈ 0.636)이다. **에셋을 다시 export하면 이 값도 다시 계산해야 한다** — 원의 중심이 이미지 원점 기준 몇 %인지 재측정할 것.
- `bearing`: `location.coords.heading`(이동 방향, 도 단위)을 그대로 넘겨서 화살표가 anchor(=dot 중심)를 축으로 회전하도록 함
- `MapImageProp`(`locationOverlay.image`)은 `require()` 이미지 리소스만 받는다 — `NaverMapMarkerOverlay`(장소/건물 마커)처럼 임의의 React/SVG 컴포넌트를 못 쓴다. 아이콘을 바꾸려면 PNG를 다시 export해야 한다.

### 위치 추적 생명주기 (`app/(tabs)/maps/index.tsx`)

- `startWatchingUserLocation()`: `Location.watchPositionAsync`로 구독 시작, `locationSubscriptionRef`에 보관해 중복 구독 방지
- 화면 진입 시 이미 위치 권한이 허용돼 있으면 자동으로 추적 시작 (재요청 안 함, `getForegroundPermissionsAsync`로만 확인)
- 기존 "현위치" 버튼(`onCurrentLocationPress`)을 누르면 권한 요청 + 카메라 이동과 함께 추적도 시작됨
- unmount 시 `locationSubscriptionRef.current?.remove()`로 구독 해제

### web 제약

`react-naver-maps`의 `Marker.icon`은 `naver.maps.ImageIcon` 타입을 요구하는데, 이 타입은 `@types/navermaps` 패키지에서 오며 현재 프로젝트에 설치돼 있지 않다. 그래서 web에서는 커스텀 PNG 없이 기본 마커 핀으로만 사용자 위치를 표시한다. web에서도 동일한 아이콘을 쓰려면 `pnpm add -D @types/navermaps` 후 `ImageIcon`으로 `anchor`/`size`를 지정해야 한다.

## 장소 마커 이름 라벨(caption)

칩 조회(`categoryMarkers`)·검색 결과(`searchResultMarkers`) 마커에 상점 이름을 표시한다. 마커가 많을 때 라벨끼리 겹치지 않는 선에서 최대한 많이 표시하는 방식이 native/web에서 서로 다르다.

- **native**: `NaverMapMarkerOverlay`의 `caption`/`isHideCollidedCaptions` prop이 SDK 차원에서 자동으로 처리해준다 (`components/naver-map/naver-map.native.tsx`). 아이콘은 항상 표시되고, 겹치는 캡션만 SDK가 알아서 숨긴다.
- **web**: `react-naver-maps`가 감싸는 네이버 지도 JS SDK v3에는 이에 대응하는 자동 겹침 처리 기능이 없다 (`isHideCollidedMarkers`/`isHideCollidedCaptions` 같은 옵션 자체가 없음, 유사한 `collisionBehavior`/`collisionBoxSize`는 GL 서브모듈 전용이고 그마저도 마커 아이콘 간 충돌만 다루고 텍스트 캡션과는 무관). 그래서 `components/naver-map/naver-map.web.tsx`에 겹침 판정을 직접 구현했다:
  - `map.getProjection().fromCoordToOffset()`로 각 마커의 화면 픽셀 좌표를 구하고, 캔버스 `measureText()`로 이름 텍스트의 실제 렌더링 폭을 측정
  - 마커 배열 순서대로 순회하며 캡션 사각형(AABB)이 이미 확정된 다른 캡션과 겹치는지 검사 — 안 겹치면 채택, 겹치면 그 라벨만 숨김(아이콘은 항상 유지)
  - 지도 이동/줌이 끝나는 `onIdle` 이벤트와 마커 목록이 바뀔 때 재계산 (`recomputeCaptionVisibility`)
  - 라벨은 `CustomOverlay`(React portal 기반)로 마커 좌표 바로 아래에 렌더링, `pointerEvents: 'none'`으로 클릭 방해 방지
  - 텍스트 스타일: `12px`, `font-weight 600`, 색상 `#0b1215`, 4방향 1px `text-shadow`로 `#ffffff` 외곽선(halo) 구현 (`-webkit-text-stroke`는 브라우저 호환성이 불안정해 사용 안 함). native `caption`의 `color`/`haloColor`도 동일한 값으로 맞춰뒀다.
  - 캔버스 측정 폭과 실제 DOM 렌더링 폭은 미세하게 다를 수 있어, 겹침 판정에 여유 폭(`CAPTION_PADDING_X`)을 더해둔 상태

## 바텀시트 동작 방식 (`app/(tabs)/maps/index.tsx`)

`@gorhom/bottom-sheet`를 **base 시트 1개 + 스택 레이어 N개**로 구성한다. base는 category(기본 화면)/bus/검색 요약처럼 서로 배타적인 화면을 콘텐츠 교체 방식으로 보여주고, places 목록 → building/place 상세로 이어지는 드릴다운은 각 화면을 실제 별도의 `BottomSheet` 인스턴스(스택 레이어)로 쌓아 올린다. `BottomSheetModal`은 쓰지 않는다 — `@gorhom/portal`로 앱 루트에 렌더링되기 때문에 `(tabs)` 하단 네비게이션 바까지 덮어버린다 (포털을 안 쓰는 일반 `BottomSheet`는 탭 화면 콘텐츠 영역 안에 그대로 자식으로 렌더링되므로 이 문제가 없다).

### base 시트 (`bottomSheetRef`)

- `selectedSheetMode`: `'category' | 'bus'`만 담당. `selectedSearchResult`(컨텍스트)가 있으면 `renderBaseSheetContent`에서 모드보다 우선 표시됨
- `selectedStation`: bus 모드에 필요한 식별자
- 항상 마운트돼 있고, 스택 레이어가 하나라도 떠 있으면 완전히 숨겨짐(`close()`)

### 스택 레이어 (`sheetStack` + `_components/sheet-stack-layer.tsx`)

- `sheetStack: SheetScreen[]` — `{ kind: 'places' | 'building' | 'place', ...식별자, key, initialIndex }`. places → building/place 드릴다운만 이 스택을 탄다 (bus/검색은 base에서 처리, 서로 배타적이라 스택 진입 시 항상 `resetStack()`으로 비움)
- `selectedCategoryCode`/`selectedBuildingId`/`selectedPlaceId`는 더 이상 독립 state가 아니라 `sheetStack`에서 해당 kind를 찾아 파생시킨 값이다(`useMemo`). 상세/목록 `useQuery`는 이 파생값을 그대로 쓰므로 기존과 동일하게 동작한다. **현재 UI 흐름상 스택에 동시에 존재하는 places/building/place는 각 kind당 최대 1개**라 `.find()`로 충분하다 — 같은 kind를 여러 겹 쌓는 흐름이 생기면 레이어별로 쿼리를 분리해야 한다.
- `pushSheet(screen, initialIndex?)`: 지금 맨 위에 있는 레이어(또는 base)를 **애니메이션 없이**(`close({ duration: 0 })`) 즉시 완전히 숨기고, 새 레이어를 스택에 추가한다. `snapToIndex(0)`이 아니라 `close()`를 쓰는 이유는 `snapToIndex(0)`은 snapPoints의 첫 값(`'10%'`)으로 이동할 뿐이라 완전히 안 가려지기 때문. 새 레이어는 `index` prop으로 마운트되며 `animateOnMount` 기본 동작으로 아래에서 슬라이드 올라온다. 언마운트 없이 숨기기만 하므로 **가려진 레이어의 스크롤 위치·페이지네이션(`useInfiniteQuery`)이 그대로 보존**된다.
- `popSheet()`: 맨 위 레이어에 `.close({ duration: 0 })`를 호출해 애니메이션 없이 즉시 닫는다. `onClose` 콜백(`handleLayerClosed`)에서 실제로 스택 배열에서 제거하고, 그 아래 있던 레이어를 `push` 시점에 기록해둔 index로 즉시 복원한다.
- **주의**: `close()`는 index가 -1에 도달하면 항상 `onClose`를 발생시키는데(`node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheet.tsx`의 `animateToPositionCompleted`), `pushSheet`가 아래 레이어를 가리려고 호출하는 `close()`도 똑같이 `onClose`를 발생시킨다. 이게 실제 pop과 구분 없이 `handleLayerClosed`를 타면 "덮여서 숨겨진 것"이 스택에서 제거돼버리므로, `suppressCloseRef`에 "덮여서 닫힌" 키를 표시해두고 `handleLayerClosed`가 그 키를 보면 무시하도록 한다.
- `resetStack()`: 스택을 통째로 즉시 언마운트(애니메이션 없음, `close()`도 호출하지 않으므로 `onClose`/`suppressCloseRef`와 무관). bus/칩 재선택처럼 완전히 다른 컨텍스트로 전환할 때 사용.
- `BuildingDetailSheet`/`PlaceDetailSheet`/`PlaceListSheet`/`DaedongPlaceListSheet`의 닫기(X) 버튼은 전부 `onClose={popSheet}`로 연결돼 있다 — "한 단계 뒤로"와 "닫기"가 스택 모델에서는 같은 동작이라 별도 back 버튼이 필요 없다 (places 목록에서 들어온 상세는 popSheet 시 목록으로, 지도에서 바로 들어온 상세는 popSheet 시 category로 돌아감 — 스택 깊이가 자동으로 그 차이를 반영함).
- `selectCategoryPin`(장소/건물 마커 클릭·목록 항목 클릭 공용)은 항상 `pushSheet`만 호출한다 — 이미 상세가 열려 있는 상태에서 다른 핀을 클릭하면 그 위에 새 레이어가 또 쌓인다(뒤로가기 시 이전에 보던 핀으로 돌아감).

### 딥링크 진입

`placeId`/`expanded` 쿼리 파라미터로 진입한 경우 `pushSheet({ kind: 'place', placeId }, expanded === 'true' ? 2 : 1)`로 바로 push한다. 상세 쿼리가 아직 로딩 중이면 레이어 안에서 스피너를 보여주고(`renderStackScreenContent`), 로드되면 자동으로 콘텐츠가 바뀐다 — 예전처럼 "쿼리 완료를 기다렸다가 모드 전환" 하는 별도 처리가 필요 없다(레이어가 이미 push된 상태라 로딩 중에도 자리 자체는 바로 보이기 때문).
