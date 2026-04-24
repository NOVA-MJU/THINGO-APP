import { ArrowBackIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import * as React from 'react';
import { Dimensions, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Page1 } from './_components/Page1';
import { Page2 } from './_components/Page2';
import { Page3 } from './_components/Page3';
import MealSection from './_components/meal';

const { width } = Dimensions.get('window');
const INITIAL_PAGE = 1; // 0-indexed, Page2

export default function Screen() {
  const insets = useSafeAreaInsets();
  const scrollRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ x: width * INITIAL_PAGE, animated: false });
  }, []);

  return (
    <>
      {/* 앱 헤더 */}
      <View
        style={{ paddingTop: insets.top }}
        className="border-b border-border bg-background px-4 pb-3">
        <View className="h-15 flex-row items-center">
          <ArrowBackIcon />
          <Text className="text-heading02 text-mju-primary">Thingo</Text>
        </View>
      </View>

      {/* 스와이프 페이지 */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}>
        <Page1 />
        <Page2 />
        <Page3 />
        <View className="w-screen flex-1 bg-white">
          <MealSection />
        </View>
      </ScrollView>
    </>
  );
}
