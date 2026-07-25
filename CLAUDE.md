# THINGO APP

## environment

- Node.js: v20.20.2
- 패키지 매니저: **pnpm** (npm, yarn 사용 금지)

## target

- android, ios, web 모두 동작 가능해야한다.

## installation

패키지 설치 명령어는 직접 실행하지 말고 사용자가 실행할 수 있도록 출력:

```
pnpm add <package>
pnpm expo install <package>
```

네이티브 모듈 추가 후 prebuild 필요한 경우 사용자에게 지시:

```
pnpm expo prebuild
pnpm expo run:ios
pnpm expo run:android
```

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

## localization

- 앱은 한국어만 지원
- `locales/ko.json`은 한국어 감지용 형식적인 파일이고 i18n키 추가하지 말 것

## routing (`app/(tabs)/(home)`)

- 홈 탭(ALL/학식/게시판/공지사항/학사일정/명대신문/명대뉴스) 이동 방식이 플랫폼별로 다름
  - **모바일**: 라우트는 항상 `/` 하나이고 `tab` 쿼리 파라미터로 어느 탭인지 구분 (`app/(tabs)/(home)/index.tsx`가 스와이프 뷰로 렌더링)
  - **웹**: 탭마다 실제 URL이 따로 있음 (`/`, `/meal`, `/posts`, `/notices`, `/academic-calendar`, `/newspaper`, `/news` — `TAB_PATHS` 배열 참고). `/`로 이동해도 `tab` 파라미터는 무시되고 `AllScreen`만 렌더링됨
- 게시판 목록으로 되돌아가거나 새로고침 신호(`refreshBoards`, `boardCategory`)를 넘길 때, `Platform.OS`로 분기해서 모바일은 `pathname: '/'` + `tab: 'board'`, 웹은 `pathname: '/posts'`(`tab` 파라미터 불필요)로 이동해야 함

## lib utilities

- Tailwind 클래스 병합 시 `cn()` 사용 (`lib/utils.ts`)
- 알림 표시 `Alert.alert` 직접 사용 금지(웹 미지원) - `showAlert()` 사용할 것 (`lib/alert.ts`)
- 확인/취소 모달 표시 시에도 `Alert.alert` 직접 사용 금지(웹 미지원) - `showConfirm()` 사용할 것 (`lib/alert.ts`)
- 외부 URL 열기 시 `WebBrowser.openBrowserAsync` 직접 사용 금지(웹에서 작은 팝업창으로 열림) - `openLink()` 사용할 것 (`lib/open-link.ts`, 모바일은 `WebBrowser`, 웹은 `Linking.openURL`로 새 탭 오픈)

## comments

- 기존 파일을 수정할 때 주석을 삭제하지 않는다

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
