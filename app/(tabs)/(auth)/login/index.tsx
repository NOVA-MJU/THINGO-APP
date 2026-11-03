import { googleLogin } from '@/api/auth';
import { getMemberInfo } from '@/api/members';
import { GoogleSignInButton, isGoogleSignInAvailable } from '@/components/google-sign-in-button';
import ThingoLogoLarge from '@/components/icons/thingo-logo-large';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/auth-context';
import { showAlert } from '@/lib/alert';
import { getApiErrorMessage } from '@/lib/api-error';
import { setPendingGoogleSignup } from '@/lib/google-signup-session';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmailLoginForm from './_components/email-login-form';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setUser } = useAuth();
  // 구글 클라이언트 ID가 없는 빌드는 구글 버튼이 숨겨지므로 이메일 로그인을 바로 보여 준다
  const [showEmailForm, setShowEmailForm] = useState(!isGoogleSignInAvailable);

  // 로그인을 마친 뒤 원래 보던 화면으로 돌아간다
  async function finishLogin() {
    const member = await getMemberInfo();
    setUser(member);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  // 구글 로그인: 기존 회원이면 바로 로그인, 처음 온 학교 계정이면 추가 정보 입력 화면으로 보낸다
  const googleLoginMutation = useMutation({
    mutationFn: async (idToken: string) => {
      const result = await googleLogin(idToken);
      if (result.type === 'loggedIn') {
        await finishLogin();
        return;
      }
      setPendingGoogleSignup(result.profile);
      router.push('/signup/google');
    },
    onError: (error) =>
      showAlert('구글 로그인 실패', getApiErrorMessage(error, '잠시 후 다시 시도해주세요')),
  });

  return (
    <ScrollView
      className="bg-white"
      contentContainerStyle={{ paddingTop: insets.top, flexGrow: 1 }}
    >
      <View className="w-full max-w-[400px] flex-1 justify-center self-center px-5 py-8">
        <ThingoLogoLarge width={100} height={38} />
        <Text className="mt-5 text-black text-heading02">학교 계정으로{'\n'}바로 시작하세요</Text>
        <Text className="mt-2 text-grey-60 text-body06">
          처음이면 가입으로, 이미 회원이면 로그인으로 이어져요.
        </Text>

        {isGoogleSignInAvailable && (
          <View className="mt-7">
            <GoogleSignInButton
              onIdToken={(idToken) => googleLoginMutation.mutate(idToken)}
              disabled={googleLoginMutation.isPending}
            />
            <Text className="mt-2 text-center text-grey-40 text-caption02">
              {googleLoginMutation.isPending
                ? '구글 계정을 확인하고 있어요...'
                : '명지대 구글 계정(@mju.ac.kr)만 이용할 수 있어요'}
            </Text>
            <TouchableOpacity
              className="mt-2 h-10 items-center justify-center"
              onPress={() => setShowEmailForm((shown) => !shown)}
            >
              <Text className="text-grey-40 underline text-caption02">
                {showEmailForm ? '이메일 로그인 닫기' : '이메일 계정으로 로그인'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {showEmailForm && <EmailLoginForm onLoggedIn={finishLogin} />}
      </View>
    </ScrollView>
  );
}
