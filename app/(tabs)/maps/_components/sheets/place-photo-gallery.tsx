import { Text } from '@/components/ui/text';
import * as React from 'react';
import {
  Image,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  View,
} from 'react-native';

const PHOTO_HEIGHT = 200;

// 장소 상세의 사진 영역. 한 장이면 기존처럼 고정 이미지, 여러 장이면 좌우로 넘기는 페이지 단위 갤러리
// pagingEnabled는 자식 폭이 화면 폭과 같아야 한 장씩 멈추므로, 시트 안쪽 여백을 뺀 실제 폭을 onLayout으로 재서 쓴다
export default function PlacePhotoGallery({ urls }: { urls: string[] }) {
  const [width, setWidth] = React.useState(0);
  const [page, setPage] = React.useState(0);

  if (!urls.length) return <View className="h-[200px] rounded-lg bg-grey-10" />;

  if (urls.length === 1) {
    return (
      <Image
        source={{ uri: urls[0] }}
        className="h-[200px] w-full rounded-lg bg-grey-10"
        resizeMode="cover"
      />
    );
  }

  function onLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  // momentum 종료 이벤트는 web에 없어서, 양쪽 모두 오는 onScroll의 위치로 현재 장을 계산한다
  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!width) return;
    setPage(Math.round(event.nativeEvent.contentOffset.x / width));
  }

  return (
    <View className="overflow-hidden rounded-lg bg-grey-10" onLayout={onLayout}>
      {width ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={100}
        >
          {urls.map((url, index) => (
            <Image
              key={`${index}-${url}`}
              source={{ uri: url }}
              style={{ width, height: PHOTO_HEIGHT }}
              resizeMode="cover"
              accessibilityLabel={`장소 사진 ${index + 1} / ${urls.length}`}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={{ height: PHOTO_HEIGHT }} />
      )}
      <View className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5">
        <Text className="text-white text-caption02">
          {page + 1} / {urls.length}
        </Text>
      </View>
    </View>
  );
}
