# thingo-app

## 시작하기

노드 v20.20.2 버전 셋업 (터미널 종료 시 초기화 되므로 작업 전에 매번 실행):

```bash
nvm use
```

<br />

패키지 설치:

```bash
pnpm i
```

<br />

`.env.local` 셋업: 자세한 내용은 `.env.example` 참고

<br />

개발 버전 빌드 및 에뮬레이터 실행 (최초 빌드 또는 네이티브 코드 수정 시에만 수행):

```bash
# android
pnpm expo run:android

# ios
pnpm expo run:ios
```

참고: `/ios`, `/android` 는 깃에 올리지 않음. 깃 추적 여부는 추후 결정.

<br />

개발 버전 실행:

```bash
# android
pnpm android

# ios
pnpm ios
```

## 깃 전략

### 브랜치 분류

| 브랜치 이름           | 설명             |
|---------------------|----------------|
| main                | 운영용          |
| develop             | 개발용          |
| feat/{제목}         | 기능 개발 브랜치  |
| chore/{제목}        | 기타 작업 브랜치  |
| fix/{제목}          | 핫픽스 브랜치    |

- 브랜치 제목은 `케밥-케이스` 사용

```
feat/campaign-apply  
fix/payment-error  
chore/git-action-setup
```

<br />

### 커밋 메시지 분류

| 타입          | 의미                             |
|---------------|----------------------------------|
| feat. {내용}     | 새 기능                          |
| fix. {내용}      | 버그 수정                        |
| chore. {내용}    | 유지보수 (기능/버그 무관)        |
| docs. {내용}     | 문서 수정                        |
| refactor. {내용} | 리팩토링                         |
| style. {내용}    | 코드 포맷 변경                   |
| test. {내용}     | 테스트 추가/수정                 |

- 커밋 메시지는 `자유 서식`

```
feat. 켐페인 지원 기능 추가
fix. 결제 페이지 오류 수정
chore. 패키지 의존성 업데이트
```

<br />

### 파일 네이밍

| 구분 | 규칙 | 예시 |
|------|------|------|
| 화면·라우트 (`app/`) | Expo Router 규칙 준수 | `_layout.tsx`, `index.tsx`, `+not-found.tsx`, `+html.tsx`, `(group)/page.tsx` |
| 컴포넌트 (`components/`) | 케밥-케이스 사용 | `campaign-card.tsx` |
| 훅 (`hooks/`) | 카멜 케이스 사용 | `useAuth.ts`, `useCampaignForm.ts` |
| 유틸·헬퍼 (`lib/`) | 카멜 케이스 또는 단일 단어 소문자 | `utils.ts`, `theme.ts` |
| 설정·루트 스크립트 | 도구 관례 따름 | `babel.config.js`, `metro.config.js`, `tailwind.config.js` |

- 파일명에는 **공백·한글**을 쓰지 않는다.
