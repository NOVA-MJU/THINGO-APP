import { getBroadcasts, type BroadcastItem, type BroadcastSource } from '@/api/broadcast';
import { Footer } from '@/components/footer';
import { CategoryFilter } from '@/components/ui/category-filter';
import { Pagination } from '@/components/ui/pagination';
import { Text } from '@/components/ui/text';
import { YoutubeEmbed } from '@/components/youtube-embed';
import { openLink } from '@/lib/open-link';
import { formatTimeAgo } from '@/lib/utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';

const BROADCAST_SOURCE_MAP: Record<string, BroadcastSource> = {
  전체: 'ALL',
  명지대학교: 'OFFICIAL',
  명대방송국: 'BROADCAST',
};

export default function NewsScreen() {
  const router = useRouter();
  const { source, page } = useLocalSearchParams<{ source?: string; page?: string }>();
  const selectedSource = source && source in BROADCAST_SOURCE_MAP ? source : '전체';
  const currentPage = Number(page ?? '1');

  const scrollRef = React.useRef<ScrollView>(null);
  const [broadcasts, setBroadcasts] = React.useState<BroadcastItem[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    getBroadcasts({
      source: BROADCAST_SOURCE_MAP[selectedSource],
      page: currentPage - 1,
      size: 5,
    })
      .then((res) => {
        setBroadcasts(res.content);
        setTotalPages(res.totalPages);
      })
      .catch(() => {
        setBroadcasts([]);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));
  }, [selectedSource, currentPage]);

  function handleSourceSelect(nextSource: string) {
    router.setParams({ source: nextSource, page: '1' });
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function handlePageChange(p: number) {
    router.setParams({ page: String(p) });
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  return (
    <ScrollView
      ref={scrollRef}
      className="native:w-screen flex-1 bg-grey-02 web:w-full"
      contentContainerClassName="flex-grow"
    >
      <View className="pt-4">
        <CategoryFilter
          categories={Object.keys(BROADCAST_SOURCE_MAP)}
          selected={selectedSource}
          onSelect={handleSourceSelect}
        />
      </View>
      <View className="relative flex-1 gap-4 p-5">
        {broadcasts.map((item, index) => {
          const videoId = new URL(item.url).searchParams.get('v') ?? '';
          return (
            <View key={index}>
              <View className="flex-5 overflow-hidden rounded-t-xl">
                <YoutubeEmbed videoId={videoId} height={192} />
              </View>
              <TouchableOpacity onPress={() => openLink(item.url)}>
                <View className="flex-2 gap-0.5 rounded-b-xl bg-white px-4 py-2">
                  <View style={{ minHeight: 48 }}>
                    <Text className="text-black text-body02" numberOfLines={2}>
                      {item.title}
                    </Text>
                  </View>
                  <Text className="text-grey-30 text-caption04" numberOfLines={1}>
                    {formatTimeAgo(item.publishedAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
        {loading && (
          <View className="absolute inset-0 items-center justify-center">
            <ActivityIndicator />
          </View>
        )}
      </View>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        className="pb-9 pt-1"
      />
      <Footer />
    </ScrollView>
  );
}
