import {
  verifyRecoveryEmail,
  sendEmailVerificationCode,
  verifyRecoveryCode,
  resetPassword,
} from '@/api/members';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { showAlert } from '@/lib/alert';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [email, setEmail] = React.useState('');
  const [isRequesting, setIsRequesting] = React.useState(false);
  const [codeSent, setCodeSent] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [codeVerified, setCodeVerified] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  // 인증번호 전송 요청
  async function handleRequestCode() {
    if (!email) {
      showAlert('이메일을 입력해주세요.');
      return;
    }
    setIsRequesting(true);
    try {
      await verifyRecoveryEmail(email);
      await sendEmailVerificationCode(email);
      setCodeSent(true);
      showAlert('인증번호 전송', '입력하신 이메일로 인증번호를 발송했습니다.');
    } catch {
      showAlert('이메일 확인 실패', '가입된 이메일이 아니거나 형식이 잘못되었습니다.');
    } finally {
      setIsRequesting(false);
    }
  }

  // 인증번호 확인
  async function handleSubmitCode() {
    try {
      await verifyRecoveryCode(email, code);
      setCodeVerified(true);
    } catch {
      showAlert('인증 실패', '인증번호가 올바르지 않거나 만료되었습니다.');
    }
  }

  // 비밀번호 재설정 화면으로 이동
  function handleNextStep() {
    setStep(1);
  }

  // 아이디 찾기 버튼
  function onFindIdPress() {
    showAlert('아이디 찾기', '아이디는 학교 이메일(@mju.ac.kr)입니다.');
  }

  // 비밀번호 변경하기
  async function requestPasswordReset() {
    if (newPassword !== confirmPassword)
      return showAlert('비밀번호 불일치', '비밀번호가 일치하지 않습니다.');
    try {
      await resetPassword(email, newPassword);
      showAlert('완료', '비밀번호가 재설정되었습니다.', () => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(auth)/login');
        }
      });
    } catch {
      showAlert('오류', '비밀번호 재설정에 실패했습니다.');
    }
  }

  return (
    <ScrollView className="bg-grey-02" contentContainerClassName="flex-grow">
      <View className="flex-1">
        {step === 0 && (
          <View className="px-4">
            <Text className="mt-[30px] text-title01 text-black">비밀번호 재설정</Text>
            <View className="mt-3 rounded-xl bg-white p-6">
              <Text className="text-body04 text-grey-80">이메일</Text>
              <View className="mt-2 flex-row gap-2.5">
                <Input
                  placeholder="이메일을 입력하세요(@mju.ac.kr)"
                  className="flex-1"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!codeSent}
                />
                <Button
                  variant={email && !codeSent ? 'default' : 'subtle'}
                  disabled={!email || isRequesting || codeSent}
                  onPress={handleRequestCode}
                >
                  <Text>인증요청</Text>
                </Button>
              </View>
              <Text className="mt-5 text-body04 text-grey-80">인증번호</Text>
              <View className="mt-2 flex-row gap-2.5">
                <Input
                  placeholder="인증번호를 입력하세요"
                  className="flex-1"
                  editable={codeSent && !codeVerified}
                  value={code}
                  onChangeText={setCode}
                />
                <Button
                  variant={codeSent && code && !codeVerified ? 'default' : 'subtle'}
                  disabled={!codeSent || !code || codeVerified}
                  onPress={handleSubmitCode}
                >
                  <Text>인증확인</Text>
                </Button>
              </View>
              <Button
                className="mt-6"
                variant={codeVerified ? 'default' : 'subtle'}
                disabled={!codeVerified}
                onPress={handleNextStep}
              >
                <Text>비밀번호 재설정</Text>
              </Button>
              <View className="mt-6 flex-row items-center">
                <TouchableOpacity className="flex-1" onPress={onFindIdPress}>
                  <View className="h-10 items-center justify-center">
                    <Text className="text-caption02 text-grey-20">아이디 찾기</Text>
                  </View>
                </TouchableOpacity>
                <View className="h-4 w-[1px] bg-grey-20" />
                <TouchableOpacity className="flex-1">
                  <View className="h-10 items-center justify-center">
                    <Text className="text-caption02 text-grey-20">비밀번호 찾기</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {step === 1 && (
          <View className="px-4">
            <Text className="mt-[30px] text-title01 text-black">비밀번호 재설정</Text>
            <View className="mt-3 rounded-xl bg-white p-6">
              <Text className="text-body04 text-grey-80">새 비밀번호</Text>
              <Input
                placeholder="새 비밀번호를 입력하세요"
                className="mt-2"
                secureTextEntry
                textContentType="newPassword"
                autoComplete="new-password"
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <Text className="mt-5 text-body04 text-grey-80">새 비밀번호 확인</Text>
              <Input
                placeholder="비밀번호를 다시 입력하세요"
                className="mt-2"
                secureTextEntry
                textContentType="newPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <Button
                className="mt-7"
                variant={newPassword && confirmPassword ? 'default' : 'subtle'}
                disabled={!newPassword || !confirmPassword}
                onPress={requestPasswordReset}
              >
                <Text>비밀번호 변경</Text>
              </Button>
            </View>
          </View>
        )}
      </View>
      <Footer withBottomInset />
    </ScrollView>
  );
}
