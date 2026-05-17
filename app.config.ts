import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'thingo-app',
  slug: 'thingo-app',
  version: '1.0.0',
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
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.nova.thingo',
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
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
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
