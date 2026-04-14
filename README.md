# thingo-app

This is a [React Native](https://reactnative.dev/) project built with [Expo](https://expo.dev/) and [React Native Reusables](https://reactnativereusables.com).

It was initialized using the following command, then the `Minimal (Nativewind)` template was selected when prompted:

```bash
npx @react-native-reusables/cli@latest init
```

## Getting Started

노드 v20.20.2 버전 셋업 (터미널 종료 시 초기화 되므로 작업 전에 매번 실행):

```bash
nvm use
```

<br />

패키지 설치:

```bash
pnpm install
```

<br />

`.env.local` 셋업: 자세한 내용은 `.env.example` 참고

<br />

개발 서버 실행:

```bash
pnpm dev
```

This will start the Expo Dev Server. Open the app in:

- **iOS**: press `i` to launch in the iOS simulator _(Mac only)_
- **Android**: press `a` to launch in the Android emulator
- **Web**: press `w` to run in a browser

You can also scan the QR code using the [Expo Go](https://expo.dev/go) app on your device. This project fully supports running in Expo Go for quick testing on physical devices.

## Git Strategy

### 브랜치 분류

| 브랜치 이름           | 설명             |
|---------------------|----------------|
| main                | 운영용          |
| develop             | 개발용          |
| feat/{제목}         | 기능 개발 브랜치  |
| chore/{제목}        | 기타 작업 브랜치  |
| fix/{제목}          | 핫픽스 브랜치    |

브랜치 제목은 `케밥-케이스` 사용

- feat/campaign-apply  
- fix/payment-error  
- chore/git-action-setup

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

커밋 메시지는 `자유 서식` 사용

- feat. 켐페인 지원 기능 추가
- fix. 결제 페이지 오류 수정
- chore. 패키지 의존성 업데이트

## Adding components

You can add more reusable components using the CLI:

```bash
npx react-native-reusables/cli@latest add [...components]
```

> e.g. `npx react-native-reusables/cli@latest add input textarea`

If you don't specify any component names, you'll be prompted to select which components to add interactively. Use the `--all` flag to install all available components at once.

## Project Features

- ⚛️ Built with [Expo Router](https://expo.dev/router)
- 🎨 Styled with [Tailwind CSS](https://tailwindcss.com/) via [Nativewind](https://www.nativewind.dev/)
- 📦 UI powered by [React Native Reusables](https://github.com/founded-labs/react-native-reusables)
- 🚀 New Architecture enabled
- 🔥 Edge to Edge enabled
- 📱 Runs on iOS, Android, and Web

## Learn More

To dive deeper into the technologies used:

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [Nativewind Docs](https://www.nativewind.dev/)
- [React Native Reusables](https://reactnativereusables.com)

## Deploy with EAS

The easiest way to deploy your app is with [Expo Application Services (EAS)](https://expo.dev/eas).

- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Updates](https://docs.expo.dev/eas-update/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)

---

If you enjoy using React Native Reusables, please consider giving it a ⭐ on [GitHub](https://github.com/founded-labs/react-native-reusables). Your support means a lot!
