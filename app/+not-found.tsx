import { Stack, useRouter } from 'expo-router';
import { Platform, View } from 'react-native';
import { Text } from '@/components/ui/text';
import ThingoLogoLarge from '@/components/icons/thingo-logo-large';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';

export default function NotFoundScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View
        className="flex-1 items-center justify-center gap-8 bg-white px-8"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <ThingoLogoLarge width={100} height={38} />
        <Text className="text-[96px] font-bold leading-none tracking-tighter text-mju-primary">
          404
        </Text>
        <Text>죄송합니다. 현재 찾을 수 없는 페이지를 요청하셨습니다.</Text>
        <Button onPress={() => (Platform.OS === 'web' ? router.push('/') : router.dismissAll())}>
          <Text>홈으로 돌아가기</Text>
        </Button>
      </View>
    </>
  );
}
