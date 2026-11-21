- 에이전트 룰 작성해달라는 요청을 받을 경우 하이픈을 넣고 1~2줄로 룰 작성. 특수문자나 markdown 문법은 최소화 할 것.

- 한글로 답변 생성해주세요.

- node 버전 - 22.23.2

- 패키지 매니저 - pnpm (npm, yarn 절대 사용금지)

- android, ios, web 모두 호환 가능하도록 구현해주세요.

- 패키지 설치 명령어는 절대 스스로 실행하지 말고 대신 사용자가 직접 실행할 수 있도록 명령어를 출력해주세요.

```
pnpm add <package>
pnpm expo install <package>
```

- 네이티브 모듈 추가 후 prebuild 필요한 경우 사용자에게 알려주세요.

```
pnpm expo prebuild
pnpm expo run:ios
pnpm expo run:android
```

- 앱은 한국어만 지원하고 locales/ko.json 는 한국어 감지용 형식적인 파일임

- git commit, push 명령어 사용 금지

- 기존 파일의 주석 삭제 금지. 주석은 "왜 이렇게 구현했는지"(현재 상태의 이유)를 적을 것. "예전에는 ~였는데" 같은 변경 이력·비교 서술은 나중에 그 배경을 모르는 사람이 읽으면 이해하기 어려우므로 지양

## scripts

사용자에게 명령어를 안내할 때 `package.json` scripts에 있는 경우 스크립트를 우선 사용:

| 원래 명령어                             | 스크립트         |
| --------------------------------------- | ---------------- |
| `pnpm expo start -c`                    | `pnpm dev`       |
| `pnpm expo prebuild`                    | `pnpm prebuild`  |
| `pnpm expo run:ios`                     | `pnpm ios`       |
| `pnpm expo run:android`                 | `pnpm android`   |
| `pnpm expo export --platform web`       | `pnpm build:web` |
| `rm -rf .expo node_modules android ios` | `pnpm clean`     |

## deploy

- 웹: `main`에 머지하면 `deploy-web.yml`이 바로 배포한다 (feature → `develop` PR → `develop` → `main` PR)
- 앱 TestFlight(빌드 횟수 차감 없음): GitHub Actions `ios-testflight.yml`을 수동 실행한다(`gh workflow run ios-testflight.yml --ref main`). 공개 저장소라 무료인 GitHub macOS 머신(`xcode-27`, Xcode 27.2 고정)에서 `eas build --local`로 빌드하고 `eas submit`으로 제출한다. 서명·App Store Connect 키는 EAS 서버 것을 `EXPO_TOKEN`(thingo_mju 계정 토큰) 시크릿으로 받아 쓴다
- 앱: `app-release` 브랜치에 올렸을 때만 `deploy-app.yml`이 EAS로 iOS·Android를 빌드하고 스토어에 제출한다. EAS 무료 플랜은 월 빌드 횟수가 적으니 시뮬레이터로 다 확인한 최종본만 올린다: `git push origin main:app-release`
- App Store에 이미 승인된 버전 번호로는 새 빌드를 받지 않는다 (ITMS-90186). 출시 전에 `app.config.ts`의 `version`을 올린다
- iOS는 Xcode 27(iOS 27 SDK)로 빌드하고 iOS 27 시뮬레이터로 확인한다. iOS 27은 UIScene 생명주기를 쓰지 않는 앱을 바로 꺼서, `plugins/with-ios-scene-lifecycle.js`가 prebuild 때 SceneDelegate와 Info.plist scene 설정을 넣는다 (React Native는 scene의 window에서 시작하고, 링크로 열린 경우 launchOptions에 넣어 `Linking.getInitialURL`이 받는다). Expo 템플릿이 바뀌어 넣을 자리를 못 찾으면 prebuild가 멈춘다
- Xcode 27은 최소 iOS 15 미만 Pod 타깃을 아카이브할 때 오류로 거부해서, `plugins/with-ios-pod-deployment-target.js`가 Podfile post_install에서 앱 최소 버전보다 낮은 Pod 타깃을 올린다
- 로컬 TestFlight 빌드: `eas build --platform ios --profile production --local` 후 `eas submit --path`. EAS 빌드 횟수를 쓰지 않는다. 이 맥 로그인 키체인에 애플 WWDR G3 중간 인증서가 있어야 배포 인증서 확인을 통과한다
- EAS는 깃에 올라간 파일로 빌드한다. `modules/*/ios` 같은 로컬 네이티브 모듈 소스가 커밋됐는지 확인한다 (`.gitignore`는 루트 `/ios/`, `/android/`만 무시)
- EAS 환경변수(`EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID`)는 expo.dev 프로젝트에 있다. 빌드 로그의 "loaded from the production environment on EAS" 줄에 둘 다 있는지 본다

