import { getMapThemes, MAP_THEMES_QUERY_KEY, type MapTheme } from '@/api/maps';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useQuery } from '@tanstack/react-query';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { NativeViewGestureHandler } from 'react-native-gesture-handler';

// 명지도 첫 화면 시트 맨 위의 테마지도 바로가기 한 줄. 시트가 가장 낮게(10%) 내려가 있어도 보이고 바로 누를 수 있게
// 큰 카드 대신 사진 동그라미 + 이름 칩으로 가로로 넘긴다 (큰 카드 목록은 검색 화면에 있다)
export default function ThemeMapChips({ onPress }: { onPress: (theme: MapTheme) => void }) {
  const {
    data: themes,
    isPending,
    isError,
  } = useQuery({
    queryKey: MAP_THEMES_QUERY_KEY,
    queryFn: getMapThemes,
    staleTime: 60 * 60 * 1000,
  });

  // 부가 콘텐츠라 불러오지 못하면 줄 자체를 숨긴다 (아래 건물 목록은 그대로)
  if (isError) return null;

  return (
    <NativeViewGestureHandler disallowInterruption>
      <ScrollView
        horizontal
        nestedScrollEnabled
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
      >
        {isPending
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-32 rounded-full" />
            ))
          : themes.map((theme) => (
              <TouchableOpacity
                key={theme.id}
                accessibilityRole="button"
                accessibilityLabel={`테마지도 ${theme.title}, 장소 ${theme.placeCount}곳`}
                activeOpacity={0.75}
                onPress={() => onPress(theme)}
                className="h-10 flex-row items-center gap-1.5 rounded-full border border-grey-10 bg-white pl-1 pr-3"
              >
                <Image
                  source={{ uri: theme.imageUrl }}
                  className="h-8 w-8 rounded-full bg-grey-10"
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
                <Text className="text-black text-caption01" numberOfLines={1}>
                  {theme.title}
                </Text>
                <View className="rounded-full bg-blue-05 px-1.5">
                  <Text className="text-blue-35 text-caption03">{theme.placeCount}</Text>
                </View>
              </TouchableOpacity>
            ))}
      </ScrollView>
    </NativeViewGestureHandler>
  );
}
