import { XIcon } from '@/components/icons';
import { RestaurantIcon } from '@/components/icons/map';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useLibraryPhotoUri } from '@/hooks/use-place-photos';
import { formatVisitDate } from '@/lib/maps/format';
import { cn } from '@/lib/utils';
import type { VisitedPlace, VisitedPlaceCandidate } from '@/hooks/use-visited-places';
import { Check, ChevronRight, Lock } from 'lucide-react-native';
import * as React from 'react';
import { Image, Pressable, ScrollView, TouchableOpacity, View } from 'react-native';
import { NativeViewGestureHandler } from 'react-native-gesture-handler';
import DismissPhotosDialog from './dismiss-photos-dialog';
import LibraryPhotoViewer from './library-photo-viewer';

// 지도에 보여줄 사진 최대 장수 (썸네일마다 원본 파일을 연다)
const MAX_THUMBNAILS = 6;

// 지도 "다녀온 곳" 핀을 눌렀는데 사진 위치 근처 가게가 여러 곳일 때 (대동 상권은 가게가 붙어 있어 GPS로 가릴 수 없다)
// 사진을 보여주고 어느 가게였는지 고르게 한다. 사진 오른쪽 위 동그라미로 올릴 사진을 고르고(처음엔 모두 선택),
// 가게를 누르면 고른 사진이 붙은 리뷰 쓰기 화면으로 바로 간다. 사진 자체를 누르면 크게 본다
export default function VisitCandidatesSheet({
  visit,
  onSelect,
  onClose,
  onDismissPhotos,
}: {
  visit: VisitedPlace;
  // 고른 가게와 리뷰에 올릴 사진 (화면에 보이는 순서)
  onSelect: (candidate: VisitedPlaceCandidate, photoIds: string[]) => void;
  onClose: () => void;
  // 이 사진들을 숨긴다 (다른 가게 사진, 지금은 없어진 예전 가게 사진)
  onDismissPhotos: () => void;
}) {
  const [isDismissDialogOpen, setIsDismissDialogOpen] = React.useState(false);
  // 크게 보고 있는 사진 순번 (사진을 누르면 연다)
  const [viewerIndex, setViewerIndex] = React.useState<number | null>(null);
  const photoIds = visit.photoIds.slice(0, MAX_THUMBNAILS);
  const [selectedIds, setSelectedIds] = React.useState<string[]>(photoIds);
  const orderedSelectedIds = photoIds.filter((id) => selectedIds.includes(id));

  function togglePhoto(id: string) {
    setSelectedIds((previous) =>
      previous.includes(id) ? previous.filter((selectedId) => selectedId !== id) : [...previous, id]
    );
  }

  return (
    <ScrollView>
      <View className="flex-row items-start px-4">
        <View className="flex-1 gap-1">
          <Text className="text-black text-title03">이 사진, 어디서 찍었나요?</Text>
          <Text className="text-grey-60 text-caption02">
            {`${formatVisitDate(visit.lastVisitAt)}에 찍은 사진 근처에 가게가 ${visit.candidates.length}곳 있어요.\n다녀온 곳을 고르면 고른 사진으로 바로 리뷰를 쓸 수 있어요.`}
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
          {photoIds.map((id, index) => {
            const selected = selectedIds.includes(id);
            return (
              <TouchableOpacity
                key={id}
                accessibilityRole="button"
                accessibilityLabel="사진 크게 보기"
                activeOpacity={0.8}
                onPress={() => setViewerIndex(index)}
              >
                <Thumbnail id={id} />
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel="리뷰에 올릴 사진으로 고르기"
                  hitSlop={8}
                  onPress={() => togglePhoto(id)}
                  className={cn(
                    'absolute right-1.5 top-1.5 h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-white',
                    selected ? 'bg-mju-primary' : 'bg-black/25'
                  )}
                >
                  {selected && <Icon as={Check} size={12} className="text-white" strokeWidth={3} />}
                </Pressable>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </NativeViewGestureHandler>
      <View className="mt-2 flex-row items-center gap-1 px-4">
        <Icon as={Lock} size={12} className="text-grey-40" />
        <Text className="text-grey-40 text-caption02">
          내 사진첩 사진이라 나만 보여요 · {orderedSelectedIds.length}장 선택
        </Text>
      </View>

      <View className="py-3">
        <View className="h-1 bg-grey-02" />
      </View>

      {visit.candidates.map((candidate, index) => (
        <React.Fragment key={candidate.id}>
          {index > 0 && <View className="mx-4 my-3 h-[1.5px] bg-grey-02" />}
          <TouchableOpacity
            className="flex-row items-center gap-3.5 px-4"
            activeOpacity={0.7}
            onPress={() => onSelect(candidate, orderedSelectedIds)}
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
        </React.Fragment>
      ))}
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => setIsDismissDialogOpen(true)}
        className="mt-5 items-center py-2"
      >
        <Text className="text-grey-40 underline text-caption02">여기 가게 사진이 아니에요</Text>
      </TouchableOpacity>
      <View className="h-6" />
      <DismissPhotosDialog
        open={isDismissDialogOpen}
        onOpenChange={setIsDismissDialogOpen}
        onDismiss={() => {
          setIsDismissDialogOpen(false);
          onDismissPhotos();
        }}
      />
      <LibraryPhotoViewer
        photoIds={photoIds}
        index={viewerIndex}
        onChangeIndex={setViewerIndex}
        onClose={() => setViewerIndex(null)}
      />
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
