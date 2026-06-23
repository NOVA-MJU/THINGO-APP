import { ArrowRightIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CategoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom, paddingTop: insets.top }}>
      <Text className="px-4 pb-2 pt-5 text-title01 text-black">카테고리</Text>
      <Text className="px-5 py-2.5 text-body02 text-blue-35">Information</Text>
      <View>
        <TouchableOpacity
          className="flex-row items-center px-5 py-2.5 hover:bg-blue-05"
          onPress={() => router.navigate('/maps')}
        >
          <Text className="flex-1 text-body05 text-black">명지도</Text>
          <ArrowRightIcon className="text-grey-20" size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center px-5 py-2.5 hover:bg-blue-05"
          onPress={() => router.navigate('/notices')}
        >
          <Text className="flex-1 text-body05 text-black">공지사항</Text>
          <ArrowRightIcon className="text-grey-20" size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center px-5 py-2.5 hover:bg-blue-05"
          onPress={() => router.navigate('/academic-calendar')}
        >
          <Text className="flex-1 text-body05 text-black">학사일정</Text>
          <ArrowRightIcon className="text-grey-20" size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center px-5 py-2.5 hover:bg-blue-05"
          onPress={() => router.navigate('/meal')}
        >
          <Text className="flex-1 text-body05 text-black">학식</Text>
          <ArrowRightIcon className="text-grey-20" size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center px-5 py-2.5 hover:bg-blue-05"
          onPress={() => router.navigate('/newspaper')}
        >
          <Text className="flex-1 text-body05 text-black">명대신문</Text>
          <ArrowRightIcon className="text-grey-20" size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center px-5 py-2.5 hover:bg-blue-05"
          onPress={() => router.navigate('/news')}
        >
          <Text className="flex-1 text-body05 text-black">명대뉴스</Text>
          <ArrowRightIcon className="text-grey-20" size={20} />
        </TouchableOpacity>
      </View>
      <View className="my-2 h-[1px] bg-grey-02" />
      <Text className="px-5 py-2.5 text-body02 text-blue-35">Community</Text>
      <View>
        <TouchableOpacity
          className="flex-row items-center px-5 py-2.5 hover:bg-blue-05"
          onPress={() => router.navigate({ pathname: '/posts', params: { boardCategory: 'info' } })}
        >
          <Text className="flex-1 text-body05 text-black">정보게시판</Text>
          <ArrowRightIcon className="text-grey-20" size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center px-5 py-2.5 hover:bg-blue-05"
          onPress={() => router.navigate({ pathname: '/posts', params: { boardCategory: 'free' } })}
        >
          <Text className="flex-1 text-body05 text-black">자유게시판</Text>
          <ArrowRightIcon className="text-grey-20" size={20} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