## naming conventions

| 구분                     | 규칙                              | 예시                                                                          |
| ------------------------ | --------------------------------- | ----------------------------------------------------------------------------- |
| 화면·라우트 (`app/`)     | Expo Router 규칙 준수             | `_layout.tsx`, `index.tsx`, `+not-found.tsx`, `+html.tsx`, `(group)/page.tsx` |
| 컴포넌트 (`components/`) | 케밥-케이스 사용                  | `campaign-card.tsx`                                                           |
| 훅 (`hooks/`)            | 카멜 케이스 사용                  | `useAuth.ts`, `useCampaignForm.ts`                                            |
| 유틸·헬퍼 (`lib/`)       | 카멜 케이스 또는 단일 단어 소문자 | `utils.ts`, `theme.ts`                                                        |
| 설정·루트 스크립트       | 도구 관례 따름                    | `babel.config.js`, `metro.config.js`, `tailwind.config.js`                    |

- 파일명에는 **공백·한글**을 쓰지 않음

## routing (`app/(tabs)/(home)`)

- 홈 탭(ALL/학식/게시판/공지사항/학사일정) 이동 방식이 플랫폼별로 다름
  - **모바일**: 라우트는 항상 `/` 하나이고 `tab` 쿼리 파라미터로 어느 탭인지 구분 (`app/(tabs)/(home)/index.tsx`가 스와이프 뷰로 렌더링)
  - **웹**: 탭마다 실제 URL이 따로 있음 (`/`, `/meal`, `/posts`, `/notices`, `/academic-calendar` — `_layout.tsx`의 `TAB_PATHS` 배열 참고). `/`로 이동해도 `tab` 파라미터는 무시되고 `AllScreen`만 렌더링됨
  - 웹·모바일 탭바에는 명대신문·명대뉴스가 없다. `/newspaper`, `/news` 라우트와 화면 컴포넌트는 남아 있어 주소로 들어가면 열린다. 웹에서는 이때 탭바가 ALL이 선택된 상태로 보인다
- 게시판 목록으로 되돌아가거나 새로고침 신호(`refreshBoards`, `boardCategory`)를 넘길 때, `Platform.OS`로 분기해서 모바일은 `pathname: '/'` + `tab: 'board'`, 웹은 `pathname: '/posts'`(`tab` 파라미터 불필요)로 이동해야 함

## app/ 하위 `_components` (라우트가 아닌 파일)

- Next.js와 달리 **Expo Router에는 private folder 규칙이 없다**. `_` 접두사가 붙어도 `_layout`만 특별 취급되고, `app/` 안의 모든 `.tsx`가 라우트로 등록됨
- 그래서 `app/**/_components/*.tsx`에는 **`export default`가 반드시 있어야 한다**. 없으면 앱 실행 때마다 `Route "..." is missing the required default export` 경고가 뜸
- `export default function X()` 형태로 쓰고, import하는 쪽도 default import로 맞출 것 (named export를 겸하면 관례가 섞임)

## 사진첩 접근

