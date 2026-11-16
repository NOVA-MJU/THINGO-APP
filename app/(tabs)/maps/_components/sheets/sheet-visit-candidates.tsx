import { XIcon } from '@/components/icons';
import { RestaurantIcon } from '@/components/icons/map';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useLibraryPhotoUri } from '@/hooks/use-place-photos';
import type { VisitedPlace, VisitedPlaceCandidate } from '@/hooks/use-visited-places';
import { ChevronRight, Lock } from 'lucide-react-native';
import { Fragment } from 'react';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { NativeViewGestureHandler } from 'react-native-gesture-handler';

// 지도에 보여줄 사진 최대 장수 (썸네일마다 원본 파일을 연다)
const MAX_THUMBNAILS = 6;

// 지도 "다녀온 곳" 핀을 눌렀는데 사진 위치 근처 가게가 여러 곳일 때 (대동 상권은 가게가 붙어 있어 GPS로 가릴 수 없다)
// 사진을 보여주고 어느 가게였는지 고르게 한다. 고르면 그 가게 상세(내 사진 카드)로 간다
export default function VisitCandidatesSheet({
  visit,
  onSelect,
  onClose,
}: {
  visit: VisitedPlace;
  onSelect: (candidate: VisitedPlaceCandidate) => void;
  onClose: () => void;
}) {
  return (
    <ScrollView>
      <View className="flex-row items-start px-4">
        <View className="flex-1 gap-1">
          <Text className="text-black text-title03">이 사진, 어디서 찍었나요?</Text>
          <Text className="text-grey-60 text-caption02">
            {`${formatVisitDate(visit.lastVisitAt)}에 찍은 사진 근처에 가게가 ${visit.candidates.length}곳 있어요.\n다녀온 곳을 고르면 바로 리뷰를 쓸 수 있어요.`}
          </Text>
        </View>
        <TouchableOpacity
          hitSlop={4}
          onPress={onClose}
          className="h-7 w-7 items-center justify-center rounded-full bg-grey-02"
        >
          <XIcon size={14} className="text-grey-30" />
        </TouchableOpacity>
      </View>

      <NativeViewGestureHandler disallowInterruption>
        <ScrollView
          horizontal
          nestedScrollEnabled
          directionalLockEnabled
          showsHorizontalScrollIndicator={false}
          className="mt-4"
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
        >
          {visit.photoIds.slice(0, MAX_THUMBNAILS).map((id) => (
            <Thumbnail key={id} id={id} />
          ))}
        </ScrollView>
      </NativeViewGestureHandler>
      <View className="mt-2 flex-row items-center gap-1 px-4">
        <Icon as={Lock} size={12} className="text-grey-40" />
        <Text className="text-grey-40 text-caption02">내 사진첩 사진이라 나만 보여요</Text>
      </View>

      <View className="py-3">
        <View className="h-1 bg-grey-02" />
      </View>

      {visit.candidates.map((candidate, index) => (
        <Fragment key={candidate.id}>
          {index > 0 && <View className="mx-4 my-3 h-[1.5px] bg-grey-02" />}
          <TouchableOpacity
            className="flex-row items-center gap-3.5 px-4"
            activeOpacity={0.7}
            onPress={() => onSelect(candidate)}
          >
            <View className="rounded bg-blue-05 p-2">
              <RestaurantIcon size={24} className="text-blue-15" />
            </View>
            <View className="flex-1">
              <Text className="text-black text-body04" numberOfLines={1}>
                {candidate.name}
              </Text>
              <Text className="text-grey-40 text-caption02">
                사진 위치에서 약 {Math.max(1, Math.round(candidate.distanceMeters))}m
              </Text>
            </View>
            <Icon as={ChevronRight} size={18} className="text-grey-30" />
          </TouchableOpacity>
        </Fragment>
      ))}
      <View className="h-6" />
    </ScrollView>
  );
}

function Thumbnail({ id }: { id: string }) {
  const uri = useLibraryPhotoUri(id);
  return (
    <View className="h-20 w-20 overflow-hidden rounded-xl bg-grey-10">
      {uri && <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />}
    </View>
  );
}

function formatVisitDate(ms: number) {
  const date = new Date(ms);
  const prefix = date.getFullYear() === new Date().getFullYear() ? '' : `${date.getFullYear()}년 `;
  return `${prefix}${date.getMonth() + 1}월 ${date.getDate()}일`;
}
