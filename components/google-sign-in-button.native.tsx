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
      if (isErrorWithCode(error) && error.code === statusCodes.IN_PROGRESS) return;
      if (isErrorWithCode(error) && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        showAlert('구글 로그인 실패', 'Google Play 서비스를 사용할 수 없는 기기입니다');
        return;
      }
      showAlert('구글 로그인 실패', '잠시 후 다시 시도해주세요');
    }
  }

  return (
    <Button
      variant="outline"
      className="flex-row gap-2 bg-white"
      onPress={handlePress}
      disabled={disabled}
    >
      <GoogleIcon size={18} />
      <Text className="text-grey-80">학교 Google 계정으로 계속하기</Text>
    </Button>
  );
}
