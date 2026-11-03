import { GoogleSignInButton, isGoogleSignInAvailable } from '@/components/google-sign-in-button';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useGoogleLogin } from '@/hooks/useGoogleLogin';
import { Pressable, Modal as RNModal, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type LoginRequiredModalProps = {
  visible: boolean;
  onCancel: () => void;
  onLogin: () => void;
};

// 로그인이 필요한 동작을 눌렀을 때 아래에서 올라오는 시트. 보던 화면을 떠나지 않고 구글 로그인까지 끝낸다
export function LoginRequiredModal({ visible, onCancel, onLogin }: LoginRequiredModalProps) {
  const insets = useSafeAreaInsets();
  const googleLoginMutation = useGoogleLogin({ onLoggedIn: onCancel, onSignupStart: onCancel });

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="로그인 시트 닫기"
          className="absolute inset-0 bg-black/40"
          onPress={onCancel}
        />
        <View
          className="w-full max-w-[480px] self-center rounded-t-[20px] bg-white px-5 pt-3"
          style={{ paddingBottom: insets.bottom + 20 }}
        >
          <View className="mb-[18px] h-1 w-9 self-center rounded-full bg-grey-10" />
          <Text className="text-black text-title03">학교 계정으로 로그인</Text>
          <Text className="mt-1 text-grey-60 text-body06">
            처음이면 가입으로, 이미 회원이면 로그인으로 이어져요
          </Text>

          {isGoogleSignInAvailable ? (
            <View className="mt-5">
              <GoogleSignInButton
                onIdToken={(idToken) => googleLoginMutation.mutate(idToken)}
                disabled={googleLoginMutation.isPending}
              />
              <Text className="mt-2 text-center text-grey-40 text-caption02">
                {googleLoginMutation.isPending
                  ? '구글 계정을 확인하고 있어요...'
                  : '명지대 구글 계정(@mju.ac.kr)만 이용할 수 있어요'}
              </Text>
              <TouchableOpacity className="mt-1 h-10 items-center justify-center" onPress={onLogin}>
                <Text className="text-grey-40 underline text-caption02">
                  이메일 계정으로 로그인
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Button className="mt-5 h-[50px] rounded-xl" onPress={onLogin}>
              <Text>로그인</Text>
            </Button>
          )}
        </View>
      </View>
    </RNModal>
  );
}
