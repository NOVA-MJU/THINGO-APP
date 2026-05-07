import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import { ScrollView, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <ScrollView className="bg-grey-02" contentContainerClassName="flex-grow">
      {/* 로그인 영역 */}
      <View className="flex-1 gap-3 px-4 py-8">
        <Text className="text-title01 text-black">로그인</Text>
        <View className="rounded-xl bg-white p-6">
          <Text className="text-body04 text-black">이메일</Text>
          <Input className="mt-2" placeholder="@mju.ac.kr" />
          <Text className="mt-5 text-body04 text-black">비밀번호</Text>
          <Input className="mt-2" placeholder="비밀번호를 입력하세요" />
          <Button className="mt-7" variant="secondary">
            <Text>로그인</Text>
          </Button>
          <Button className="mt-2" variant="muted" onPress={() => router.push('/signup')}>
            <Text>회원가입</Text>
          </Button>
          <View className="mt-6 flex-row items-center">
            <TouchableOpacity className="flex-1">
              <View className="h-10 items-center justify-center">
                <Text className="text-caption02 text-grey-20">아이디 찾기</Text>
              </View>
            </TouchableOpacity>
            <View className="h-4 w-[1px] bg-grey-20" />
            <TouchableOpacity className="flex-1" onPress={() => router.push('/forgot-password')}>
              <View className="h-10 items-center justify-center">
                <Text className="text-caption02 text-grey-20">비밀번호 찾기</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 푸터 */}
      <Footer withBottomInset />
    </ScrollView>
  );
}
