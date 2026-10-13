import { getMapThemes, MAP_THEMES_QUERY_KEY, type MapTheme } from '@/api/maps';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { listItemEnter } from '@/lib/motion';
import { useQuery } from '@tanstack/react-query';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

// 카드 이미지는 4:1로 만들어 두었다 (오른쪽에 피사체, 왼쪽은 글자가 올라가는 자리)
const CARD_ASPECT_RATIO = 4;

// 검색 화면 하단의 테마지도. 기획이 바뀌지 않는 한 항상 같은 5개 테마를 보여준다
export default function ThemeMapList({ onPress }: { onPress: (theme: MapTheme) => void }) {
  const {
    data: themes,
    isPending,
    isError,
  } = useQuery({
    queryKey: MAP_THEMES_QUERY_KEY,
    queryFn: getMapThemes,
    staleTime: 60 * 60 * 1000,
  });

  // 테마는 부가 콘텐츠라 불러오지 못하면 영역 자체를 숨긴다 (최근 검색어·검색은 그대로 쓸 수 있게)
  if (isError) return null;

  return (
    <View className="mt-8 gap-3 px-4">
      <Text className="text-black text-body02">테마지도</Text>
      {isPending
        ? Array.from({ length: 5 }).map((_, index) => (
            <Skeleton
              key={index}
              className="w-full rounded-xl"
              style={{ aspectRatio: CARD_ASPECT_RATIO }}
            />
          ))
        : themes.map((theme, index) => (
            <Animated.View key={theme.id} entering={listItemEnter(index)}>
              <ThemeCard theme={theme} onPress={() => onPress(theme)} />
            </Animated.View>
          ))}
    </View>
  );
}

function ThemeCard({ theme, onPress }: { theme: MapTheme; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="w-full overflow-hidden rounded-xl bg-grey-80"
      style={{ aspectRatio: CARD_ASPECT_RATIO }}
    >
      <Image
        source={{ uri: theme.imageUrl }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      {/* 왼쪽 글자가 사진 위에서도 읽히도록 왼쪽에서 오른쪽으로 옅어지는 어두운 그라데이션을 깐다 */}
      <Svg
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id={`theme-shade-${theme.id}`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#111418" stopOpacity="0.92" />
            <Stop offset="0.5" stopColor="#111418" stopOpacity="0.55" />
            <Stop offset="1" stopColor="#111418" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect width="100" height="100" fill={`url(#theme-shade-${theme.id})`} />
      </Svg>
      <View className="flex-1 justify-center gap-1 px-5">
        <Text className="text-white text-title03" numberOfLines={1}>
          {theme.title}
        </Text>
        <Text className="text-white/80 text-caption02" numberOfLines={1}>
          {theme.subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
