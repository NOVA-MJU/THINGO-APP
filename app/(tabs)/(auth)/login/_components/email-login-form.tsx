import { login } from '@/api/auth';
import { isGoogleSignInAvailable } from '@/components/google-sign-in-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { showAlert } from '@/lib/alert';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';

type EmailLoginFormProps = {
  onLoggedIn: () => Promise<void>;
};

// 학생회 계정처럼 학교 구글 계정으로 들어올 수 없는 회원을 위한 이메일 로그인
export default function EmailLoginForm({ onLoggedIn }: EmailLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const passwordRef = useRef<TextInput>(null);

  const loginMutation = useMutation({
    mutationFn: async () => {
      await login({ email, password });
      await onLoggedIn();
    },
    onError: (e) => {
      setPassword('');
      if (isAxiosError(e) && e.response?.status === 401) {
        // 구글로 가입한 회원은 비밀번호가 없어 이메일 로그인이 항상 실패하므로 구글 로그인을 함께 안내한다
        showAlert(
          '로그인 실패',
          isGoogleSignInAvailable
            ? '아이디 또는 비밀번호가 일치하지 않습니다\n구글로 가입했다면 학교 Google 계정으로 로그인해주세요'
            : '아이디 또는 비밀번호가 일치하지 않습니다'
        );
      } else {
        showAlert('서버 오류', '잠시 후 다시 시도해주세요');
      }
    },
  });

  // 로그인 실행
  function handleLogin() {
    if (!email) return showAlert('이메일을 입력해주세요.');
    if (!password) return showAlert('비밀번호를 입력해주세요.');
    loginMutation.mutate();
  }

  // 아이디 찾기
  function onFindIdPress() {
    showAlert('아이디 찾기', '아이디는 학교 이메일(@mju.ac.kr)입니다.');
  }

  // 비밀번호 찾기
  function onFindPasswordPress() {
    router.push('/forgot-password');
  }

  return (
    <View className="mt-2">
      <Text className="text-grey-80 text-body04">이메일</Text>
      <Input
        className="mt-2"
        placeholder="@mju.ac.kr"
        value={email}
        onChangeText={setEmail}
        clearable
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        submitBehavior="submit"
      />
      <Text className="mt-4 text-grey-80 text-body04">비밀번호</Text>
      <Input
        ref={passwordRef}
        className="mt-2"
        placeholder="비밀번호를 입력하세요"
        value={password}
        onChangeText={setPassword}
        clearable
        secureTextEntry
        returnKeyType="done"
        onSubmitEditing={handleLogin}
      />
      <Button
        className="mt-5 h-[50px] rounded-xl"
        variant={email && password ? 'default' : 'secondary'}
        onPress={handleLogin}
        disabled={loginMutation.isPending}
      >
        <Text>{loginMutation.isPending ? '로그인 중...' : '로그인'}</Text>
      </Button>
      <Button
        className="mt-2 h-[50px] rounded-xl bg-white"
        variant="outline"
        onPress={() => router.push('/signup')}
      >
        <Text className="text-grey-80 text-body02">회원가입</Text>
      </Button>
      <View className="mt-2 flex-row items-center">
        <TouchableOpacity className="flex-1" onPress={onFindIdPress}>
          <View className="h-10 items-center justify-center">
            <Text className="text-grey-40 text-caption02">아이디 찾기</Text>
          </View>
        </TouchableOpacity>
        <View className="h-4 w-[1px] bg-grey-20" />
        <TouchableOpacity className="flex-1" onPress={onFindPasswordPress}>
          <View className="h-10 items-center justify-center">
            <Text className="text-grey-40 text-caption02">비밀번호 찾기</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
