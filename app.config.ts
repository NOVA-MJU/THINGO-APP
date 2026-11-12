import { ExpoConfig } from 'expo/config';

// iOS 구글 로그인은 iOS 클라이언트 ID를 뒤집은 URL 스킴으로 앱에 돌아온다 (예: com.googleusercontent.apps.123-abc)
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const googleSignInPlugins: [string, { iosUrlScheme: string }][] = googleIosClientId
  ? [
      [
        '@react-native-google-signin/google-signin',
        {
          iosUrlScheme: `com.googleusercontent.apps.${googleIosClientId.replace('.apps.googleusercontent.com', '')}`,
        },
      ],
    ]
  : [];

// expo-image-picker와 expo-media-library가 같은 iOS 권한 문구(NSPhotoLibraryUsageDescription)를 쓰므로 하나로 맞춘다
const PHOTOS_PERMISSION =
  '리뷰를 쓸 때 그 장소에서 찍은 사진을 찾아 보여주고, 프로필·게시글·리뷰에 사진을 올리기 위해 사진 보관함 접근 권한이 필요합니다.';

const config: ExpoConfig = {
  name: 'Thingo',
  slug: 'thingo-app',
  version: '1.0.10',
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
        photosPermission: PHOTOS_PERMISSION,
        microphonePermission: false,
      },
    ],
    [
      'expo-media-library',
      {
        // 리뷰 작성 시 iOS에서만 사진첩을 읽어 장소 근처 사진을 추천한다.
        // 안드로이드는 Google Play 사진 권한 정책 때문에 아래 android.blockedPermissions로 READ_MEDIA_* 를 계속 막는다
        photosPermission: PHOTOS_PERMISSION,
        savePhotosPermission: false,
        granularPermissions: ['photo'],
        // 선택한 사진만 허용한 사용자에게 앱을 켤 때마다 iOS가 사진 추가 팝업을 띄우지 않게 한다
        preventAutomaticLimitedAccessAlert: true,
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
          // Google Play가 DEX 난독화 비율이 낮으면 게시를 제한하므로 릴리스 빌드에서 R8 축소·난독화를 켠다
          enableMinifyInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
        },
        ios: {
          // Firebase(Swift pod)는 static framework 형태로만 static 링크 가능 (SPM은 위에서 disableSPM으로 끔)
          useFrameworks: 'static',
        },
      },
    ],
    // iOS 클라이언트 ID가 없는 빌드는 구글 로그인 버튼을 숨기므로 URL 스킴도 등록하지 않는다
    ...googleSignInPlugins,
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
