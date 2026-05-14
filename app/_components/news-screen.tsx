import { Footer } from '@/components/footer';
import { Pagination } from '@/components/ui/pagination';
import { Text } from '@/components/ui/text';
import { YoutubeEmbed } from '@/components/youtube-embed';
import { Link } from 'expo-router';
import * as React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

export default function NewsScreen() {
  const [currentPage, setCurrentPage] = React.useState(1);

  return (
    <ScrollView className="w-screen flex-1 bg-grey-02" contentContainerClassName="flex-grow">
      <View className="flex-1 gap-4 p-5">
        {DUMMY_VIDEOS.map((item) => (
          <View key={item.id}>
            <View className="flex-5 overflow-hidden rounded-t-xl">
              <YoutubeEmbed videoId={item.videoId} height={192} />
            </View>
            <Link
              href={`https://www.youtube.com/watch?v=${item.videoId}` as `https://${string}`}
              asChild
            >
              <TouchableOpacity>
                <View className="flex-2 gap-0.5 rounded-b-xl bg-white px-4 py-2">
                  <View style={{ minHeight: 48 }}>
                    <Text className="text-body02 text-black" numberOfLines={2}>
                      {item.title}
                    </Text>
                  </View>
                  <Text className="text-caption04 text-grey-30" numberOfLines={1}>
                    {item.date}
                  </Text>
                </View>
              </TouchableOpacity>
            </Link>
          </View>
        ))}
      </View>

      <Pagination
        currentPage={currentPage}
        totalPages={8}
        onPageChange={setCurrentPage}
        className="mt-1 pb-9"
      />

      <Footer withBottomInset />
    </ScrollView>
  );
}

const DUMMY_VIDEOS = [
  {
    id: 1,
    videoId: 'dQw4w9WgXcQ',
    title: '2025 명지대학교 봄 축제 하이라이트',
    date: '2025.05.07',
  },
  {
    id: 2,
    videoId: 'L_jWHffIx5E',
    title: '명지대학교 캠퍼스 투어 | 인문캠퍼스 편',
    date: '2025.05.05',
  },
  { id: 3, videoId: '9bZkp7q19f0', title: '총학생회 2025 복지정책 발표 현장', date: '2025.05.03' },
  { id: 4, videoId: 'kJQP7kiw5Fk', title: '명지대 스타트업 경진대회 시상식', date: '2025.05.01' },
  {
    id: 5,
    videoId: 'JGwWNGJdvx8',
    title: '명지대학교 2025 입학식 현장 스케치',
    date: '2025.04.28',
  },
];
