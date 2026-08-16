import { ArrowLeftIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { TouchableOpacity, View } from 'react-native';

interface AppHeaderProps {
  title: string;
  right?: ReactNode;
}

export function AppHeader({ title, right }: AppHeaderProps) {
  const router = useRouter();

  return (
    <View className="h-[60px] flex-row items-center justify-between border-b border-grey-10 px-3 pt-1">
      <TouchableOpacity
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        hitSlop={8}
      >
        <ArrowLeftIcon size={24} className="text-grey-40" />
      </TouchableOpacity>
      {/* 제목은 좌우 콘텐츠 너비에 영향받지 않도록 absolute로 헤더 정중앙에 고정 배치한다 */}
      <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
        <Text className="text-body02 text-black" numberOfLines={1}>
          {title}
        </Text>
      </View>
      {/* 오른쪽 여백 — 왼쪽 버튼 너비(24+2padding)와 대칭. right가 주어지면 대신 렌더링 */}
      {right ? (
        <View className="mr-1 flex-row items-center justify-center">{right}</View>
      ) : (
        <View className="w-[24px]" />
      )}
    </View>
  );
}