- 안드로이드는 Google Play 사진 권한 정책 때문에 READ_MEDIA_IMAGES 등을 `app.config.ts`의 `blockedPermissions`로 막고 시스템 사진 선택기만 쓴다. 사진첩 전체를 읽는 기능은 iOS 전용으로 만든다
- 리뷰 작성의 "여기서 찍은 사진"(`app/maps/reviews/_components/place-photo-suggestions.tsx`)은 사진 위치를 기기 안에서만 비교하고 서버로 보내지 않는다
- 장소 상세(`sheet-place-detail.tsx`)와 리뷰 작성은 같은 훅 `hooks/use-place-photos.ts`(같은 react-query 캐시)를 쓴다
- 사진 찾기는 기간·장수 제한 없이 사진첩 전체를 본다. 사진마다 위치를 따로 묻는 expo-media-library로는 수만 장이 너무 느려서, 로컬 네이티브 모듈 `modules/photo-location-scan`(iOS 전용, `./modules`는 Expo 자동 링크 대상)이 PHAsset 목록을 한 번 훑으며 좌표 상자 안 사진만 돌려준다. 이 모듈을 바꾸면 스토어 빌드가 새로 나가야 반영된다
- 지도의 다홍색 "다녀온 곳" 핀(`hooks/use-visited-places.ts`)은 대동명지도 가게 전체(`/map/categories/daedong/markers`)와 내 사진 위치를 기기 안에서 비교해 만든다. 대동 상권은 가게가 몇 m 간격이라 실내 GPS로 가게는 못 가리지만 건물 정도는 맞아서, 사진을 가장 가까운 가게의 건물(도로명 주소가 같은 곳, `buildingKeyOf`)로 묶어 건물 하나에 핀 하나를 "사진 N장"(아직 리뷰에 안 올린 음식 사진)으로 띄운다. 핀 자리는 그 건물 가게들의 가운데다. 장소 상세의 사진 수는 가게 기준(`filterPhotosForPlace`)이다
- 장소 사진과 다녀온 곳은 음식·음료 사진만 쓴다. 같은 네이티브 모듈의 `classifyPhotos`(Apple Vision, 기기 안)로 라벨을 받아 `lib/photo-food.ts`가 음식인지 보고, 라벨은 AsyncStorage에 기억해 새 사진만 분류한다(`lib/photo-labels.ts`). 사진 음식으로 붙어 있는 가게 후보도 좁힌다(커피면 카페만, 맞는 곳이 없으면 그대로). 확인: `node lib/photo-food.check.mjs`
- 띵고는 새 서비스라 사진첩에 지금은 없어진 예전 가게 사진이 섞인다. 사진 위치로는 가릴 수 없어서 "여기서 찍은 내 사진" 카드와 핀 사진 시트에서 X("지금은 없어진 가게예요" / "이 가게 사진이 아니에요")로 숨기게 한다. 숨긴 사진은 장소 id별로 기기에 기억해(`lib/maps/dismissed-place-photos.ts`) 그 장소 제안, 리뷰 쓰기 추천, 다녀온 곳 핀에서 뺀다
- 리뷰에 이미 올린 내 사진은 "여기서 찍은 내 사진"과 다녀온 곳 핀에서 뺀다. 리뷰별로 사진첩 id와 이미지 주소를 기기에 기억해서(`lib/maps/uploaded-review-photos.ts`) 리뷰를 고쳐 사진을 빼거나 리뷰를 지우면(`deletePlaceReview`) 다시 나온다. 리뷰를 쓰거나 고치거나 지운 뒤에는 `refreshMyPhotoSuggestions`로 다시 찾는다. 다른 기기에서 썼거나 예전에 올린 리뷰는 내 리뷰 이미지를 사진첩 사진과 기기 안에서 그림 특징값(Vision `findPhotosMatchingImages`)으로 비교해 찾고, 비교한 이미지 주소는 기억해 다시 받지 않는다. 장소 상세는 그 장소를, 핀은 이 기기에서 리뷰를 쓴 가게만 비교한다
- 리뷰에 올린 사진과 같은 날 3시간·100m 안에서 찍은 사진은 그 리뷰의 가게 사진으로 본다(`assignPhotosToUploadedPlaces`, 확인: `node lib/photo-location.check.mjs`). 다섯 장 중 한 장만 올려도 나머지는 GPS가 옆 가게를 가리켜도 그 가게 "여기서 찍은 내 사진"에 나오고, 지도 시트에서도 그 가게가 맨 위에 온다
- 이 기기에서 리뷰를 쓴 가게는 AsyncStorage(`lib/maps/reviewed-places.ts`)에 기억해, 다녀온 곳 핀이 그 가게의 예전 리뷰 사진을 비교할 때 쓴다. 가게 자체는 핀 후보에서 빼지 않는다(다시 가서 찍은 사진일 수 있다). 서버에 "내가 쓴 리뷰" API가 생기면 그걸로 바꾼다
- 다녀온 곳 핀을 켜면 내가 리뷰를 남긴 곳(서버 `GET /reviews/me`, `hooks/use-my-place-reviews.ts`)도 글자 없는 가는 파란 핀(머리 점 + 얇은 기둥)으로 같이 띄운다. 눈에 띄지 않게 다녀온 곳 핀·건물 라벨보다 아래에 깔고, 누르면 그 장소 상세가 열린다
- 학교 주변이 좁아 알약을 다 띄우면 겹친다. 화면에서 알약끼리 겹칠 만큼(130x40pt 안) 가까운 핀을 "내가 찍은 사진 N장"(합계) 알약 하나로 묶는다(`clusterOverlappingPins`, `lib/maps/cluster-visits.ts`, 확인: `node lib/maps/cluster-visits.check.mjs`). 대표는 최근에 간 곳이고 화면 거리는 줌으로만 정해져서 지도를 옮겨도 핀이 튀지 않는다. 고정 격자로 나누면 칸 경계 양쪽의 가까운 건물이 안 묶여 겹쳐서 쓰지 않는다. 묶음 핀을 누르면 묶음이 처음 나뉘는 줌(`zoomToSplit`, 어느 정도 확대된 상태면 한 단계만, 최대 19)과 풀린 핀이 시트에 가리지 않고 다 보이는 줌(`zoomToFit`, 카메라 목표가 지도 위 2/5 지점인 것까지 고려) 중 작은 쪽으로 확대하고, 건물마다 내 사진을 좌우 한 줄로 보여주는 시트(`sheet-visit-area.tsx`)를 띄운다. 건물을 고르거나 풀린 건물 핀을 누르면 그 건물 시트로 간다. 지금 보고 있는 곳은 묶지 않고 따로 띄운다
- 건물 핀을 누르면 뜨는 시트는 맨 위 사진 줄(`sheet-visit-photos.tsx`)과 가게 목록(`sheet-visit-candidates.tsx`)으로 나뉜다. 사진 줄은 시트를 스크롤해도 위에 붙어 있어(`SheetStackLayer stickyHeader`) 사진을 고른 채 가게 목록을 내려 볼 수 있다. 둘이 따로 그려져서 고른 사진은 시트 화면 상태(`selectedPhotoIds`)로 둔다. 사진 줄은 그 건물 근처에서 찍은 내 사진을 좌우 한 줄로(찍은 날마다 작은 날짜 글씨와 옅은 세로선) 보여주고 가장 최근 날을 미리 고른다. 가게 목록은 같이 찍은 사진을 리뷰에 올린 곳 -> 이 건물 가게(사진 음식에 맞는 곳 먼저) -> 주변 60m 가게(가까운 순) -> "주변 가게 더 보기"(10곳씩) -> 이름으로 찾기 순이다. 가게를 누르면 고른 사진이 고른 순서대로 붙은 리뷰 쓰기(`/maps/reviews/write?photoIds=`)로 바로 간다. 고른 가게가 멀어 그 가게 근처 사진 목록에 없어도 쓰기 화면이 사진첩에서 바로 읽어 올린다
- 사진을 누르면 전체 화면으로 크게 본다(`library-photo-viewer.tsx`). 사진은 자르지 않고 원본 비율 그대로 화면에 맞추고, 확대하지 않은 상태에서 좌우로 밀면 이전·다음 사진이다(`ZoomableMedia onSwipe`). 맨 위 한 줄은 왼쪽 뒤로 가기, 오른쪽 "N 완료"이고, 고르기 동그라미(고른 순번)는 사진 안 오른쪽 위에 얹는다. 맨 아래는 작은 사진 줄과 "5 / 6" 순번. 위아래 옅은 검은 그라데이션과 글자 그림자로 밝은 사진에서도 읽히게 한다. 장소 상세 "여기서 찍은 내 사진" 카드도 사진을 누르면 같은 화면으로 크게 보고, 리뷰 쓰기 추천과 같은 날짜 표기(`formatPhotoDay`)로 나눈다
- "다녀온 곳 N" 버튼으로 핀을 켜면 전체 목록 시트(`visit-list`, `sheet-visit-group.tsx`)도 같이 뜬다. 맨 위에 아직 리뷰에 안 올린 내 사진을 최근 순으로 좌우 한 줄로 보여주고(누르면 그 사진의 건물로 간다), 아래는 핀과 같이 건물 하나가 한 줄이다. 줄 제목은 그 건물에서 가장 그럴듯한 가게("OO 외 N곳"), 그 아래 사진 수·날짜·거리. 지도 가운데에서 가까운 순이고, 누르면 그 핀으로 지도를 옮기고(줌 18) 핀을 강조하며 시트를 가장 낮게 내린다 (지도 이동이 끝날 때 `onCameraSettle`로 가운데·줌을 받는다)
- 핀은 기본으로 숨기고 지도 왼쪽 아래 "다녀온 곳 N" 버튼을 눌렀을 때만 띄운다(다시 누르면 숨김, 저장하지 않아 앱을 다시 열면 숨김). 핀 글자는 SDK 캡션이 마커 전체 높이 가운데에 놓여서, 꼬리 높이만큼 위에 빈칸을 둬 알약 가운데에 맞춘다
- iOS 지도 마커의 자식 뷰는 이미지로 찍히는데 그 시점에 RN Text가 그려지지 않는다. 라벨 글자는 SDK `caption`(`align: 'Center'`)으로 얹고 뷰는 배경만 그린다 (`components/naver-map/naver-map.native.tsx`)

