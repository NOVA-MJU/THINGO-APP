import {
  checkEmailVerificationCode,
  getMemberInfo,
  sendEmailVerificationCode,
  signup,
  validateEmail,
} from '@/api/members';
import { Footer } from '@/components/footer';
import { PASSWORD_MESSAGE, PASSWORD_REGEX } from '@/lib/validation';
import { InfoCircleIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/auth-context';
import { isAxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { showAlert } from '@/lib/alert';
import { useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { AppHeader } from '@/components/app-header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MemberProfileFields, { type MemberProfile } from './_components/member-profile-fields';
import ProfileImageField from './_components/profile-image-field';
import TermsAgreement from './_components/terms-agreement';

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setUser } = useAuth();

  const [userEmail, setUserEmail] = useState('');
  const [emailVerificationLoading, setEmailVerificationLoading] = useState(false);
  const [verificationCodeSent, setVerificationCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationCodeLoading, setVerificationCodeLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [signupLoading, setSignupLoading] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [allAgreed, setAllAgreed] = useState(false);

  const isFormComplete =
    emailVerified && !!password && !!confirmPassword && !!name.trim() && !!profile && allAgreed;

  // 이메일 인증코드 확인
  const handleVerificationCodeCheck = async () => {
    if (!verificationCode.trim()) return;
    setVerificationCodeLoading(true);
    try {
      const matched = await checkEmailVerificationCode(`${userEmail}@mju.ac.kr`, verificationCode);
      if (matched) {
        setEmailVerified(true);
        showAlert('이메일 인증이 완료되었습니다.');
      } else {
        showAlert('인증코드가 올바르지 않습니다.');
      }
    } catch (e) {
      if (isAxiosError(e) && e.response?.data?.message) {
        showAlert(e.response.data.message);
      } else {
        showAlert('인증코드 확인 중 오류가 발생했습니다.');
      }
    } finally {
      setVerificationCodeLoading(false);
    }
  };

  // 회원가입
  const handleSignup = async () => {
    if (!emailVerified) return showAlert('이메일 인증을 완료해주세요.');
    if (!password) return showAlert('비밀번호를 입력해주세요.');
    if (!PASSWORD_REGEX.test(password)) return showAlert(PASSWORD_MESSAGE);
    if (password !== confirmPassword) return showAlert('비밀번호가 일치하지 않습니다.');
    if (!name.trim()) return showAlert('이름을 입력해주세요.');
    if (!profile) return showAlert('닉네임·학번 중복 확인과 단과대·학과 선택을 마쳐주세요.');
    if (!allAgreed) return showAlert('필수 약관에 모두 동의해주세요.');

    setSignupLoading(true);
    try {
      await signup({
        name: name.trim(),
        email: `${userEmail}@mju.ac.kr`,
        password,
        ...profile,
        profileImageUrl: profileImageUrl ?? undefined,
        privacyAgreed: allAgreed,
      });
      const member = await getMemberInfo();
      setUser(member);
      if (Platform.OS === 'web') {
        router.replace('/');
      } else {
        router.dismissAll();
      }
    } catch (e) {
      if (isAxiosError(e) && e.response?.data?.message) {
        showAlert(e.response.data.message);
      } else {
        showAlert('회원가입 중 오류가 발생했습니다.');
      }
    } finally {
      setSignupLoading(false);
    }
  };

  // 이메일 인증코드 요청
  const handleEmailVerification = async () => {
    if (!userEmail.trim()) {
      showAlert('이메일을 입력해주세요.');
      return;
    }
    setEmailVerificationLoading(true);
    try {
      const email = `${userEmail}@mju.ac.kr`;
      await validateEmail(email);
      await sendEmailVerificationCode(email);
      setVerificationCodeSent(true);
      setVerificationCode('');
    } catch (e) {
      if (isAxiosError(e) && e.response?.data?.message) {
        showAlert(e.response.data.message);
      } else {
        showAlert('이메일 검증 중 오류가 발생했습니다.');
      }
    } finally {
      setEmailVerificationLoading(false);
    }
  };

  return (
    <View className="flex-1">
      <View style={{ paddingTop: insets.top }} className="bg-white">
        <AppHeader title="회원가입" />
      </View>
      <ScrollView className="bg-grey-02" contentContainerClassName="flex-grow">
        <View className="flex-1 px-4">
          <View className="mt-5 flex-row gap-1">
            <Text className="text-black text-title03">계정 정보</Text>
            <Text className="text-error text-title03">*</Text>
          </View>
          <View className="mt-2 gap-4 rounded-xl bg-white p-4">
            <View>
              {/* 이메일 */}
              <Text className="text-grey-80 text-body04">이메일</Text>
              <View className="mt-2 flex-row items-center gap-2.5">
                <Input
                  placeholder="이메일을 입력하세요"
                  className="flex-1"
                  value={userEmail}
                  onChangeText={setUserEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  keyboardType="email-address"
                  textContentType="username"
                  editable={!emailVerified}
                />
                <Text className="text-grey-30 text-body06">@mju.ac.kr</Text>
                <Button
                  variant={userEmail.trim() ? 'default' : 'subtle'}
                  className="rounded-md"
                  onPress={handleEmailVerification}
                  disabled={emailVerificationLoading || emailVerified}
                >
                  <Text>{emailVerificationLoading ? '요청 중...' : '인증요청'}</Text>
                </Button>
              </View>

              {/* 인증코드 */}
              {verificationCodeSent && (
                <View className="mt-2 flex-row items-center gap-2.5">
                  <Input
                    placeholder="인증코드를 입력하세요"
                    className="flex-1"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="default"
                    editable={!emailVerified}
                  />
                  <Button
                    variant={verificationCode.trim() ? 'default' : 'subtle'}
                    onPress={handleVerificationCodeCheck}
                    disabled={verificationCodeLoading || emailVerified}
                  >
                    <Text>
                      {verificationCodeLoading ? '확인 중...' : emailVerified ? '인증완료' : '확인'}
                    </Text>
                  </Button>
                </View>
              )}
            </View>

            <View>
              {/* 비밀번호 */}
              <Text className="text-grey-80 text-body04">비밀번호</Text>
              <Input
                placeholder="비밀번호를 입력하세요"
                className="mt-2"
                secureTextEntry
                textContentType="newPassword"
                autoComplete="new-password"
                value={password}
                onChangeText={setPassword}
              />
              <View className="mt-2 flex-row items-center gap-1">
                <InfoCircleIcon size={16} className="text-grey-30" />
                <Text className="text-grey-30 text-caption02">
                  영문, 숫자, 특수문자 포함 8자 이상
                </Text>
              </View>
            </View>

            <View>
              {/* 비밀번호 확인 */}
              <Text className="text-grey-80 text-body04">비밀번호 확인</Text>
              <Input
                placeholder="비밀번호를 다시 입력하세요"
                className="mt-2"
                secureTextEntry
                textContentType="newPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          </View>

          <View className="mt-4 flex-row gap-1">
            <Text className="text-black text-title03">기본 정보</Text>
            <Text className="text-error text-title03">*</Text>
          </View>
          <View className="mt-2 gap-4 rounded-xl bg-white p-4">
            <View>
              {/* 이름 */}
              <Text className="text-grey-80 text-body04">이름</Text>
              <Input
                placeholder="홍길동 (실명)"
                className="mt-2"
                value={name}
                onChangeText={setName}
              />
              <Text className="mt-2 text-grey-30 text-caption02">
                ※ 실명을 입력하지 않을 경우 추후 불이익이 발생할 수 있습니다.
              </Text>
            </View>

            <MemberProfileFields onChange={setProfile} />
          </View>

          {/* 프로필 사진 */}
          <ProfileImageField value={profileImageUrl} onChange={setProfileImageUrl} />

          {/* 약관 동의 */}
          <TermsAgreement onChange={setAllAgreed} />

          {/* 회원가입 버튼 */}
          <Button
            variant={isFormComplete ? 'default' : 'secondary'}
            className="mt-4"
            onPress={handleSignup}
            disabled={signupLoading || !isFormComplete}
          >
            <Text>{signupLoading ? '가입 중...' : 'Thingo 시작하기'}</Text>
          </Button>
        </View>
        <Footer className="mt-16" />
      </ScrollView>
    </View>
  );
}
