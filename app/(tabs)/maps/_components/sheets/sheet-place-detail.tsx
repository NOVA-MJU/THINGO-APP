import type { MapPlaceDetail } from '@/api/maps';
import { XIcon } from '@/components/icons';
import { FavoriteIcon, InfoIcon } from '@/components/icons/map';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/auth-context';
import { useLoginRequiredModal } from '@/context/login-required-modal-context';
import { formatMapDistance } from '@/lib/maps/format';
import { getMapIcon, getMapIconClassName } from '@/lib/maps/icons';
import {
  getPlaceReviewMediaStrip,
  getPlaceReviews,
  type PlaceReview,
  type PlaceReviewMediaStripItem,
  type PlaceReviewSort,
} from '@/lib/maps/place-reviews';
import { useFocusEffect, useRouter } from 'expo-router';
import * as React from 'react';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';
import FavoriteSaveSheet, {
  type FavoriteSaveSheetHandle,
} from '@/app/(tabs)/maps/_components/sheets/favorite-save-sheet';
import PlaceCommunitySection from './place-community-section';

// 명지도 장소(비건물) 상세보기 시트 - 건물 상세와 달리 강의실 코드·운영시간은 없고 위치·추가정보(infoText)를 제공
export default function PlaceDetailSheet({
  place,
  onClose,
}: {
  place: MapPlaceDetail;
  onClose?: () => void;
}) {
  const router = useRouter();
  const Icon = getMapIcon(place.iconKey ?? '', place.categoryCode);
  const { user } = useAuth();
  const { showLoginRequiredModal } = useLoginRequiredModal();
  const favoriteSaveSheetRef = React.useRef<FavoriteSaveSheetHandle>(null);
  const [reviews, setReviews] = React.useState<PlaceReview[]>([]);
  const [reviewMediaItems, setReviewMediaItems] = React.useState<PlaceReviewMediaStripItem[]>([]);

  // 즐겨찾기 버튼 클릭 → 기존 즉시 토글(useToggleMapFavorite) API 연결은 해제하고,
  // 그룹 선택 바텀시트를 여는 방식으로 교체 (디자인/기능 미확정 — 지금은 뼈대만 연결)
  // 로그인 안 돼 있으면 시트를 열지 않고 로그인 필요 모달을 표시
  function onFavoritePress() {
    if (!user) {
      showLoginRequiredModal();
      return;
    }
    favoriteSaveSheetRef.current?.open({ pinId: place.id, name: place.name });
  }

  const loadReviews = React.useCallback(
    async (sort: PlaceReviewSort = 'latest') => {
      const nextReviews = await getPlaceReviews(place.id, { sort });
      setReviews(nextReviews);
    },
    [place.id]
  );

  const loadReviewMediaItems = React.useCallback(async () => {
    const nextMediaItems = await getPlaceReviewMediaStrip(place.id);
    setReviewMediaItems(nextMediaItems);
  }, [place.id]);

  useFocusEffect(
    React.useCallback(() => {
      void loadReviews();
      void loadReviewMediaItems();
    }, [loadReviewMediaItems, loadReviews])
  );

  return (
    <>
      <ScrollView>
        <View className="pb-6">
          <View className="flex-row gap-3.5 px-4">
            <View className="rounded bg-blue-05 p-2">
              <Icon size={28} className={getMapIconClassName(place.categoryCode)} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-title03 text-black" numberOfLines={1}>
                {place.name}
              </Text>
              {place.location ? (
                <Text className="text-body05 text-grey-80" numberOfLines={1}>
                  {place.location}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity hitSlop={4} onPress={onFavoritePress}>
              <FavoriteIcon size={28} active={place.favorite} />
            </TouchableOpacity>
            <TouchableOpacity
              hitSlop={4}
              onPress={onClose}
              className="h-7 w-7 items-center justify-center rounded-full bg-grey-02"
            >
              <XIcon size={14} className="text-grey-30" />
            </TouchableOpacity>
          </View>

          {(place.distanceMeters != null || place.infoText) && (
            <View className="mt-2.5 gap-1 px-4">
              {place.distanceMeters != null ? (
                <Text className="text-body05 text-grey-30">
                  {formatMapDistance(place.distanceMeters)}
                </Text>
              ) : null}
              {place.infoText ? (
                <View className="flex-row items-start gap-1">
                  <InfoIcon size={16} className="mt-0.5 text-grey-20" />
                  <Text className="flex-1 text-caption02 text-grey-40">{place.infoText}</Text>
                </View>
              ) : null}
            </View>
          )}

          <View className="mt-2 px-4">
            {place.imageUrl ? (
              <Image
                source={{ uri: place.imageUrl }}
                className="h-[200px] w-full rounded-lg bg-grey-10"
                resizeMode="cover"
              />
            ) : (
              <View className="h-[200px] rounded-lg bg-grey-10" />
            )}
          </View>

          <PlaceCommunitySection
            placeName={place.name}
            categoryCode={place.categoryCode}
            reviews={reviews}
            reviewMediaItems={reviewMediaItems}
            onReviewsChange={setReviews}
            onReviewDeleted={(reviewId) => {
              setReviewMediaItems((previous) =>
                previous.filter((item) => item.reviewId !== reviewId)
              );
            }}
            onSortChange={(sort) => void loadReviews(sort)}
            onWriteReview={() =>
              router.push({
                pathname: '/maps/reviews/write',
                params: {
                  placeId: String(place.id),
                  placeName: place.name,
                  categoryCode: place.categoryCode,
                },
              })
            }
            onOpenMedia={(reviewId, mediaIndex, source) =>
              router.push({
                pathname: '/maps/reviews/media',
                params: {
                  placeId: String(place.id),
                  placeName: place.name,
                  reviewId,
                  mediaIndex: mediaIndex != null ? String(mediaIndex) : undefined,
                  mediaSource: source,
                },
              })
            }
          />
        </View>
      </ScrollView>

      <FavoriteSaveSheet ref={favoriteSaveSheetRef} />
    </>
  );
}