## web seo (메타 태그)

- 웹 전용 메타 태그는 `expo-router/head`의 `<Head>`로 넣는다. 내부적으로 react-helmet이라 **나중에 선언된 쪽이 이김** (하위 페이지가 `_layout.tsx` 기본값을 덮어씀)
- **`app/+html.tsx`에는 페이지마다 값이 달라지는 태그를 넣지 말 것.** 이 파일의 태그는 helmet이 관리하지 않아서, 페이지가 같은 태그를 `<Head>`로 넣으면 **태그가 두 개 생긴다**
  - 페이지별로 관리하는 태그: `title`, `description`, `og:title`, `og:description`, `og:url`, `canonical` — 기본값은 `app/_layout.tsx`의 `<Head>`에 있음
  - `+html.tsx`에 남기는 태그: `og:type`, `og:site_name`, `og:image*`, `twitter:card`, `twitter:image` 등 사이트 공통 값만
  - `twitter:title`/`twitter:description`은 두지 않음 — 없으면 `og:*`로 대체되므로 페이지별 값이 자동 적용됨
- 색인 대상 페이지(`public/sitemap.xml`에 등재된 것)를 새로 추가하면 `<Head>`에 `title`, `description`, `og:title`, `og:description`을 함께 넣을 것. 제목·설명 문자열은 파일 상단 상수로 묶어 `<title>`과 `og:*`가 어긋나지 않게 함
- `Platform.OS === 'web'` 분기는 모바일과 공용인 화면에서만 필요. `app/(tabs)/(home)/meal.tsx`처럼 웹 전용 라우트 파일은 분기 없이 `<Head>`를 써도 됨
- `public/robots.txt`에서 **`/_expo/`를 차단하면 안 된다** — CSS·JS 번들이 이 경로에 있고, 콘텐츠를 클라이언트에서 그리기 때문에 막으면 크롤러가 빈 페이지를 보게 됨

