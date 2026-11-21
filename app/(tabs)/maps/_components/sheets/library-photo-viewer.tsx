import { XIcon } from '@/components/icons';
import { ZoomableMedia } from '@/components/maps/reviews/zoomable-media';
import { Text } from '@/components/ui/text';
import { useLibraryPhotoUri } from '@/hooks/use-place-photos';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 내 사진첩 사진을 화면 가득 크게 본다. 두 손가락으로 벌리거나 두 번 눌러 확대한다.
// 좌우로 넘기는 스크롤은 확대 제스처(드래그)와 겹쳐서 두지 않고, 아래 작은 사진을 눌러 바꾼다.
// Modal은 앱 루트 밖에 따로 그려져 제스처 루트를 다시 감싸야 확대 제스처가 동작한다
export default function LibraryPhotoViewer({
  photoIds,
  index,
  onChangeIndex,
  onClose,
}: {
  photoIds: string[];
  // 보고 있는 사진 순번. null이면 닫혀 있다
  index: number | null;
  onChangeIndex: (index: number) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const photoId = index === null ? null : photoIds[index];

  return (
    <Modal visible={photoId != null} animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView className="flex-1 bg-black">
        {photoId && (
          <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
            <View className="h-12 flex-row items-center justify-between px-4">
              <Text className="text-white text-body05">
                {(index ?? 0) + 1} / {photoIds.length}
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="사진 닫기"
                hitSlop={8}
                onPress={onClose}
                className="h-8 w-8 items-center justify-center rounded-full bg-white/15"
              >
                <XIcon size={16} className="text-white" />
              </TouchableOpacity>
            </View>

            <ZoomableMedia resetKey={photoId} onZoomActiveChange={noop} onZoomedChange={noop}>
              <FullPhoto id={photoId} />
            </ZoomableMedia>

            {photoIds.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="grow-0"
                contentContainerStyle={{ gap: 6, padding: 12 }}
              >
                {photoIds.map((id, photoIndex) => (
                  <TouchableOpacity
                    key={id}
                    accessibilityRole="button"
                    accessibilityLabel={`${photoIndex + 1}번째 사진 보기`}
                    onPress={() => onChangeIndex(photoIndex)}
                    className={cn(
                      'h-14 w-14 overflow-hidden rounded-lg border-2',
                      photoIndex === index ? 'border-white' : 'border-transparent opacity-60'
                    )}
                  >
                    <Thumbnail id={id} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

function noop() {}

function FullPhoto({ id }: { id: string }) {
  const uri = useLibraryPhotoUri(id);
  if (!uri) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }
  return <Image source={{ uri }} className="h-full w-full" resizeMode="contain" />;
}

function Thumbnail({ id }: { id: string }) {
  const uri = useLibraryPhotoUri(id);
  return uri ? (
    <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />
  ) : (
    <View className="h-full w-full bg-grey-80" />
  );
}
