import '@/global.css';

import { AuthProvider } from '@/context/auth-context';
import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts, type FontSource } from 'expo-font';
import { PortalHost } from '@rn-primitives/portal';
import Head from 'expo-router/head';
import { Stack } from 'expo-router';
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

export default function RootLayout() {
  const [queryClient] = React.useState(() => new QueryClient());
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
            {Platform.OS === 'web' && (
              <Head>
                <title>Thingo</title>
              </Head>
            )}
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }} />
            <PortalHost />
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
