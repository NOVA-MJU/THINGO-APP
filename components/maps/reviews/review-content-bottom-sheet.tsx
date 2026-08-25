import { HeartIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { getPlaceReviewKeyword, type PlaceReview } from '@/lib/maps/place-reviews';
import { format, parseISO } from 'date-fns';
import * as React from 'react';
import { Animated, Image, PanResponder, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const KOREAN_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

type ReviewContentBottomSheetProps = {
  review: PlaceReview;
  visible: boolean;
  progress: Animated.Value;
  sheetHeight: number;
  nickname: string;
  profileImageUrl: string | null;
  onClose: () => void;
  onToggleLike: () => void;
};

export function ReviewContentBottomSheet({
  review,
  visible,
  progress,
  sheetHeight,
  nickname,
  profileImageUrl,
  onClose,
  onToggleLike,
}: ReviewContentBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const sheetPanResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          gestureState.dy > 8 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 56 || gestureState.vy > 0.8) {
            onClose();
          }
        },
      }),
    [onClose]
  );

  if (!visible) return null;

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetHeight, 0],
  });

  return (
    <Animated.View
      className="absolute bottom-0 left-0 right-0 z-40 overflow-hidden rounded-t-[20px] border-t border-grey-10 bg-white"
      style={[
        styles.contentSheet,
        {
          paddingBottom: Math.max(insets.bottom, 18),
          height: sheetHeight,
          transform: [{ translateY }],
        },
      ]}
    >
      <View className="h-7 items-center justify-center" {...sheetPanResponder.panHandlers}>
        <View className="h-1 w-10 rounded-full bg-grey-10" />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentSheetContent}
      >
        <View className="flex-row items-center justify-between">
          <View className="min-w-0 flex-1 flex-row items-center gap-2 pr-4">
            <ReviewContentAvatar profileImageUrl={profileImageUrl} />
            <Text className="text-body04 text-black" numberOfLines={1}>
              {nickname}
            </Text>
          </View>
          <Pressable
            onPress={onToggleLike}
            className="flex-row items-center justify-center"
            hitSlop={8}
          >
            <View className="h-7 w-7 items-center justify-center">
              <HeartIcon size={24} filled={Boolean(review.liked)} className="text-blue-20" />
            </View>
            {(review.likeCount ?? 0) > 0 ? (
              <Text className="text-caption02 text-grey-40">{review.likeCount}</Text>
            ) : null}
          </Pressable>
        </View>

        {review.keywordIds.filter((keywordId) => keywordId !== 'none').length ? (
          <View className="mt-4 flex-row flex-wrap gap-2">
            {review.keywordIds.map((keywordId) => {
              if (keywordId === 'none') return null;
              const keyword = getPlaceReviewKeyword(keywordId);
              if (!keyword) return null;

              return (
                <View
                  key={keywordId}
                  className="flex-row items-center rounded-full bg-white px-2 py-1.5 shadow-sm"
                >
                  <Text className="text-caption02 text-grey-60">
                    {keyword.emoji ? `${keyword.emoji} ` : ''}
                    {keyword.label}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}

        <View className="mt-4">
          <Text className="text-body05 leading-[21px] text-grey-80">{review.content}</Text>
          <Text className="mt-1 self-end text-caption02 text-grey-30">
            {formatReviewDate(review.createdAt)}
          </Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

function ReviewContentAvatar({ profileImageUrl }: { profileImageUrl: string | null }) {
  if (profileImageUrl) {
    return (
      <Image
        source={{ uri: profileImageUrl }}
        className="h-7 w-7 rounded-full bg-grey-10"
        resizeMode="cover"
      />
    );
  }

  return <View className="h-7 w-7 rounded-full bg-grey-10" />;
}

function formatReviewDate(value: string) {
  try {
    const date = parseISO(value);
    return `${format(date, 'yyyy.MM.dd')} (${KOREAN_WEEKDAYS[date.getDay()]})`;
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  contentSheet: {
    shadowColor: '#17171B',
    shadowOffset: { height: -4, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 8,
  },
  contentSheetContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
});
