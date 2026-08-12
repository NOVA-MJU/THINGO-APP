import '@/global.css';

import { AuthProvider } from '@/context/auth-context';
import { LoginRequiredModalProvider } from '@/context/login-required-modal-context';
import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useFonts, type FontSource } from 'expo-font';
import { PortalHost } from '@rn-primitives/portal';
import Head from 'expo-router/head';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

if (Platform.OS !== 'web') {
  void SplashScreen.preventAutoHideAsync();
}

const nativeFonts: Record<string, FontSource> =
  Platform.OS === 'web'
    ? {}
    : {
        Pretendard: require('../assets/fonts/Pretendard-Regular.otf'),
        'Pretendard-Bold': require('../assets/fonts/Pretendard-Bold.otf'),
        'Pretendard-ExtraBold': require('../assets/fonts/Pretendard-ExtraBold.otf'),
        'Pretendard-ExtraLight': require('../assets/fonts/Pretendard-ExtraLight.otf'),
        'Pretendard-Medium': require('../assets/fonts/Pretendard-Medium.otf'),
        'Pretendard-SemiBold': require('../assets/fonts/Pretendard-SemiBold.otf'),
      };

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

const siteUrl = 'https://thingo.kr';
const SITE_DESCRIPTION =
  '명지대학교의 모든 정보를 내 손 안에. 번거로운 탐색은 끝, 필요한 소식을 가장 빠르게 확인해보세요!';

export default function RootLayout() {
  const [queryClient] = React.useState(() => new QueryClient());
  const pathname = usePathname();
  const canonicalUrl = `${siteUrl}${pathname === '/' ? '' : pathname}`;
  const [fontsLoaded, fontError] = useFonts(nativeFonts);
  const isReady = Platform.OS === 'web' || fontsLoaded || !!fontError;

  React.useEffect(() => {
    if (Platform.OS !== 'web' && isReady) {
      void SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) return null;

  return (
    <GestureHandlerRootView
      style={
        Platform.OS === 'web'
          ? {
              flex: 1,
              maxWidth: 600,
              width: '100%',
              marginHorizontal: 'auto',
              backgroundColor: '#ffffff',
            }
          : { flex: 1 }
      }
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider value={NAV_THEME}>
            <LoginRequiredModalProvider>
              {Platform.OS === 'web' && (
                <Head>
                  <title>띵고 Thingo</title>
                  {/* 페이지별 <Head>가 없을 때 쓰이는 기본값 (helmet은 나중에 선언된 쪽이 이김) */}
                  <meta name="description" content={SITE_DESCRIPTION} />
                  <meta property="og:title" content="띵고 Thingo" />
                  <meta property="og:description" content={SITE_DESCRIPTION} />
                  {/*
                    웹 정적 export 시 `(tabs)`, `(home)` 같은 그룹 경로 복사본이 함께 생성됨.
                    usePathname()은 그룹이 제거된 경로를 반환하므로,
                    복사본들도 모두 이 정규 URL 하나를 가리키게 됨.
                    og:url도 같은 값을 써야 공유 링크가 홈으로 쏠리지 않음
                  */}
                  <link rel="canonical" href={canonicalUrl} />
                  <meta property="og:url" content={canonicalUrl} />
                </Head>
              )}
              <StatusBar style="dark" />
              <BottomSheetModalProvider>
                <Stack screenOptions={{ headerShown: false }} />
                <PortalHost />
              </BottomSheetModalProvider>
            </LoginRequiredModalProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
