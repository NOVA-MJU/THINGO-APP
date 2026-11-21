import { XIcon } from '@/components/icons';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useLibraryPhotoUri } from '@/hooks/use-place-photos';
import type { VisitedPlace } from '@/hooks/use-visited-places';
import { formatVisitDate } from '@/lib/maps/format';
import { ChevronRight } from 'lucide-react-native';
import * as React from 'react';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { NativeViewGestureHandler } from 'react-native-gesture-handler';
import LibraryPhotoViewer from './library-photo-viewer';

// 건물마다 미리 보여줄 사진 수 (썸네일마다 원본 파일을 연다)
const MAX_PREVIEW_PHOTOS = 10;

// 여러 건물이 묶인 "사진 N장" 핀을 눌렀을 때. 지도는 건물별 핀으로 풀릴 만큼 확대되고(index.tsx onVisitedMarkerPress),
// 이 시트는 묶여 있던 건물마다 내 사진을 좌우 한 줄로 보여준다. 건물(줄 제목)을 누르면 그 건물 핀을 누른 것처럼
// 사진을 고르고 가게를 고르는 시트(sheet-visit-candidates.tsx)로 넘어간다. 사진을 누르면 크게 본다
export default function VisitAreaSheet({
  visits,
  onSelectBuilding,
  onClose,
}: {
  // 묶여 있던 건물들 (최근 순)
  visits: VisitedPlace[];
  onSelectBuilding: (visitKey: string) => void;
  onClose: () => void;
}) {
  const photoCount = visits.reduce((sum, visit) => sum + visit.photos.length, 0);
  // 크게 보고 있는 건물과 사진 순번
  const [viewer, setViewer] = React.useState<{ visitKey: string; index: number } | null>(null);
  const viewerPhotoIds =
    visits
      .find((visit) => visit.key === viewer?.visitKey)
      ?.photos.slice(0, MAX_PREVIEW_PHOTOS)
      .map((photo) => photo.id) ?? [];

  return (
    <ScrollView>
      <View className="flex-row items-start px-4">
        <View className="flex-1 gap-1">
          <Text className="text-black text-title03">이 주변에서 찍은 내 사진 {photoCount}장</Text>
          <Text className="text-grey-60 text-caption02">
            {`건물 ${visits.length}곳에서 찍었어요. 건물을 고르면 그 건물 가게와 함께 리뷰를 쓸 수 있어요.`}
          </Text>
        </View>
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

      {visits.map((visit) => (
        <View key={visit.key} className="mt-5" style={{ gap: 8 }}>
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.7}
            onPress={() => onSelectBuilding(visit.key)}
            className="flex-row items-center gap-1 px-4"
          >
            <View className="flex-1">
              <Text className="text-black text-body04" numberOfLines={1}>
                {visit.address?.replace(/^서울\s+\S+구\s+/, '') ?? visit.candidates[0]?.name}
              </Text>
              <Text className="text-grey-40 text-caption02">
                {`사진 ${visit.photos.length}장 · ${formatVisitDate(visit.lastVisitAt)}`}
              </Text>
            </View>
            <Text className="text-mju-primary text-caption01">가게 고르기</Text>
            <Icon as={ChevronRight} size={16} className="text-mju-primary" />
          </TouchableOpacity>
          <NativeViewGestureHandler disallowInterruption>
            <ScrollView
              horizontal
              nestedScrollEnabled
              directionalLockEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, paddingHorizontal: 16 }}
            >
              {visit.photos.slice(0, MAX_PREVIEW_PHOTOS).map((photo, index) => (
                <PreviewTile
                  key={photo.id}
                  id={photo.id}
                  onPress={() => setViewer({ visitKey: visit.key, index })}
                />
              ))}
            </ScrollView>
          </NativeViewGestureHandler>
        </View>
      ))}
      <View className="h-6" />
      <LibraryPhotoViewer
        photoIds={viewerPhotoIds}
        index={viewer?.index ?? null}
        onChangeIndex={(index) => setViewer((previous) => previous && { ...previous, index })}
        onClose={() => setViewer(null)}
      />
    </ScrollView>
  );
}

function PreviewTile({ id, onPress }: { id: string; onPress: () => void }) {
  const uri = useLibraryPhotoUri(id);
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="사진 크게 보기"
      activeOpacity={0.8}
      onPress={onPress}
      className="h-20 w-20 overflow-hidden rounded-lg bg-grey-10"
    >
      {uri && <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />}
    </TouchableOpacity>
  );
}
