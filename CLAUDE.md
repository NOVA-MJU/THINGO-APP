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
