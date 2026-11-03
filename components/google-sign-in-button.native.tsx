import { GoogleIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { showAlert } from '@/lib/alert';
import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import type { GoogleSignInButtonProps } from './google-sign-in-button';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

export const isGoogleSignInAvailable = !!WEB_CLIENT_ID;

// Android는 구글 Play 서비스의 상태 코드를 문자열로 넘긴다. 7은 네트워크 오류, 10은 앱 서명(SHA-1)·클라이언트 ID 설정 오류
const SIGN_IN_ERROR_MESSAGES: Record<string, string> = {
  [statusCodes.PLAY_SERVICES_NOT_AVAILABLE]: 'Google Play 서비스를 사용할 수 없는 기기입니다',
  '7': '인터넷 연결을 확인한 뒤 다시 시도해주세요',
  '10': '앱 설정 문제로 구글 로그인을 할 수 없어요. 이메일로 로그인하거나 앱을 업데이트해주세요',
};

// 서버는 ID 토큰의 대상(aud)이 웹 클라이언트 ID인지 확인하므로 앱도 webClientId로 토큰을 받는다.
// hostedDomain은 계정 선택 화면에서 학교 계정을 먼저 보여주는 힌트일 뿐이고, 실제 제한은 서버가 한다
if (WEB_CLIENT_ID) {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    hostedDomain: 'mju.ac.kr',
  });
}

export function GoogleSignInButton({ onIdToken, disabled }: GoogleSignInButtonProps) {
  if (!isGoogleSignInAvailable) return null;

  async function handlePress() {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // 이전에 고른 계정으로 바로 들어가지 않고, 학교 계정을 다시 고를 수 있게 매번 계정 선택 화면을 띄운다
      await GoogleSignin.signOut();
      const response = await GoogleSignin.signIn();
      if (isCancelledResponse(response)) return;
      if (!response.data.idToken) {
        showAlert('구글 로그인 실패', '잠시 후 다시 시도해주세요');
        return;
      }
      onIdToken(response.data.idToken);
    } catch (error) {
      if (!isErrorWithCode(error)) {
        showAlert('구글 로그인 실패', '잠시 후 다시 시도해주세요');
        return;
      }
      // 사용자가 직접 닫았거나 이미 진행 중이면 알릴 것이 없다
      if (error.code === statusCodes.IN_PROGRESS || error.code === statusCodes.SIGN_IN_CANCELLED)
        return;
      showAlert(
        '구글 로그인 실패',
        SIGN_IN_ERROR_MESSAGES[error.code] ?? '잠시 후 다시 시도해주세요'
      );
    }
  }

  return (
    <Button
      variant="outline"
      className="h-[50px] flex-row gap-2 rounded-xl bg-white"
      onPress={handlePress}
      disabled={disabled}
    >
      <GoogleIcon size={20} />
      <Text className="text-grey-80 text-body02">구글로 계속하기</Text>
    </Button>
  );
}
