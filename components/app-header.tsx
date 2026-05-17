import { ArrowLeftIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const router = useRouter();

  return (
    <View className="h-[60px] flex-row items-center border-b border-grey-10 px-3 pt-1">
      <TouchableOpacity
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        hitSlop={8}
      >
        <ArrowLeftIcon size={24} className="text-black" />
      </TouchableOpacity>
      <Text className="flex-1 text-center text-body02 text-black">{title}</Text>
      {/* 오른쪽 여백 — 왼쪽 버튼 너비(24+2padding)와 대칭 */}
      <View className="w-[24px]" />
    </View>
  );
}
