import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { clsx } from 'clsx';
import * as React from 'react';
import { LayoutRectangle, ScrollView, View } from 'react-native';

type Props = {
  tabs: string[];
  currentTab: string;
  onTabPress: (index: number) => void;
};

export function TabBar({ tabs, currentTab, onTabPress }: Props) {
  const scrollRef = React.useRef<ScrollView>(null);
  const tabLayouts = React.useRef<(LayoutRectangle | null)[]>(tabs.map(() => null));
  const containerWidth = React.useRef(0);

  // 자동 스크롤
  React.useEffect(() => {
    const index = tabs.indexOf(currentTab);
    const layout = tabLayouts.current[index];
    if (!layout) return;

    const tabCenter = layout.x + layout.width / 2;
    const scrollX = tabCenter - containerWidth.current / 2;
    scrollRef.current?.scrollTo({ x: Math.max(0, scrollX), animated: true });
  }, [currentTab, tabs]);

  return (
    <View className="border-b border-grey-20">
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        onLayout={(e) => {
          containerWidth.current = e.nativeEvent.layout.width;
        }}
      >
        {tabs.map((label, index) => (
          <Button
            key={label}
            variant="ghost"
            className={clsx(
              'rounded-none border-b-2 px-5 pb-1.5 pt-2.5',
              currentTab === label ? 'border-mju-primary' : 'border-transparent'
            )}
            onPress={() => onTabPress(index)}
            onLayout={(e) => {
              tabLayouts.current[index] = e.nativeEvent.layout;
            }}
          >
            <Text
              className={`${currentTab === label ? 'text-body04 text-mju-primary' : 'text-body06 text-grey-40'}`}
            >
              {label}
            </Text>
          </Button>
        ))}
      </ScrollView>
    </View>
  );
}
