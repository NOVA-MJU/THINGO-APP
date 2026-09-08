import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Thingo',
  slug: 'thingo-app',
  version: '1.0.1',
  locales: { ko: './locales/ko.json' },
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'thingo-app',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#1778ff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.mju.thingo',
    googleServicesFile: './GoogleService-Info.plist',
    infoPlist: {
      CFBundleDevelopmentRegion: 'ko',
      CFBundleLocalizations: ['ko'],
    },
  },
  android: {
    package: 'com.mju.thingo',
    googleServicesFile: './google-services.json',

    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#1778ff',
    },
    blockedPermissions: [
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VIDEO',
      'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.RECORD_AUDIO',
    ],
  },
  web: {
    bundler: 'metro',
    output: 'static',
  },
  plugins: [
    'expo-router',
    'expo-notifications',
    [
      '@react-native-firebase/app',
      {
        // SPM(dynamic 링크 강제)을 켜면 네이버 지도 SDK(static XCFramework)가 링크 안 됨.
        // CocoaPods 경로로 받아서 기존 static 링크 방식을 그대로 유지
        ios: { disableSPM: true },
      },
    ],
    '@react-native-firebase/messaging',
    'expo-font',
    'expo-secure-store',
    'expo-video',
    'expo-web-browser',
    [
      'expo-image-picker',
      {
        photosPermission:
          '프로필 이미지 또는 게시글 이미지 업로드를 위해 사진 라이브러리 접근 권한이 필요합니다.',
        microphonePermission: false,
      },
    ],
    [
      '@mj-studio/react-native-naver-map',
      {
        client_id: process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID,
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          // 네이버 지도 SDK Maven 저장소
          extraMavenRepos: ['https://repository.map.naver.com/archive/maven'],
        },
        ios: {
          // Firebase(Swift pod)는 static framework 형태로만 static 링크 가능 (SPM은 위에서 disableSPM으로 끔)
          useFrameworks: 'static',
        },
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          '사용자 주변의 학교 시설을 안내하기 위해 위치 정보가 필요합니다.',
        locationAlwaysAndWhenInUsePermission:
          '사용자 주변의 학교 시설을 안내하기 위해 위치 정보가 필요합니다.',
        locationAlwaysPermission: '사용자 주변의 학교 시설을 안내하기 위해 위치 정보가 필요합니다.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: '8d706b08-8345-411a-a29a-99ec2ffb93c4',
    },
  },
};

export default config;
