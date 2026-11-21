# maps

## NaverMap 래퍼

`@/components/naver-map`는 `@mj-studio/react-native-naver-map`(native)과 `react-naver-maps`(web)를 하나의 인터페이스로 감싼 컴포넌트다.

- `naver-map.native.tsx` / `naver-map.web.tsx`: 실제 구현. 파일명의 `.native`/`.web` 접미사로 플랫폼별 자동 분기됨
- `naver-map.tsx`: 위 두 구현의 타입/네이티브 구현을 재노출하는 fallback (Metro가 아닌 컨텍스트에서의 타입 체크용)
- `index.ts`: 외부에 노출하는 공개 진입점

## 현위치 표시 (locationOverlay)

사용자 현재 위치는 네이버 지도 SDK가 기본 제공하는 `locationOverlay`로 표시한다 (`NaverMapView`의 `locationOverlay` prop, native 전용).

- 아이콘 에셋: `assets/map-marker-overlay.png` (150×150px, 50×50dp 표시 기준 3배 스케일. 원(dot) + 방향 화살표 + 은은한 halo 배경이 합쳐진 그래픽)
- `anchor: { x: 0.5, y: 0.493 }`: 화살표가 dot 위로 튀어나와 있어 이미지가 세로로 비대칭이다. 기본값 `{0.5, 0.5}`(이미지 정중앙)를 쓰면 GPS 좌표가 dot이 아니라 화살표 쪽으로 치우쳐 표시된다. `anchor.y`는 PNG를 직접 픽셀 디코딩해서 dot(원)의 실제 중심 y좌표(74)를 이미지 전체 높이(150)로 나눠 구한 값(74/150 ≈ 0.493)이다. **에셋을 다시 export하면 이 값도 다시 계산해야 한다** — 원의 중심이 이미지 원점 기준 몇 %인지 재측정할 것.
- `bearing`: `userLocation.heading`(도 단위)을 그대로 넘겨서 화살표가 anchor(=dot 중심)를 축으로 회전하도록 함. 이 값은 GPS 진행 방향(`location.coords.heading`)이 아니라 `Location.watchHeadingAsync`의 나침반 방향(`trueHeading`, 없으면 `magHeading`)에서 옴 - GPS 진행 방향은 정지 상태에서 부정확/미갱신이라 제자리에서 방향을 표시하려면 나침반이 필요함
- `MapImageProp`(`locationOverlay.image`)은 `require()` 이미지 리소스만 받는다 — `NaverMapMarkerOverlay`(장소/건물 마커)처럼 임의의 React/SVG 컴포넌트를 못 쓴다. 아이콘을 바꾸려면 PNG를 다시 export해야 한다.

### 위치 추적 생명주기 (`app/(tabs)/maps/index.tsx`)

- `startWatchingUserLocation()`: `Location.watchPositionAsync`로 좌표(위도/경도)만 구독, `locationSubscriptionRef`에 보관해 중복 구독 방지. 콜백에서 `heading`은 건드리지 않고 이전 state 값을 그대로 유지한다(`setUserLocation((prev) => ({ ..., heading: prev?.heading }))`) - `startWatchingUserHeading`이 갱신한 나침반 값을 덮어쓰지 않기 위함
- `startWatchingUserHeading()`: `Location.watchHeadingAsync`로 나침반 방향만 구독, `headingSubscriptionRef`에 보관해 중복 구독 방지. `userLocation`이 아직 없으면(위치 좌표를 못 받은 상태) 업데이트를 무시한다
- 화면 진입 시 이미 위치 권한이 허용돼 있으면 위치/나침반 추적을 둘 다 자동 시작 (재요청 안 함, `getForegroundPermissionsAsync`로만 확인)
- 기존 "현위치" 버튼(`onCurrentLocationPress`)을 누르면 권한 요청 + 카메라 이동과 함께 위치/나침반 추적도 둘 다 시작됨
- unmount 시 `locationSubscriptionRef.current?.remove()`, `headingSubscriptionRef.current?.remove()`로 두 구독 모두 해제

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
  - 건물 이름 라벨은 겹쳐도 마커를 숨기지 않고 투명도만 0으로 바꾼다(`transition: opacity`, 눌리지 않게 `clickable=false`). 그래서 확대·축소할 때 네이버 지도 글자처럼 서서히 나타나고 사라진다. 다시 계산은 지도가 멈출 때(`onIdle`)뿐 아니라 줌 단계가 바뀔 때(`onZoomChanged`)마다 한다
  - 건물 라벨 겹침 여유(`BUILDING_LABEL_GAP`)는 0이다. 국제관과 도서관은 기본 줌에서 2px 떨어져 있어 여유를 두면 도서관이 늘 숨는다
  - 웹 JS SDK에는 네이버 기본 글자(심벌)를 숨기는 기능이 없어 우리 라벨 옆에 네이버 글자("도서관")가 같이 보일 수 있다 (native는 `isHideCollidedSymbols`로 숨긴다)

