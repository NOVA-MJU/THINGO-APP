import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Thingo',
  slug: 'thingo-app',
  version: '0.1.0',
  locales: { ko: './locales/ko.json' },
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'thingo-app',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.mju.thingo',
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
    permissions: ['READ_MEDIA_IMAGES', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE'],
  },
  web: {
    bundler: 'metro',
    output: 'static',
  },
  plugins: [
    'expo-router',
    'expo-notifications',
    [
      'expo-image-picker',
      {
        photosPermission:
          '프로필 이미지 또는 게시글 이미지 업로드를 위해 사진 라이브러리 접근 권한이 필요합니다.',
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
