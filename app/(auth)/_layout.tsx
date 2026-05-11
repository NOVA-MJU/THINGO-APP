import { AppHeader } from '@/components/app-header';
import { useAuth } from '@/context/auth-context';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PAGE_TITLES: Record<string, string> = {
  login: '로그인',
  signup: '회원가입',
  'forgot-password': '비밀번호 재설정',
};

export default function AuthLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isInitializing } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isInitializing) return;
    if (user) {
      if (Platform.OS === 'web') {
        router.replace('/');
      } else {
        router.dismissAll();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitializing]);

  const currentSegment = segments[segments.length - 1];
  const pageTitle = PAGE_TITLES[currentSegment] ?? '로그인';

  return (
    <View className="flex-1">
      <View style={{ paddingTop: insets.top }} className="bg-white">
        <AppHeader title={pageTitle} />
      </View>
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
