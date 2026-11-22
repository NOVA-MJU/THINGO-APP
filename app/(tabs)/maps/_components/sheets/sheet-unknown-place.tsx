import { createSymbolPlace } from '@/api/maps';
import { isLoginRequiredError } from '@/api/client';
import { ExternalLinkIcon, XIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/auth-context';
import { useLoginRequiredModal } from '@/context/login-required-modal-context';
import { showAlert } from '@/lib/alert';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  DAEDONG_PLACE_CATEGORIES,
  guessPlaceCategory,
  type DaedongPlaceCategoryCode,
} from '@/lib/maps/guess-place-category';
import { openLink } from '@/lib/open-link';
import { cn } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Pressable, TouchableOpacity, View } from 'react-native';

// 네이버 지도 기본 글자(가게·장소)를 눌렀는데 우리 DB에 없는 곳일 때.
// 다른 가게처럼 바로 리뷰를 쓸 수 있게 가게 종류만 고르게 하고, 리뷰 쓰기를 누르면 서버가 그 이름·좌표로 띵고 장소를 만든다.
// 네이버 장소 정보(사진·영업시간 등)는 약관상 가져와 보여줄 수 없어서 글자에 있는 이름과 좌표만 쓴다
export default function UnknownPlaceSheet({
  caption,
  latitude,
  longitude,
  onClose,
  onPlaceCreated,
}: {
  caption: string;
  latitude: number;
  longitude: number;
  onClose: () => void;
  // 서버에 장소가 생기면 이 시트를 그 장소 상세로 바꾼다. 리뷰를 쓰고 돌아오면 다른 가게처럼 리뷰가 보인다
  onPlaceCreated: (placeId: number) => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { showLoginRequiredModal } = useLoginRequiredModal();
  const [categoryCode, setCategoryCode] = React.useState<DaedongPlaceCategoryCode | null>(() =>
    guessPlaceCategory(caption)
  );

  const createPlace = useMutation({
    mutationFn: (selectedCategoryCode: DaedongPlaceCategoryCode) =>
      createSymbolPlace({ name: caption, latitude, longitude, categoryCode: selectedCategoryCode }),
    onSuccess: (place, selectedCategoryCode) => {
      onPlaceCreated(place.id);
      router.push({
        pathname: '/maps/reviews/write',
        params: {
          placeId: String(place.id),
          placeName: place.name,
          categoryCode: selectedCategoryCode,
          latitude: String(latitude),
          longitude: String(longitude),
        },
      });
    },
    onError: (error) => {
      if (isLoginRequiredError(error)) {
        showLoginRequiredModal();
        return;
      }
      showAlert('리뷰를 쓸 수 없어요', getApiErrorMessage(error, '잠시 후 다시 시도해 주세요.'));
    },
  });

  function writeReview() {
    if (!categoryCode) return;
    if (!user) {
      showLoginRequiredModal();
      return;
    }
    createPlace.mutate(categoryCode);
  }

  return (
    <View className="gap-4 px-4 pb-6">
      <View className="flex-row items-start">
        <Text className="flex-1 text-black text-title03" numberOfLines={2}>
          {caption}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="닫기"
          hitSlop={4}
          onPress={onClose}
          className="h-7 w-7 items-center justify-center rounded-full bg-grey-02"
        >
          <XIcon size={14} className="text-grey-30" />
        </TouchableOpacity>
      </View>

      <View className="gap-2">
        <Text className="text-grey-80 text-body06">어떤 가게인가요?</Text>
        <View className="flex-row flex-wrap gap-2">
          {DAEDONG_PLACE_CATEGORIES.map((category) => {
            const selected = category.code === categoryCode;
            return (
              <Pressable
                key={category.code}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setCategoryCode(category.code)}
                className={cn(
                  'h-[30px] items-center justify-center rounded-full border px-3',
                  selected ? 'border-blue-10 bg-blue-05' : 'border-grey-10 bg-white'
                )}
              >
                <Text className={cn('text-caption02', selected ? 'text-blue-35' : 'text-grey-60')}>
                  {category.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="gap-2">
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={!categoryCode || createPlace.isPending}
          onPress={writeReview}
          className={cn(
            'h-11 items-center justify-center rounded-xl',
            categoryCode ? 'bg-mju-primary' : 'bg-grey-10'
          )}
        >
          {createPlace.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className={cn('text-body04', categoryCode ? 'text-white' : 'text-grey-40')}>
              {categoryCode ? '리뷰 쓰기' : '가게 종류를 골라 주세요'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => openLink(`https://map.naver.com/p/search/${encodeURIComponent(caption)}`)}
          className="h-11 flex-row items-center justify-center gap-1.5 rounded-xl bg-grey-02"
        >
          <Text className="text-grey-80 text-body04">네이버 지도에서 보기</Text>
          <ExternalLinkIcon size={14} className="text-grey-60" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