## auth (`context/auth-context.tsx`)

- 로그인 상태 확인은 `useAuth()` 훅 사용: `{ user, setUser, isInitializing, logout }` 반환. `user`가 `null`이면 미로그인, `MemberInfo` 객체면 로그인 상태
- 화면 진입 자체를 막아야 할 때(예: `app/notifications/index.tsx`): `isInitializing`이 끝난 뒤 `!user`면 `<Redirect href="/login" />`로 가드
- 버튼 클릭 등 액션 단위로 로그인 여부만 체크해 분기할 때는 `context/login-required-modal-context.tsx`의 `useLoginRequiredModal()` → `showLoginRequiredModal()` 사용 (파라미터 없음, 모달의 "로그인" 버튼을 누르면 내부적으로 `/login`으로 이동까지 처리됨). 커스텀 안내 문구·디자인이 필요하면 `components/ui/dialog.tsx`의 `Dialog`로 직접 구현
- 푸시 알림 토큰 등록/해제는 `AuthProvider`가 자동 처리 (`user`가 세팅되면 `registerCurrentDeviceForPush()`, `logout()` 호출 시 `unregisterCurrentDeviceForPush()`) — 화면에서 별도로 호출할 필요 없음
- 앱은 로그인하지 않아도 키워드 알림·알림 내역을 쓸 수 있다. 서버가 발급한 기기 ID(`api/device-id.ts`)를 모든 요청에 `X-Device-Id`로 보내고, 서버는 로그인하지 않은 요청을 이 기기 기준으로 처리한다. 웹은 푸시를 받을 수 없어 로그인해야 한다
- 알림 기능 접근 여부는 `user` 대신 `hooks/useAlarmAccess.ts`의 `canUseAlarms`로 판단한다. 로그인하면 `AuthProvider`가 이 기기의 알림을 계정으로 합친다(`mergeDeviceAlarms`)

