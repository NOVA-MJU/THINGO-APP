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
import { ScrollView, TouchableOpacity, View } from 'react-native';
import FavoriteSaveSheet, {
  type FavoriteSaveSheetHandle,
} from '@/app/(tabs)/maps/_components/sheets/favorite-save-sheet';
import PlaceCommunitySection from './place-community-section';
import { EmptyPlaceMedia, MyPlacePhotosCard, MyPlacePhotosNudge } from './place-my-photos';
import PlacePhotoGallery from './place-photo-gallery';
import { usePlacePhotos } from '@/hooks/use-place-photos';
import { useMyPlaceReviews } from '@/hooks/use-my-place-reviews';
import { useDismissPlacePhotos } from '@/hooks/use-visited-places';

// 명지도 장소(비건물) 상세보기 시트 - 건물 상세와 달리 강의실 코드는 없고 위치·추가정보(infoText)를 제공
// operatingStatus: 서버가 아직 실제 운영 상태 문자열("운영중"/"운영 종료" 등)을 내려주지 않는 중이라
// 우선 null(정보 없음) 케이스만 안내 문구로 처리하고, 값이 있을 때의 표시 방식은 추후 결정
export default function PlaceDetailSheet({
  place,
  onClose,
  onPeekHeightChange,
}: {
  place: MapPlaceDetail;
  onClose?: () => void;
  // 시트를 처음 열 높이(내용 위에서부터 "리뷰 N" 영역 바로 위까지, px). 지도 화면이 시트 중간 높이로 쓴다
  onPeekHeightChange?: (height: number) => void;
}) {
  const router = useRouter();
  const Icon = getMapIcon(place.iconKey ?? '', place.categoryCode);
  const { user } = useAuth();
  const { showLoginRequiredModal } = useLoginRequiredModal();
  const favoriteSaveSheetRef = React.useRef<FavoriteSaveSheetHandle>(null);
  const [reviews, setReviews] = React.useState<PlaceReview[]>([]);
  // 리뷰 목록은 첫 페이지만 받아서 내 리뷰가 빠질 수 있다. 내가 쓴 리뷰(GET /reviews/me) 중 이 장소 것을 더해
  // 목록 맨 위에 둔다 (순서는 place-community-section.tsx sortReviews). 목록에 이미 있으면 목록 쪽(좋아요 반영)을 쓴다
  const myReviews = useMyPlaceReviews();
  const reviewsWithMine = React.useMemo(() => {
    const myReviewsHere = myReviews
      .filter((item) => item.placeId === place.id)
      .map((item) => reviews.find((review) => review.id === item.review.id) ?? item.review);
    return [
      ...myReviewsHere,
      ...reviews.filter((review) => !myReviewsHere.some((mine) => mine.id === review.id)),
    ];
  }, [myReviews, place.id, reviews]);
  const [reviewMediaItems, setReviewMediaItems] = React.useState<PlaceReviewMediaStripItem[]>([]);
  // 첫 응답 전에 "사진 없음" 안내가 잠깐 보였다가 사라지지 않도록 받아왔는지 따로 기억한다
  const [isReviewMediaLoaded, setIsReviewMediaLoaded] = React.useState(false);
  const placePoint = React.useMemo(
    () => ({ latitude: place.latitude, longitude: place.longitude }),
    [place.latitude, place.longitude]
  );
  const myPhotos = usePlacePhotos(place.id, placePoint);
  const dismissPhotos = useDismissPlacePhotos();
  // 리뷰 영역(PlaceCommunitySection)이 시트 내용 맨 위에서 떨어진 거리
  const [communityY, setCommunityY] = React.useState<number | null>(null);
  const onReviewSectionTopChange = React.useCallback(
    (reviewSectionTop: number) => {
      if (communityY !== null) onPeekHeightChange?.(communityY + reviewSectionTop);
    },
    [communityY, onPeekHeightChange]
  );
  const myVisits = myPhotos.status === 'granted' ? (myPhotos.visits ?? []) : [];
  const hasMyPhotos = myVisits.length > 0;
  // 장소 대표 사진이 없으면 리뷰 사진으로 위쪽 큰 사진 자리를 채운다
  const heroUrls = place.imageUrl
    ? [place.imageUrl]
    : reviewMediaItems
        .filter((item) => item.mediaItem.type === 'image')
        .slice(0, 5)
        .map((item) => item.mediaItem.url);

  // 즐겨찾기 버튼 클릭 → 그룹 선택 바텀시트를 연다.
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
    try {
      const nextMediaItems = await getPlaceReviewMediaStrip(place.id);
      setReviewMediaItems(nextMediaItems);
    } finally {
      setIsReviewMediaLoaded(true);
    }
  }, [place.id]);

  // 같은 시트에서 다른 장소로 바뀌면(지도 핀 연속 클릭) 이전 장소의 사진 상태를 비운다
  React.useEffect(() => {
    setReviewMediaItems([]);
    setIsReviewMediaLoaded(false);
  }, [place.id]);

  // photoIds: 장소 상세의 내 사진 카드에서 골라 온 사진첩 id. 리뷰 작성 화면이 열리면서 자동으로 올린다
  // 로그인하지 않았으면 리뷰 화면에 들어가지 않고 로그인 안내를 띄운다 (들어가서 등록할 때 서버 에러가 나지 않게)
  function openWriteReview(photoIds?: string[]) {
    if (!user) {
      showLoginRequiredModal();
      return;
    }
    router.push({
      pathname: '/maps/reviews/write',
      params: {
        placeId: String(place.id),
        placeName: place.name,
        categoryCode: place.categoryCode,
        latitude: String(place.latitude),
        longitude: String(place.longitude),
        ...(photoIds?.length ? { photoIds: photoIds.join(',') } : {}),
      },
    });
  }

  // 내 리뷰 수정: 리뷰 쓰기 화면을 수정 모드(reviewId)로 연다. 돌아오면 아래 useFocusEffect가 리뷰를 다시 불러온다
  function openEditReview(reviewId: string) {
    if (!user) {
      showLoginRequiredModal();
      return;
    }
    router.push({
      pathname: '/maps/reviews/write',
      params: {
        reviewId,
        placeId: String(place.id),
        placeName: place.name,
        categoryCode: place.categoryCode,
        latitude: String(place.latitude),
        longitude: String(place.longitude),
      },
    });
  }

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

            {/* 장소 이름, 주소 표시 */}
            <View className="min-w-0 flex-1">
              <Text className="text-black text-title03" numberOfLines={1}>
                {place.name}
              </Text>
              {place.location ? (
                <View className="flex-row items-center gap-1">
                  <View className="rounded bg-grey-02 px-1">
                    <Text className="text-grey-60 text-caption02">도로명</Text>
                  </View>
                  <Text className="text-grey-80 text-caption02" numberOfLines={1}>
                    {place.location}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* 즐겨찾기 버튼 */}
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

          {/* 운영시간 정보 및 거리 표시 */}
          {(place.distanceMeters != null || place.infoText || place.operatingStatus === null) && (
            <View className="mt-2.5 gap-1 px-4">
              <View className="flex-row items-center">
                <Text className="text-grey-40 text-body04">
                  {place.operatingStatus || '운영 정보 없음'}
                </Text>
                {place.distanceMeters != null ? (
                  <>
                    <View className="px-1.5">
                      <View className="h-[3px] w-[3px] rounded-full bg-grey-30" />
                    </View>
                    <Text className="text-grey-30 text-body05">
                      {formatMapDistance(place.distanceMeters)}
                    </Text>
                  </>
                ) : null}
              </View>

              {/* 장소 추가 정보 표시 */}
              {place.infoText ? (
                <View className="flex-row items-start gap-1">
                  <InfoIcon size={16} className="mt-0.5 text-grey-20" />
                  <Text className="flex-1 text-grey-40 text-caption02">{place.infoText}</Text>
                </View>
              ) : null}
            </View>
          )}

          {heroUrls.length > 0 && (
            <View className="mt-2 px-4">
              <PlacePhotoGallery urls={heroUrls} />
            </View>
          )}

          <View onLayout={(event) => setCommunityY(event.nativeEvent.layout.y)}>
            <PlaceCommunitySection
              onEditReview={openEditReview}
              onReviewSectionTopChange={onReviewSectionTopChange}
              placeName={place.name}
              categoryCode={place.categoryCode}
              reviews={reviewsWithMine}
              reviewMediaItems={reviewMediaItems}
              onReviewsChange={setReviews}
              onReviewDeleted={(reviewId) => {
                setReviewMediaItems((previous) =>
                  previous.filter((item) => item.reviewId !== reviewId)
                );
              }}
              onSortChange={(sort) => void loadReviews(sort)}
              onWriteReview={() => openWriteReview()}
              mediaEmptyContent={
                !isReviewMediaLoaded ? null : hasMyPhotos ? (
                  <MyPlacePhotosCard
                    key={place.id}
                    visits={myVisits}
                    photoCount={myPhotos.photoCount}
                    onWriteReview={openWriteReview}
                    onDismissPhotos={(photoIds) =>
                      dismissPhotos.mutate({ placeIds: [place.id], photoIds })
                    }
                  />
                ) : (
                  <EmptyPlaceMedia
                    searching={
                      myPhotos.status === 'granted' && myPhotos.isFetching && !myPhotos.visits
                    }
                    onAddPhoto={() => openWriteReview()}
                    onFindMine={
                      myPhotos.status === 'undetermined'
                        ? () => void myPhotos.requestPermission()
                        : undefined
                    }
                  />
                )
              }
              mediaFooter={
                hasMyPhotos ? (
                  <MyPlacePhotosNudge
                    photos={myVisits[0].photos}
                    photoCount={myPhotos.photoCount}
                    onPress={() => openWriteReview()}
                  />
                ) : null
              }
              showReviewPrompt={isReviewMediaLoaded && reviewMediaItems.length > 0 && !hasMyPhotos}
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
        </View>
      </ScrollView>

      <FavoriteSaveSheet ref={favoriteSaveSheetRef} />
    </>
  );
}
