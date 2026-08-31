import { ArrowRightIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PAGE_TITLE = '전체 카테고리 | 띵고 Thingo';
const PAGE_DESCRIPTION = '띵고의 모든 기능을 한눈에. 필요한 정보로 바로 이동해보세요!';

export default function CategoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <>
      {Platform.OS === 'web' && (
        <Head>
          <title>{PAGE_TITLE}</title>
          <meta name="description" content={PAGE_DESCRIPTION} />
          <meta property="og:title" content={PAGE_TITLE} />
          <meta property="og:description" content={PAGE_DESCRIPTION} />
        </Head>
      )}
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom, paddingTop: insets.top }}>
        <Text className="px-4 pb-2 pt-5 text-black text-title01">카테고리</Text>
        <Text className="px-5 py-2.5 text-blue-35 text-body02">Information</Text>
        <View>
          <TouchableOpacity
            className="flex-row items-center px-5 py-2.5 hover:bg-blue-05"
            onPress={() => router.navigate('/maps')}
          >
            <Text className="flex-1 text-black text-body05">명지도</Text>
            <ArrowRightIcon className="text-grey-20" size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-row items-center px-5 py-2.5 hover:bg-blue-05"
            onPress={() => router.navigate('/notices')}
          >
            <Text className="flex-1 text-black text-body05">공지사항</Text>
            <ArrowRightIcon className="text-grey-20" size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-row items-center px-5 py-2.5 hover:bg-blue-05"
            onPress={() => router.navigate('/academic-calendar')}
          >
            <Text className="flex-1 text-black text-body05">학사일정</Text>
            <ArrowRightIcon className="text-grey-20" size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-row items-center px-5 py-2.5 hover:bg-blue-05"
            onPress={() => router.navigate('/meal')}
          >
            <Text className="flex-1 text-black text-body05">학식</Text>
            <ArrowRightIcon className="text-grey-20" size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-row items-center px-5 py-2.5 hover:bg-blue-05"
            onPress={() => router.navigate('/newspaper')}
          >
            <Text className="flex-1 text-black text-body05">명대신문</Text>
            <ArrowRightIcon className="text-grey-20" size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-row items-center px-5 py-2.5 hover:bg-blue-05"
            onPress={() => router.navigate('/news')}
          >
            <Text className="flex-1 text-black text-body05">명대뉴스</Text>
            <ArrowRightIcon className="text-grey-20" size={20} />
          </TouchableOpacity>
        </View>
        <View className="my-2 h-[1px] bg-grey-02" />
        <Text className="px-5 py-2.5 text-blue-35 text-body02">Community</Text>
        <View>
          <TouchableOpacity
            className="flex-row items-center px-5 py-2.5 hover:bg-blue-05"
            onPress={() =>
              router.navigate({ pathname: '/posts', params: { boardCategory: 'info' } })
            }
          >
            <Text className="flex-1 text-black text-body05">정보게시판</Text>
            <ArrowRightIcon className="text-grey-20" size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-row items-center px-5 py-2.5 hover:bg-blue-05"
            onPress={() =>
              router.navigate({ pathname: '/posts', params: { boardCategory: 'free' } })
            }
          >
            <Text className="flex-1 text-black text-body05">자유게시판</Text>
            <ArrowRightIcon className="text-grey-20" size={20} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}