## lib utilities

- Tailwind 클래스 병합 시 `cn()` 사용 (`lib/utils.ts`)
- 알림 표시 `Alert.alert` 직접 사용 금지(웹 미지원) - `showAlert()` 사용할 것 (`lib/alert.ts`)
- 확인/취소 모달 표시 시에도 `Alert.alert` 직접 사용 금지(웹 미지원) - `showConfirm()` 사용할 것 (`lib/alert.ts`)
- 외부 URL 열기 시 `WebBrowser.openBrowserAsync` 직접 사용 금지(웹에서 작은 팝업창으로 열림) - `openLink()` 사용할 것 (`lib/open-link.ts`, 모바일은 `WebBrowser`, 웹은 `Linking.openURL`로 새 탭 오픈)

## icons

### 구조

```
components/icons/
  navigation/          ← 네비게이션 전용 아이콘
    home.tsx
    map.tsx
    explore.tsx
    profile.tsx
    index.ts           ← named export 모음
  heart.tsx            ← 공통 아이콘 (케밥-케이스)
  index.ts
```

### 아이콘 컴포넌트 규칙

- 기본 색상: `text-black`, `className` prop으로 오버라이드
- 크기: `size` prop (기본값 컴포넌트 내부에서 정의, 파일명에 크기 포함 금지)
- 색상 적용: `cssInterop` + `currentColor` 패턴 사용

## accessibility

- 아이콘만 있고 텍스트 라벨이 없는 `TouchableOpacity`/`Pressable`에는 `accessibilityRole="button"`과 `accessibilityLabel`을 반드시 추가할 것 (자식에 읽어줄 텍스트가 없어 스크린리더가 안내를 못 함)
- 자식에 `<Text>`가 있는 버튼은 RN이 해당 텍스트를 접근성 이름으로 자동 인식하므로 `accessibilityLabel`을 따로 넣지 않음 (중복 관리 부담만 생김)

## architecture

- 프레임워크 관례를 우선한다. 화면과 컴포넌트는 함수 컴포넌트와 훅으로 작성하고 class 컴포넌트는 쓰지 않는다
- 객체지향 원칙은 class가 아니라 모듈 단위로 적용한다. 파일 하나가 책임 하나를 갖고 외부에는 export한 함수와 타입만 노출한다

### 계층과 의존 방향