### 건물 시트의 층별 안내도 (`sheets/floor-plan-carousel.tsx`)

건물 시트는 이름·운영 정보 → 건물 사진 → 층별 안내도 카드 → 시설 필터 → 층별 시설 목록 순서다 (건물 사진을 가장 먼저 보여준다). 층별 안내도 카드는 층마다 한 장씩 좌우로 넘기는 페이지(pagingEnabled)이고 1층(없으면 가장 아래층)에서 시작한다. 누르면 그 층 안내도 화면(`/maps/floor`)이 열린다. 층 번호 버튼은 아래 층별 시설 목록과 겹쳐서 두지 않는다. 도면이 없는 건물(미래관·생활관)은 카드가 없다.

- 도면은 잘리지 않게 실제 그려진 영역(`getFloorPlanContentViewBox`) 전체를 카드에 맞춰 그린다. 카드 높이는 그 건물에서 가장 세로로 긴 층에 맞춘다 (170~380, 넘길 때 높이가 출렁이지 않게)
- 도면 SVG가 무거워 지금 보는 층과 앞뒤 한 층만 그린다
- 웹은 pagingEnabled가 CSS scroll-snap이라 세게 밀면 여러 층을 건너뛰어서 페이지마다 `scroll-snap-stop: always`를 붙인다
- 층별 안내도 화면 왼쪽 아래 층 선택(`floor-selector.tsx`)은 엘리베이터처럼 지금 층 표시가 가운데에 고정되고 목록이 위아래로 굴러간다. 굴려서 멈추면(140ms) 가운데 층이 선택되고, 층을 누르면 그 층이 가운데로 온다. 앱은 `snapToInterval` + `disableIntervalMomentum`, 웹은 CSS scroll-snap(center, `scroll-snap-stop: always`)으로 세게 튕겨도 여러 층을 날아가지 않고 칸에 맞춰 멈춘다
- 층별 안내도 화면(`app/maps/floor`)은 도면이 그려진 영역(`content`)이 상하좌우 잘리지 않는 최대 배율로 가득 채워 연다(여백 16px, 영역 가운데를 화면 가운데에). 처음부터 확대하면 층 모양을 보려고 좌우로 꼭 밀어야 해서다. 더블탭은 이 화면으로 돌아온다
- 페이지 폭은 카드 테두리 안쪽 폭으로 잰다 (바깥 폭을 쓰면 한 장 넘길 때마다 2px씩 밀린다)
- 도면 영역은 `scripts/generate-floor-plan-targets.mjs`가 경로·사각형·선 좌표로 계산해 `targets.json`의 `content`에 넣는다. viewBox를 undefined로 넘기면 원래 viewBox가 지워지므로 있을 때만 넘긴다
- 도면 글자(`<text>`)에는 테두리(stroke)를 두지 않는다. Figma 외곽선 효과가 stroke로 나오면 테두리가 글자 위에 덮여 하얗게 보인다(행정동 1층 출입문 등 24곳을 지웠고, 남아 있으면 생성 스크립트가 에러를 낸다). 출입문 글자는 파란색(#3B96FF), 나머지는 회색(#6D7073). 출입문 등 방 밖에 떠 있는 안내 글자(파란 #3B96FF, '운동장' #909499)는 벽·선과 겹쳐도 읽히게 바로 뒤에 흰 테두리만 그린 복사본(`fill="none" stroke="#FFFFFF"`)을 깐다. 생성 스크립트는 이 복사본을 검색 대상에서 빼고, 그 외 글자의 stroke는 여전히 에러로 막는다
- 도면 SVG에서 캔버스 전체 배경 사각형(`fill="#F5F7F9"`)을 지웠다 (남아 있으면 생성 스크립트가 에러를 낸다). 배경은 화면 쪽에서 `grey-02`(#F5F7F9)로 칠한다. 층별 안내도 화면의 확대 선명 레이어도 같은 배경색을 직접 칠한다 (안 칠하면 아래 흐린 레이어가 비친다)

### 건물 시트의 호실 검색 (`sheets/building-room-search.tsx`)

검색창은 층별 안내도 카드 맨 위(도면 위)에 붙어 있다 (`FloorPlanCarousel`의 `header`). 따로 떨어져 있으면 눈에 잘 안 띈다. 카드 안 "크게 보기"와 같은 흰 알약(h-9)으로 작게 두고, 결과가 없으면 줄을 늘리지 않고 입력창 안에 "결과 없음"만 띄운다. 서버를 거치지 않고 이 건물 도면에 적힌 글자(`targets.json`)에서 찾는다 (`lib/maps/floor-plan-search.ts`, 확인: `node lib/maps/floor-plan-search.check.mjs`). 두 줄 라벨('S2111 / 소강당')은 한 키('s2111소강당')라서 키에 검색어가 들어 있는지로 찾고, '1353'처럼 앞의 S를 빼고 쳐도 찾는다. 결과를 누르면 `/maps/floor?target=<키>`로 열어 그 글자를 강조한다. 이 건물에서 하나도 못 찾으면 다른 건물 도면에서 찾아 "종합관 3F S1353"처럼 건물 이름을 붙여 보여준다(`searchBuildingsFloorPlanTexts`). 이 건물에서 찾은 게 있으면 다른 건물은 보지 않는다 ('화장실'처럼 어디에나 있는 이름이 섞이지 않게). 웹 입력창 포커스 테두리는 `outlineStyle: 'none'`으로 끈다 (`className`은 `BottomSheetTextInput`에 적용되지 않는다).

호실 이름(예: S10134 코이노니아홀)을 도면에 넣을 때는 SVG의 두 줄 라벨 형식(코드 줄 끝 `&#10;`, 다음 줄 y+10)을 따르고 `node scripts/generate-floor-plan-targets.mjs`로 다시 생성한다. 명지도 통합 검색은 서버 장소 이름(`name`)·호실 코드(`indoorCode`)로 찾고, 그 뒤에 층별 안내도 도면 글자 결과(최대 5개, `lib/maps/floor-plan-buildings.ts`)를 붙인다. 그래서 서버 이름이 'S10134'뿐인 호실도 도면에 적힌 '코이노니아홀'로 찾힌다. 도면 결과의 아이콘은 글자로 장소 종류를 짐작해 고른다(`floorTextCategoryCode`, 화장실·카페·프린트 등, 안 맞으면 강의실). 검색 결과 이름 옆 작은 아이콘은 왼쪽 칸이 사진일 때만 둔다 (사진이 없으면 같은 아이콘이 두 번 보인다). 서버 결과에 같은 호실 코드가 있으면 도면 결과는 빼서 두 번 나오지 않게 한다.

### 학교로 돌아가기 버튼

현위치 버튼 바로 위의 "학교" 버튼은 처음 열었을 때 화면(캠퍼스 중심, `CAMPUS_ZOOM`)으로 돌아간다. 줌도 처음 값으로 되돌린다. 멀리 축소했거나 크게 확대한 채로 위치만 옮기면 캠퍼스가 한눈에 안 들어오기 때문이다. 열려 있는 시트는 건드리지 않는다.

### 시트 닫기와 뒤로가기

- 스택 레이어(`sheet-stack-layer.tsx`)는 내용이 48px 넘게 스크롤돼 시트 헤더의 닫기 버튼이 가려지면 오른쪽 위에 얇은 닫기(X) 버튼을 띄운다. 누르면 그 레이어만 닫혀 이전 화면으로 돌아간다 (`onDismiss={popSheet}`)
- 안드로이드 하드웨어 뒤로가기와 웹 브라우저 뒤로가기는 맨 위 시트부터 하나씩 닫는다. 웹은 시트가 떠 있는 동안 같은 주소의 기록(`SHEET_HISTORY_GUARD`)을 하나 쌓아 두고 popstate에서 시트를 닫은 뒤 남은 시트가 있으면 다시 쌓는다. 다른 화면에서 돌아와 가드 기록에 도착한 경우는 닫지 않는다. X로 시트를 다 닫으면 가드 기록이 하나 남아 뒤로가기 한 번이 그냥 지나간다

### 지도 라벨용 짧은 건물 이름

방목학술정보관은 국제관과 약 50m 거리라 긴 이름 라벨이 늘 겹쳐 숨고 네이버 기본 글자만 보였다. 지도 라벨만 `BUILDING_LABEL_SHORT_NAMES`(`index.tsx`)로 "도서관"으로 줄인다. 라벨이 덮는 네이버 기본 글자는 `isHideCollidedSymbols`로 숨는다. 시트·검색은 원래 이름을 쓴다.

### 네이버 기본 글자(심벌) 누르기 (앱 전용)

네이버 지도가 그리는 가게·건물 글자를 누르면 우리 시트를 연다 (`onSymbolPress` in `index.tsx`).

- 라이브러리(`@mj-studio/react-native-naver-map` 2.8.0)가 심벌 터치를 꺼내 주지 않아 `patches/`의 pnpm 패치로 `onTapSymbol`을 추가했다 (iOS `didTapSymbol`, Android `setOnSymbolClickListener`). 터치를 소비해서 이때는 `onTapMap`이 오지 않는다. 네이티브 변경이라 스토어 빌드가 새로 나가야 반영된다
- 심벌은 이름과 좌표만 준다. 서버 `GET /map/symbol-match`(`matchMapSymbol`)가 모든 카테고리 핀에서 이름이 비슷하고 80m 안인 곳을 찾는다. 전수조사로 가게를 서버에 추가하면 앱을 다시 내지 않아도 찾힌다. 서버에 API가 없거나 실패하면 앱 안에서 건물 → 대동 가게 순으로 대조한다(`lib/maps/match-symbol.ts`, 확인: `node lib/maps/match-symbol.check.mjs`). 기준은 서버 `SymbolNameMatcher`, 전수조사 스크립트(`scripts/audit-places.mjs`)와 같다
- 우리 DB에 없으면 "띵고에 아직 정보가 없는 곳" 시트(`sheet-unknown-place.tsx`)에서 네이버 지도 검색으로 넘긴다. 네이버 장소 정보는 약관상 가져와 보여주지 않는다
- 웹 JS SDK는 심벌 터치를 알려주지 않아 웹에서는 동작하지 않는다

### 건물 이름 라벨 겹침

건물 라벨(알약)은 겹치면 라벨 전체를 숨긴다 (줌인하면 다시 보인다). 우선순위는 선택한 건물 > `buildingMarkers` 배열 앞쪽(API 순서, 건물 번호순) 순이다.

- **native**: `isHideCollidedMarkers` + `zIndex`(앞쪽일수록 큼). 선택한 건물은 `isForceShowIcon`으로 항상 보인다. 다녀온 곳 핀은 건물보다 zIndex가 커서 겹치면 건물 라벨이 숨는다. 다녀온 곳 핀끼리도 `isHideCollidedMarkers`로 겹치면 최근에 간 곳(배열 앞쪽, zIndex 큼)만 남는다
- **web**: 위 캡션과 같은 `recomputeCaptionVisibility`에서 `buildingLabelWidth`로 사각형을 만들어 판정하고 `visible`로 숨긴다
- 누른(선택한) 핀은 종류와 상관없이 `SELECTED_MARKER_Z_INDEX`로 맨 위에 올리고 `isForceShowIcon`으로 숨지 않게 한다. 다른 핀 아래 깔린 핀을 눌러도 위로 올라와 눌린 게 보이게 하려는 것이다. 다녀온 곳 핀은 눌리면 한 단계 진한 색(`REVIEW_PIN_ACTIVE_COLOR`)이 된다
- 앱에서 핀이나 네이버 글자를 누르면 가벼운 진동(`expo-haptics` Light)을 준다

## 바텀시트 동작 방식 (`app/(tabs)/maps/index.tsx`)

`@gorhom/bottom-sheet`를 **base 시트 1개 + 스택 레이어 N개**로 구성한다. base는 학교 건물 목록(`BuildingListSheet`) 하나만 보여주고, category(칩 전체보기)를 포함해 bus/places 목록 → building/place 상세로 이어지는 드릴다운은 각 화면을 실제 별도의 `BottomSheet` 인스턴스(스택 레이어)로 쌓아 올린다. `BottomSheetModal`은 쓰지 않는다 — `@gorhom/portal`로 앱 루트에 렌더링되기 때문에 `(tabs)` 하단 네비게이션 바까지 덮어버린다 (포털을 안 쓰는 일반 `BottomSheet`는 탭 화면 콘텐츠 영역 안에 그대로 자식으로 렌더링되므로 이 문제가 없다).

### base 시트 (`bottomSheetRef`)

- 항상 `BuildingListSheet`만 그린다 — 별도 모드 state 없이 `<BuildingListSheet buildings={buildings} onBuildingPress={...} />`를 고정 렌더링. `buildings`는 지도 건물 마커(1~9번 숫자 마커 포함)와 동일한 `useQuery(['map-buildings', ...])` 결과를 그대로 쓴다 — base가 떠 있는 동안엔 `selectedCategoryCode`/`selectedBusStation`/`selectedSearchResult`가 전부 비어 있으므로 지도 위 건물 번호 마커도 그대로 유지된다.
- `sheet-building-list.tsx`는 `sheet-place-list.tsx`를 그대로 복사해 `MapCategoryPin` 대신 `MapBuilding`을 받도록 필드명만 바꾼 컴포넌트다 — 목록 아이템 UI(아이콘/즐겨찾기/거리/이미지)가 places 목록과 완전히 동일하다.
- 카테고리(칩 전체보기) 화면은 더 이상 base가 아니다 — 상단 "더보기" 버튼(`handleMoreCategories`)을 누르면 `resetStack()` 후 `pushSheet({ kind: 'category' })`로 base 위에 스택 레이어로 push된다. `CategoryListSheet`도 다른 스택 시트들과 동일하게 `onClose={popSheet}` 닫기(X) 버튼을 가진다.
- `selectedSearchResult`(컨텍스트)는 base 콘텐츠에 관여하지 않는다 — 검색 결과 선택 시 곧바로 building/place 스택 레이어가 push되고 컨텍스트 값이 지워지므로, base가 검색 요약을 그릴 틈이 없다 (`_components/sheets/map-search-summary.tsx`는 이 이유로 만들어졌지만 실제로는 호출되지 않는, 보관용 코드다)
- 항상 마운트돼 있고, 스택 레이어가 하나라도 떠 있으면 완전히 숨겨짐(`close()`)

### 스택 레이어 (`sheetStack` + `_components/sheet-stack-layer.tsx`)

- `sheetStack: SheetScreen[]` — `{ kind: 'places' | 'building' | 'place' | 'bus' | 'category', ...식별자, key, initialIndex }`. bus, places → building/place 드릴다운, 검색 결과 선택, category(더보기) 전부 이 스택을 탄다 — base는 건물 목록 하나뿐이라 서로 배타적인 화면 전환은 전부 스택 레이어 push/pop으로 처리한다
- `selectedCategoryCode`/`selectedBuildingId`/`selectedPlaceId`/`selectedBusStation`은 독립 state가 아니라 `sheetStack`에서 해당 kind를 찾아 파생시킨 값이다(`useMemo`). 상세/목록 `useQuery`는 이 파생값을 그대로 쓰므로 기존과 동일하게 동작한다. **현재 UI 흐름상 스택에 동시에 존재하는 places/building/place/bus/category는 각 kind당 최대 1개**라 `.find()`로 충분하다 — 같은 kind를 여러 겹 쌓는 흐름이 생기면 레이어별로 쿼리를 분리해야 한다.
- `pushSheet(screen, initialIndex?)`: 지금 맨 위에 있는 레이어(또는 base)를 **애니메이션 없이**(`close({ duration: 0 })`) 즉시 완전히 숨기고, 새 레이어를 스택에 추가한다. `snapToIndex(0)`이 아니라 `close()`를 쓰는 이유는 `snapToIndex(0)`은 snapPoints의 첫 값(`'10%'`)으로 이동할 뿐이라 완전히 안 가려지기 때문. 새 레이어는 `index` prop으로 마운트되며 `animateOnMount` 기본 동작으로 아래에서 슬라이드 올라온다. 언마운트 없이 숨기기만 하므로 **가려진 레이어의 스크롤 위치·페이지네이션(`useInfiniteQuery`)이 그대로 보존**된다.
- `popSheet()`: 맨 위 레이어에 `.close({ duration: 0 })`를 호출해 애니메이션 없이 즉시 닫는다. `onClose` 콜백(`handleLayerClosed`)에서 실제로 스택 배열에서 제거하고, 그 아래 있던 레이어를 `push` 시점에 기록해둔 index로 즉시 복원한다.
- **주의**: `close()`는 index가 -1에 도달하면 항상 `onClose`를 발생시키는데(`node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheet.tsx`의 `animateToPositionCompleted`), `pushSheet`가 아래 레이어를 가리려고 호출하는 `close()`도 똑같이 `onClose`를 발생시킨다. 이게 실제 pop과 구분 없이 `handleLayerClosed`를 타면 "덮여서 숨겨진 것"이 스택에서 제거돼버리므로, `suppressCloseRef`에 "덮여서 닫힌" 키를 표시해두고 `handleLayerClosed`가 그 키를 보면 무시하도록 한다.
- `resetStack()`: 스택을 통째로 즉시 언마운트(애니메이션 없음, `close()`도 호출하지 않으므로 `onClose`/`suppressCloseRef`와 무관). bus/칩 재선택처럼 완전히 다른 컨텍스트로 전환할 때 사용.
- `BuildingDetailSheet`/`PlaceDetailSheet`/`PlaceListSheet`/`DaedongPlaceListSheet`/`CategoryListSheet`의 닫기(X) 버튼은 전부 `onClose={popSheet}`로 연결돼 있다 — "한 단계 뒤로"와 "닫기"가 스택 모델에서는 같은 동작이라 별도 back 버튼이 필요 없다 (places 목록에서 들어온 상세는 popSheet 시 목록으로, 지도에서 바로 들어온 상세는 popSheet 시 base(건물 목록)로 돌아감 — 스택 깊이가 자동으로 그 차이를 반영함).
- 장소 시트(place)는 중간 높이를 50% 대신 내용에 맞춘다. 이름·운영정보·사진·내 사진 카드를 지나 "리뷰 N" 영역이 시작하는 곳까지 재서(`onPeekHeightChange`) 핸들과 여백(리뷰 영역 위 20px + 8px)을 더하고 화면의 30~85% 안으로 맞춘다 (`layerSnapPoints`)
- 시트를 10%로 내려 둔 채 지도에서 같은 핀이나 다른 핀을 누르면 그 레이어를 절반(index 1)까지 다시 올린다 (`raiseLayer`). 더 올려 둔 경우는 그대로 둔다
- `selectCategoryPin`(장소/건물 마커 클릭·목록 항목 클릭 공용)은 항상 `pushSheet`만 호출한다 — 이미 상세가 열려 있는 상태에서 다른 핀을 클릭하면 그 위에 새 레이어가 또 쌓인다(뒤로가기 시 이전에 보던 핀으로 돌아감).

### 딥링크 진입

`placeId`/`expanded` 쿼리 파라미터로 진입한 경우 `pushSheet({ kind: 'place', placeId }, expanded === 'true' ? 2 : 1)`로 바로 push한다. 상세 쿼리가 아직 로딩 중이면 레이어 안에서 스피너를 보여주고(`renderStackScreenContent`), 로드되면 자동으로 콘텐츠가 바뀐다 — 예전처럼 "쿼리 완료를 기다렸다가 모드 전환" 하는 별도 처리가 필요 없다(레이어가 이미 push된 상태라 로딩 중에도 자리 자체는 바로 보이기 때문).

### 리뷰 수정·삭제와 로그인

- 리뷰 옵션(⋯)은 한 줄 44px 메뉴에 아이콘과 함께 둔다. 내 리뷰는 수정하기·삭제하기, 남의 리뷰는 신고하기·이 사람 차단. 삭제·차단은 빨간색(`text-error`)으로 구분한다. 삭제·차단 확인 창 버튼도 44px
- 수정하기는 리뷰 쓰기 화면(`/maps/reviews/write`)을 `reviewId`로 연다. 서버 `PATCH /reviews/{id}`(작성자만)가 본문·키워드·사진을 통째로 바꾼다(`updatePlaceReview`)
- 리뷰 쓰기·수정·좋아요·삭제·신고·차단은 로그인하지 않았으면 서버에 보내지 않고 로그인 안내(`showLoginRequiredModal`)를 띄운다. 쓰는 도중 로그인이 풀려 서버가 401/403을 주면(`isLoginRequiredError`) 실패 알림 대신 같은 안내를 띄운다

