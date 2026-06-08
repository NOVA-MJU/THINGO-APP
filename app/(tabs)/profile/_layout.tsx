import { useAuth } from '@/context/auth-context';
import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';

export default function ProfileLayout() {
  // auth-context에서 사용자 정보와 초기화 상태를 가져옴
  const { user, isInitializing } = useAuth();

  // 로그인하지 않은 사용자가 프로필 관련 페이지에 접근할 경우 로그인 페이지로 리다이렉트
  if (!isInitializing && !user) {
    return <Redirect href="/login" />;
  }

  return (
    <View className="flex-1">
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
