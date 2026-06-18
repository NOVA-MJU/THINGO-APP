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
    bundleIdentifier: 'com.nova.thingo',
    infoPlist: {
      CFBundleDevelopmentRegion: 'ko',
      CFBundleLocalizations: ['ko'],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#1778ff',
    },
    permissions: ['READ_MEDIA_IMAGES', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE'],
    package: 'com.nova.thingo',
  },
  web: {
    bundler: 'metro',
    output: 'static',
  },
  plugins: [
    'expo-router',
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
        locationWhenInUsePermission: '현재 위치를 지도에 표시하기 위해 위치 권한이 필요합니다.',
        locationAlwaysAndWhenInUsePermission:
          '현재 위치를 지도에 표시하기 위해 위치 권한이 필요합니다.',
        locationAlwaysPermission: '현재 위치를 지도에 표시하기 위해 위치 권한이 필요합니다.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
