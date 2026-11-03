import { googleSignup } from '@/api/auth';
import { getMemberInfo } from '@/api/members';
import { AppHeader } from '@/components/app-header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/auth-context';
import { showAlert } from '@/lib/alert';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { getPendingGoogleSignup, setPendingGoogleSignup } from '@/lib/google-signup-session';
import { useMutation } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MemberProfileFields, { type MemberProfile } from './_components/member-profile-fields';
import ProfileImageField from './_components/profile-image-field';
import TermsAgreement from './_components/terms-agreement';

// 이 화면에서 고칠 수 없는 오류. 가입표가 만료됐거나 다른 곳에서 이미 가입을 마쳤으면 구글 로그인부터 다시 해야 한다
const RESTART_LOGIN_MESSAGES: Record<string, string> = {
  GOOGLE_SIGNUP_EXPIRED: '가입 가능 시간(30분)이 지났어요. 구글 로그인을 다시 해주세요.',
  DUPLICATE_EMAIL_EXCEPTION:
    '이미 가입된 학교 계정이에요. 구글 로그인을 다시 하면 바로 들어갈 수 있어요.',
};

// 처음 온 학교 구글 계정의 추가 정보 입력 화면. 이메일과 이름은 구글 계정에서 가져오므로 고칠 수 없다
export default function GoogleSignupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setUser } = useAuth();
  // 새로고침 등으로 로그인 화면을 거치지 않고 들어오면 가입 정보가 없으므로 로그인부터 다시 한다
  const [pending] = useState(getPendingGoogleSignup);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(
    pending?.profileImageUrl ?? null
  );
  const [allAgreed, setAllAgreed] = useState(false);

  const signupMutation = useMutation({
    mutationFn: async () => {
      if (!pending || !profile) return;
      await googleSignup({
        signupToken: pending.signupToken,
        ...profile,
        profileImageUrl: profileImageUrl ?? undefined,
        privacyAgreed: allAgreed,
      });
      const member = await getMemberInfo();
      setPendingGoogleSignup(null);
      setUser(member);
      if (Platform.OS === 'web') {
        router.replace('/');
      } else {
        router.dismissAll();
      }
    },
    onError: (error) => {
      const restartMessage = RESTART_LOGIN_MESSAGES[getApiErrorCode(error) ?? ''];
      if (!restartMessage) {
        showAlert('회원가입 실패', getApiErrorMessage(error, '회원가입 중 오류가 발생했습니다.'));
        return;
      }
      showAlert('다시 로그인해주세요', restartMessage);
      setPendingGoogleSignup(null);
      router.replace('/login');
    },
  });

  if (!pending) return <Redirect href="/login" />;

  const isFormComplete = !!profile && allAgreed;

  return (
    <View className="flex-1">
      <View style={{ paddingTop: insets.top }} className="bg-white">
        <AppHeader title="회원가입" />
      </View>
      <ScrollView className="bg-grey-02" contentContainerClassName="flex-grow">
        <View className="flex-1 px-4">
          <View className="mt-5 flex-row gap-1">
            <Text className="text-black text-title03">기본 정보</Text>
            <Text className="text-error text-title03">*</Text>
          </View>
          <View className="mt-2 gap-4 rounded-xl bg-white p-4">
            <View>
              <Text className="text-grey-80 text-body04">학교 계정</Text>
              <Input className="mt-2" value={pending.email} editable={false} />
            </View>
            <View>
              <Text className="text-grey-80 text-body04">이름</Text>
              <Input className="mt-2" value={pending.name} editable={false} />
            </View>

            {pending.departmentName && (
              <Text className="text-grey-40 text-caption02">
                학교 계정 정보로 단과대와 학과를 골라 두었어요. 다르면 바꿔주세요.
              </Text>
            )}
            <MemberProfileFields
              onChange={setProfile}
              initialCollege={pending.college}
              initialDepartment={pending.departmentName}
            />
          </View>

          <ProfileImageField value={profileImageUrl} onChange={setProfileImageUrl} />

          <TermsAgreement onChange={setAllAgreed} />

          <Button
            variant={isFormComplete ? 'default' : 'secondary'}
            className="mt-4"
            onPress={() => signupMutation.mutate()}
            disabled={signupMutation.isPending || !isFormComplete}
          >
            <Text>{signupMutation.isPending ? '가입 중...' : 'Thingo 시작하기'}</Text>
          </Button>
        </View>
        <Footer className="mt-16" />
      </ScrollView>
    </View>
  );
}
