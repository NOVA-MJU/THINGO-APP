import { getBroadcasts, type BroadcastItem } from '@/api/broadcast';
import { Footer } from '@/components/footer';
import { Pagination } from '@/components/ui/pagination';
import { Text } from '@/components/ui/text';
import { YoutubeEmbed } from '@/components/youtube-embed';
import { formatTimeAgo } from '@/lib/utils';
import { Link } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';

export default function NewsScreen() {
  const scrollRef = React.useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [broadcasts, setBroadcasts] = React.useState<BroadcastItem[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    getBroadcasts({ page: currentPage - 1, size: 5 })
      .then((res) => {
        setBroadcasts(res.content);
        setTotalPages(res.totalPages);
      })
      .catch(() => setBroadcasts([]))
      .finally(() => setLoading(false));
  }, [currentPage]);

  function handlePageChange(page: number) {
    setCurrentPage(page);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  return (
    <ScrollView
      ref={scrollRef}
      className="w-screen flex-1 bg-grey-02"
      contentContainerClassName="flex-grow"
    >
      <View className="relative flex-1 gap-4 p-5">
        {broadcasts.map((item, index) => {
          const videoId = new URL(item.url).searchParams.get('v') ?? '';
          return (
            <View key={index}>
              <View className="flex-5 overflow-hidden rounded-t-xl">
                <YoutubeEmbed videoId={videoId} height={192} />
              </View>
              <Link href={item.url as `https://${string}`} asChild>
                <TouchableOpacity>
                  <View className="flex-2 gap-0.5 rounded-b-xl bg-white px-4 py-2">
                    <View style={{ minHeight: 48 }}>
                      <Text className="text-body02 text-black" numberOfLines={2}>
                        {item.title}
                      </Text>
                    </View>
                    <Text className="text-caption04 text-grey-30" numberOfLines={1}>
                      {formatTimeAgo(item.publishedAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Link>
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
