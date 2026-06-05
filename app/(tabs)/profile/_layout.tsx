import { AppHeader } from '@/components/app-header';
import { useAuth } from '@/context/auth-context';
import { Redirect, Stack, useSegments } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PAGE_TITLES: Record<string, string> = {
  profile: '프로필',
  edit: '프로필 수정',
  posts: '내가 작성한 게시물',
  'liked-posts': '찜한 글',
  comments: '내가 작성한 댓글',
  'delete-account': '회원 탈퇴',
};

export default function ProfileLayout() {
  const insets = useSafeAreaInsets();
  const segments = useSegments();

  /**
   * auth-context에서 사용자 정보와 초기화 상태를 가져옴
   */
  const { user, isInitializing } = useAuth();

  /**
   * 로그인하지 않은 사용자가 프로필 관련 페이지에 접근할 경우 로그인 페이지로 리다이렉트
   */
  if (!isInitializing && !user) {
    return <Redirect href="/login" />;
  }

  const currentSegment = segments[segments.length - 1];
  const pageTitle = PAGE_TITLES[currentSegment] ?? '프로필';

  return (
    <View className="flex-1">
      <View style={{ paddingTop: insets.top }} className="bg-white">
        <AppHeader title={pageTitle} />
      </View>
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
