import { XIcon } from '@/components/icons';
import { ZoomableMedia } from '@/components/maps/reviews/zoomable-media';
import { Text } from '@/components/ui/text';
import { useLibraryPhotoUri } from '@/hooks/use-place-photos';
import { cn } from '@/lib/utils';
import * as React from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 내 사진첩 사진을 화면 가득 크게 본다. 두 손가락으로 벌리거나 두 번 눌러 확대한다.
// 좌우로 넘기는 스크롤은 확대 제스처(드래그)와 겹쳐서 두지 않고, 아래 작은 사진을 눌러 바꾼다.
// Modal은 앱 루트 밖에 따로 그려져 제스처 루트를 다시 감싸야 확대 제스처가 동작한다.
// selectedIds·onToggleSelect를 넘기면 카카오톡 사진 보내기처럼 크게 본 채로 오른쪽 위 동그라미(고른 순번)로 고르고,
// 아래 "N장 선택 · 완료"로 닫는다
export default function LibraryPhotoViewer({
  photoIds,
  index,
  onChangeIndex,
  onClose,
  selectedIds,
  onToggleSelect,
}: {
  photoIds: string[];
  // 보고 있는 사진 순번. null이면 닫혀 있다
  index: number | null;
  onChangeIndex: (index: number) => void;
  onClose: () => void;
  // 고른 사진 (리뷰에 올라갈 순서)
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const photoId = index === null ? null : photoIds[index];
  const canSelect = selectedIds != null && onToggleSelect != null;
  const selectedOrder = photoId && selectedIds ? selectedIds.indexOf(photoId) + 1 : 0;

  return (
    <Modal visible={photoId != null} animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView className="flex-1 bg-black">
        {photoId && (
          <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
            <View className="h-12 flex-row items-center justify-between px-4">
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="사진 닫기"
                hitSlop={8}
                onPress={onClose}
                className="h-8 w-8 items-center justify-center rounded-full bg-white/15"
              >
                <XIcon size={16} className="text-white" />
              </TouchableOpacity>
              <Text className="text-white text-body05">
                {(index ?? 0) + 1} / {photoIds.length}
              </Text>
              {canSelect ? (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selectedOrder > 0 }}
                  accessibilityLabel="리뷰에 올릴 사진으로 고르기"
                  hitSlop={10}
                  onPress={() => onToggleSelect(photoId)}
                  className={cn(
                    'h-8 w-8 items-center justify-center rounded-full border-2 border-white',
                    selectedOrder > 0 ? 'bg-mju-primary' : 'bg-black/30'
                  )}
                >
                  {selectedOrder > 0 && (
                    <Text className="text-white text-caption01">{selectedOrder}</Text>
                  )}
                </Pressable>
              ) : (
                <View className="h-8 w-8" />
              )}
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
                    {selectedIds?.includes(id) && (
                      <View className="absolute right-0.5 top-0.5 h-4 w-4 items-center justify-center rounded-full bg-mju-primary">
                        <Text className="text-[10px] text-white">
                          {selectedIds.indexOf(id) + 1}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {canSelect && (
              <View className="flex-row items-center justify-between px-4 pb-2">
                <Text className="text-white text-body05">{selectedIds.length}장 선택</Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={onClose}
                  className="h-10 justify-center rounded-full bg-mju-primary px-5"
                >
                  <Text className="text-white text-body04">완료</Text>
                </TouchableOpacity>
              </View>
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
