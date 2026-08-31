import { AppHeader } from '@/components/app-header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { deleteAccount } from '@/api/members';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'expo-router';
import { showAlert } from '@/lib/alert';
import { useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ai로 작성된 페이지임
export default function DeleteAccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();
  const [password, setPassword] = useState('');
  const [isPending, setIsPending] = useState(false);

  const handleDeleteAccount = async () => {
    if (!password) return;
    setIsPending(true);
    try {
      await deleteAccount(password);
      await logout();
      if (Platform.OS === 'web') {
        router.replace('/');
      } else {
        router.dismissAll();
      }
    } catch {
      showAlert('탈퇴 실패', '비밀번호를 확인해주세요.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <View className="flex-1">
      <View style={{ paddingTop: insets.top }} className="bg-white">
        <AppHeader title="회원 탈퇴" />
      </View>
      <ScrollView className="bg-grey-02" contentContainerClassName="flex-grow">
        <View className="flex-1 gap-3 px-4 py-8">
          <Text className="text-black text-title01">회원 탈퇴</Text>
          <View className="rounded-xl bg-white p-6">
            <Text className="text-black text-body04">비밀번호 확인</Text>
            <Text className="mt-1 text-grey-40 text-caption02">
              탈퇴 시 모든 회원 정보가 삭제되며 복구할 수 없습니다. 정말 탈퇴하시겠습니까?
            </Text>
            <Input
              className="mt-4"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Button className="mt-6" variant="default" onPress={() => router.back()}>
              <Text>취소</Text>
            </Button>
            <Button
              className="mt-2"
              variant="subtle"
              onPress={handleDeleteAccount}
              disabled={!password || isPending}
            >
              <Text>{isPending ? '처리 중...' : '탈퇴하기'}</Text>
            </Button>
          </View>
        </View>
        <Footer />
      </ScrollView>
    </View>
  );
}
