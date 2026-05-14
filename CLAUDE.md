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
