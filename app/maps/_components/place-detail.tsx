import * as React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';

const DUMMY_PLACE = {
  displayName: { text: '맥도날드 숭실대점' },
  regularOpeningHours: {
    openNow: true,
    weekdayDescriptions: [
      '월요일: 오전 10:30~오후 10:00',
      '화요일: 오전 10:30~오후 10:00',
      '수요일: 오전 10:30~오후 10:00',
      '목요일: 오전 10:30~오후 10:00',
      '금요일: 오전 10:30~오후 11:00',
      '토요일: 오전 10:30~오후 11:00',
      '일요일: 오전 10:30~오후 10:00',
    ],
  },
  reviews: [
    {
      relativePublishTimeDescription: '2주 전',
      rating: 5,
      text: { text: '매장이 넓고 쾌적합니다. 숭실대입구역 바로 앞이라 접근성도 좋아요.' },
      authorAttribution: { displayName: '홍길동' },
    },
    {
      relativePublishTimeDescription: '1개월 전',
      rating: 4,
      text: { text: '위치가 편리하고 직원분들이 친절해요. 주말엔 좀 붐비는 편입니다.' },
      authorAttribution: { displayName: '김철수' },
    },
  ],
};

function StarRating({ rating }: { rating: number }) {
  return (
    <Text className="text-yellow-400">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </Text>
  );
}

export function PlaceDetail({ placeId: _ }: { placeId: string }) {
  const [hoursExpanded, setHoursExpanded] = React.useState(false);
  const place = DUMMY_PLACE;

  return (
    <View>
      {/* 커버 이미지 */}
      <Image
        source={{ uri: 'https://picsum.photos/800/320' }}
        style={{ width: '100%', height: 160 }}
        resizeMode="cover"
      />

      {/* 헤더 */}
      <View className="flex-row items-center gap-3 px-6 py-4">
        <Text className="flex-1 text-xl font-bold">{place.displayName.text}</Text>
        <View
          className={`rounded-full px-3 py-1 ${place.regularOpeningHours.openNow ? 'bg-green-100' : 'bg-red-100'}`}
        >
          <Text
            className={`text-sm font-medium ${place.regularOpeningHours.openNow ? 'text-green-700' : 'text-red-600'}`}
          >
            {place.regularOpeningHours.openNow ? '영업 중' : '영업 종료'}
          </Text>
        </View>
      </View>

      <View className="h-px bg-grey-20 mx-6" />

      {/* 영업시간 */}
      <View className="px-6 py-4 gap-3">
        <TouchableOpacity
          className="flex-row items-center justify-between"
          onPress={() => setHoursExpanded((v) => !v)}
          hitSlop={8}
        >
          <Text className="font-semibold">영업시간</Text>
          <Text className="text-grey-40">{hoursExpanded ? '접기 ▲' : '펼치기 ▼'}</Text>
        </TouchableOpacity>

        {hoursExpanded && (
          <View className="gap-1.5">
            {place.regularOpeningHours.weekdayDescriptions.map((desc) => (
              <Text key={desc} className="text-sm text-grey-60">
                {desc}
              </Text>
            ))}
          </View>
        )}
      </View>

      <View className="h-px bg-grey-20 mx-6" />

      {/* 리뷰 */}
      <View className="px-6 py-4 gap-4">
        <Text className="font-semibold">리뷰</Text>
        {place.reviews.map((review, index) => (
          <View key={index} className="gap-1.5">
            <View className="flex-row items-center justify-between">
              <Text className="font-medium">{review.authorAttribution.displayName}</Text>
              <Text className="text-xs text-grey-40">{review.relativePublishTimeDescription}</Text>
            </View>
            <StarRating rating={review.rating} />
            <Text className="text-sm text-grey-60">{review.text.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
