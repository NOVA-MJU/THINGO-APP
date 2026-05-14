import { HamburgerIcon, ThingoLogoLarge } from '@/components/icons';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AuthLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View className="flex-1">
      <View style={{ paddingTop: insets.top }} className="bg-white">
        <View className="h-[60px] flex-row items-center justify-between border-b border-grey-10 pe-4 ps-5">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          >
            <ThingoLogoLarge />
          </TouchableOpacity>
          <TouchableOpacity>
            <HamburgerIcon size={24} className="text-black" />
          </TouchableOpacity>
        </View>
      </View>
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
