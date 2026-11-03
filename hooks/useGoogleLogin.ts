import { googleLogin } from '@/api/auth';
import { getMemberInfo } from '@/api/members';
import { useAuth } from '@/context/auth-context';
import { showAlert } from '@/lib/alert';
import { getApiErrorMessage } from '@/lib/api-error';
import { setPendingGoogleSignup } from '@/lib/google-signup-session';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

type UseGoogleLoginOptions = {
  onLoggedIn?: () => void;
  onSignupStart?: () => void;
};

// 구글 ID 토큰으로 로그인한다. 기존 회원이면 바로 로그인, 처음 온 학교 계정이면 추가 정보 입력 화면으로 보낸다.
// 로그인 화면, 마이페이지, 로그인 시트가 같은 흐름을 쓰고 끝난 뒤 할 일만 호출하는 쪽이 정한다
export function useGoogleLogin({ onLoggedIn, onSignupStart }: UseGoogleLoginOptions = {}) {
  const router = useRouter();
  const { setUser } = useAuth();

  return useMutation({
    mutationFn: async (idToken: string) => {
      const result = await googleLogin(idToken);
      if (result.type === 'loggedIn') {
        setUser(await getMemberInfo());
        onLoggedIn?.();
        return;
      }
      setPendingGoogleSignup(result.profile);
      onSignupStart?.();
      router.push('/signup/google');
    },
    onError: (error) =>
      showAlert('구글 로그인 실패', getApiErrorMessage(error, '잠시 후 다시 시도해주세요')),
  });
}