- 의존은 app 화면 -> 화면 전용 \_hooks 또는 hooks -> api, lib 방향으로만 한다. api와 lib는 app, components를 import하지 않는다
- api 파일은 서버 연결 어댑터다. 서버 응답 타입은 파일 안에만 두고 normalize 함수로 앱 모델로 바꿔 반환한다. 기준 api/posts.ts normalizeBoard
- 화면은 서버 응답 필드명을 몰라야 한다. 필드 별칭 처리와 null 보정은 normalize에서 끝낸다
- lib에는 플랫폼 차이를 감싸는 어댑터(alert, open-link, push-notifications)와 React를 모르는 순수 함수(format, validation)만 둔다
- 서버 호출 함수는 api에 둔다. lib/maps/bus-arrivals.ts처럼 lib에서 client를 직접 쓰는 파일은 새로 만들지 않는다
- context는 로그인, 전역 모달처럼 앱 전체가 공유하는 상태에만 쓴다. 화면 하나에서만 쓰는 상태를 context로 올리지 않는다
- context는 Provider 밖에서 호출하면 throw하는 useXxx 훅과 함께 export한다. 기준 context/auth-context.tsx

### 플랫폼 분리

- 동작이 플랫폼마다 다르면 .native.tsx와 .web.tsx로 파일을 나누고 타입은 .d.ts 하나로 맞춘다. 기준 components/post-content
- 스타일만 다르면 Platform.select로 처리하고 cva variants 안에 넣는다. 기준 components/ui/button.tsx
- 화면 파일 하나에 Platform.OS 분기가 3곳을 넘으면 lib 어댑터나 플랫폼 파일로 옮긴다
- ios와 android를 구분하는 분기에는 왜 다르게 처리하는지 한 줄 주석을 단다 (키보드 이벤트, safe area 등)

### 분기 줄이기

- 값에 따라 결과만 달라지는 분기는 if나 switch 대신 Record, Map 매핑 객체와 ?? 기본값으로 쓴다. 기준 lib/maps/icons.ts, lib/open-link.ts
- 조건에 따라 바뀌는 className은 cva variants로 표현한다
- 함수 첫머리의 조기 반환은 권장한다. 2단계 이상 중첩 if와 else if 체인은 피한다
- 같은 조건 검사가 여러 함수에 반복되면 그 조건을 기준으로 컴포넌트나 함수를 나눈다

### 서버 상태와 예외

- 서버 데이터 조회와 변경은 useQuery, useMutation으로 한다. 로딩 여부를 useState와 try finally로 직접 관리하지 않는다. 기준 maps/favorites/\_components/group-edit-sheet.tsx
- 실패 알림은 useMutation onError에서 showAlert(제목, getApiErrorMessage(error, 기본문구))로 통일한다
- queryKey는 도메인 kebab-case 문자열로 시작한다 (favorite-groups, map-place-detail). 같은 key를 두 파일 이상에서 쓰면 해당 api 파일에 key를 만드는 함수를 두고 가져다 쓴다
- 빈 catch는 쓰지 않는다. 의도적으로 무시할 때는 무시해도 되는 이유를 주석으로 남긴다. 기준 maps/search/index.tsx 위치 조회 실패 처리

### 상태와 변수

- 모듈 최상단 let은 어댑터 내부 캐시나 큐처럼 앱 실행 동안 하나만 있어야 하는 값에만 쓰고 이유 주석을 단다. 기준 api/client.ts isRefreshing
- 다른 state로 계산할 수 있는 값은 state로 만들지 않고 렌더 중 계산하거나 useMemo로 파생시킨다. 기준 maps/index.tsx의 sheetStack 파생값
- 컴포넌트 하나의 useState가 8개를 넘으면 기능 단위로 컴포넌트나 훅을 분리할 신호로 본다

### 재사용과 분리 기준

- 분리 기준은 줄 수가 아니라 독립적으로 동작하는 기능인가다. 자기 데이터 조회, mutation, 상태를 스스로 갖는 단위로 자른다. 기준 group-edit-sheet.tsx
- 라우트 하나에서만 쓰는 것은 그 라우트 아래 \_components, \_constants, \_hooks에 둔다
- 서로 다른 기능 두 곳 이상에서 같은 의미로 쓰일 때만 components, hooks, lib로 올린다. 한 곳에서만 쓰는 추상화는 만들지 않는다
- 지금 모양은 같아도 앞으로 따로 바뀔 가능성이 크면 복사를 허용하고 원본 파일명을 주석에 남긴다. 기준 sheet-building-list.tsx
- 파일이 300줄을 넘으면 위 기준으로 떼어낼 기능이 있는지 검토한다
