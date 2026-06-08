import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { login } from '@/api/auth';
import { getMemberInfo } from '@/api/members';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'expo-router';
import { showAlert } from '@/lib/alert';
import { useRef, useState } from 'react';
import { ScrollView, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, setIsPending] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  // 로그인 실행
  async function handleLogin() {
    if (!email) return showAlert('이메일을 입력해주세요.');
    if (!password) return showAlert('비밀번호를 입력해주세요.');
    setIsPending(true);
    try {
      await login({ email, password });
      const member = await getMemberInfo();
      setUser(member);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    } catch {
      setPassword('');
      showAlert('로그인 실패', '이메일 또는 비밀번호를 확인해주세요.');
    } finally {
      setIsPending(false);
    }
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
    <ScrollView className="bg-grey-02" contentContainerClassName="flex-grow">
      {/* 로그인 영역 */}
      <View className="flex-1 gap-3 px-4 py-8">
        <Text className="text-title01 text-black">로그인</Text>
        <View className="rounded-xl bg-white p-6">
          <Text className="text-body04 text-black">이메일</Text>
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
          <Text className="mt-5 text-body04 text-black">비밀번호</Text>
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
            className="mt-7"
            variant={email && password ? 'default' : 'secondary'}
            onPress={handleLogin}
            disabled={isPending}
          >
            <Text>{isPending ? '로그인 중...' : '로그인'}</Text>
          </Button>
          <Button className="mt-2" variant="muted" onPress={() => router.push('/signup')}>
            <Text>회원가입</Text>
          </Button>
          <View className="mt-6 flex-row items-center">
            <TouchableOpacity className="flex-1" onPress={onFindIdPress}>
              <View className="h-10 items-center justify-center">
                <Text className="text-caption02 text-grey-20">아이디 찾기</Text>
              </View>
            </TouchableOpacity>
            <View className="h-4 w-[1px] bg-grey-20" />
            <TouchableOpacity className="flex-1" onPress={onFindPasswordPress}>
              <View className="h-10 items-center justify-center">
                <Text className="text-caption02 text-grey-20">비밀번호 찾기</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 푸터 */}
      <Footer />
    </ScrollView>
  );
}
