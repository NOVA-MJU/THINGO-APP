import { useAuth } from '@/context/auth-context';
import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';

export default function AuthLayout() {
  // auth-context에서 사용자 정보와 초기화 상태를 가져옴
  const { user, isInitializing } = useAuth();

  // 이미 로그인한 사용자가 로그인/회원가입 페이지에 접근할 경우 홈으로 리다이렉트
  if (!isInitializing && user) {
    return <Redirect href="/" />;
  }

  return (
    <View className="flex-1">
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
