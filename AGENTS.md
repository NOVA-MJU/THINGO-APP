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

- 홈 탭(ALL/학식/게시판/공지사항/학사일정/명대신문/명대뉴스) 이동 방식이 플랫폼별로 다름
  - **모바일**: 라우트는 항상 `/` 하나이고 `tab` 쿼리 파라미터로 어느 탭인지 구분 (`app/(tabs)/(home)/index.tsx`가 스와이프 뷰로 렌더링)
  - **웹**: 탭마다 실제 URL이 따로 있음 (`/`, `/meal`, `/posts`, `/notices`, `/academic-calendar`, `/newspaper`, `/news` — `TAB_PATHS` 배열 참고). `/`로 이동해도 `tab` 파라미터는 무시되고 `AllScreen`만 렌더링됨
- 게시판 목록으로 되돌아가거나 새로고침 신호(`refreshBoards`, `boardCategory`)를 넘길 때, `Platform.OS`로 분기해서 모바일은 `pathname: '/'` + `tab: 'board'`, 웹은 `pathname: '/posts'`(`tab` 파라미터 불필요)로 이동해야 함

## app/ 하위 `_components` (라우트가 아닌 파일)

- Next.js와 달리 **Expo Router에는 private folder 규칙이 없다**. `_` 접두사가 붙어도 `_layout`만 특별 취급되고, `app/` 안의 모든 `.tsx`가 라우트로 등록됨
- 그래서 `app/**/_components/*.tsx`에는 **`export default`가 반드시 있어야 한다**. 없으면 앱 실행 때마다 `Route "..." is missing the required default export` 경고가 뜸
- `export default function X()` 형태로 쓰고, import하는 쪽도 default import로 맞출 것 (named export를 겸하면 관례가 섞임)

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
