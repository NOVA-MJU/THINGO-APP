import { GoogleSignInButton, isGoogleSignInAvailable } from '@/components/google-sign-in-button';
import { ProfileIcon } from '@/components/icons/navigation';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useGoogleLogin } from '@/hooks/useGoogleLogin';
import { useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';

// 로그인하지 않았을 때 마이페이지 프로필 자리에 보여 주는 카드. 마이페이지를 떠나지 않고 구글 로그인을 끝낸다
export default function GuestProfileCard() {
  const router = useRouter();
  const googleLoginMutation = useGoogleLogin();

  // 구글 계정이 없는 회원(학생회 등)을 위한 이메일 로그인. 로그인 화면에서 이메일 로그인을 펼쳐 둔다
  function goToEmailLogin() {
    router.push({ pathname: '/login', params: isGoogleSignInAvailable ? { email: '1' } : {} });
  }

  return (
    <View className="mt-4 rounded-xl bg-white p-4">
      <View className="flex-row items-center gap-[14px]">
        <View className="size-14 items-center justify-center rounded-full border border-grey-10 bg-grey-02">
          <ProfileIcon size={34} className="text-grey-20" />
        </View>
        <View className="flex-1">
          <Text className="text-black text-body02">로그인이 필요해요</Text>
          <Text className="text-grey-60 text-body06">내 활동과 알림을 한 곳에서</Text>
        </View>
      </View>

      {isGoogleSignInAvailable ? (
        <View className="mt-4">
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
            className="mt-1 h-9 items-center justify-center"
            onPress={goToEmailLogin}
          >
            <Text className="text-grey-40 underline text-caption02">이메일 계정으로 로그인</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Button className="mt-4" onPress={goToEmailLogin}>
          <Text>로그인</Text>
        </Button>
      )}
    </View>
  );
}
