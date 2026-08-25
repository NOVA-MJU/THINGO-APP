import * as React from 'react';
import { Animated, View } from 'react-native';

type ReviewMediaStoryIndicatorItem = {
  id: string;
};

type ReviewMediaStoryIndicatorProps = {
  visible: boolean;
  items: ReviewMediaStoryIndicatorItem[];
  activeIndex: number;
  progress: Animated.Value;
  topOffset: number;
};

export function ReviewMediaStoryIndicator({
  visible,
  items,
  activeIndex,
  progress,
  topOffset,
}: ReviewMediaStoryIndicatorProps) {
  if (!visible || items.length <= 1) return null;

  return (
    <View
      className="absolute left-4 right-4 z-20 flex-row items-center gap-[6px]"
      style={{ top: topOffset }}
    >
      {items.map((item, index) => (
        <View key={item.id} className="h-[2px] flex-1 rounded-full bg-white/30">
          {index < activeIndex ? (
            <View className="h-full w-full rounded-full bg-white" />
          ) : index === activeIndex ? (
            <Animated.View
              className="h-full rounded-full bg-white"
              style={{
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              }}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}
