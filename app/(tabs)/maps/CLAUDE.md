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

## 바텀시트 동작 방식 (`app/(tabs)/maps/index.tsx`)

`@gorhom/bottom-sheet`의 `BottomSheet`를 `SNAP_POINTS = ['10%', '50%', '100%']`(인덱스 0/1/2)로 사용한다. **어떤 콘텐츠를 보여줄지(state)와 시트를 얼마나 펼칠지(snap index)는 서로 다른 메커니즘으로 제어된다.**

### 콘텐츠 결정 상태

- `selectedSheetMode`: `'category' | 'bus' | 'building' | 'place' | 'places'`
- `selectedBuildingId` / `selectedPlaceId` / `selectedCategoryCode` / `selectedStation`: 각 모드에 필요한 식별자. 동시에 해당 상세/목록 `useQuery`의 `enabled` 트리거 역할도 함
- `selectedSearchResult`(`useMapSearchSelection` 컨텍스트): 검색 결과 선택 상태로, `renderBottomSheetContent`에서 **다른 모든 모드보다 우선** 확인됨

`renderBottomSheetContent`의 우선순위: `selectedSearchResult` → `bus` → `building`(상세 로드 완료 시) → `place`(상세 로드 완료 시) → `places` → 기본값 `CategoryList`.

### 건물/장소 상세: 2단계 전환 패턴

마커를 누르는 즉시 모드를 바꾸지 않는다. 이렇게 나뉘어 있다:

1. `onBuildingMarkerPress` / `selectCategoryPin`은 `selectedBuildingId`(또는 `selectedPlaceId`)만 세팅하고 카메라만 이동시킨다. `selectedSheetMode`는 그대로 둬서, 상세 쿼리가 로딩되는 동안 시트에는 기존 콘텐츠가 계속 보인다 (빈 화면 깜빡임 방지).
2. 상세 쿼리(`selectedBuildingDetail`/`selectedPlaceDetail`)가 로드 완료되면 별도 `useEffect`가 그제서야 `selectedSheetMode`를 `'building'`/`'place'`로 바꾼다.
3. 또 다른 `useEffect`가 `[selectedSheetMode, 상세데이터, bottomSheetIndex]`를 지켜보다가, 시트가 접혀 있었으면(`bottomSheetIndex === 0`) `snapToIndex(1)`로 펼친다. 콘텐츠가 이미 렌더링된 뒤에 펼치는 순서이므로 빈 시트가 펼쳐지는 깜빡임이 없다.

새로운 상세 모드를 추가할 때는 이 3단계(식별자 세팅 → 로드 완료 시 모드 전환 → 모드 전환 후 펼침)를 그대로 따라야 깜빡임 없이 동작한다.

### 즉시 스냅하는 경우

비동기 상세 조회가 없거나(버스 정류장) 이미 로드된 데이터를 쓰는 경우(칩 클릭, 검색 결과 선택, "더보기")는 핸들러 안에서 바로 `bottomSheetRef.current?.snapToIndex(1)`을 호출한다.

### 딥링크 진입

`useLocalSearchParams`로 받은 `placeId`/`expanded` 쿼리 파라미터로 화면에 진입한 경우, 상세 로드를 기다리는 2단계 패턴을 타지 않고 `expanded === 'true'`면 인덱스 2(전체), 아니면 1(절반)로 즉시 스냅한다 (TanStack Query 캐시로 상세 데이터가 이미 있을 수 있어서 기다릴 필요가 없음).
