import { ArrowLeftIcon } from '@/components/icons';
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
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

// 사진 위에 올리는 글자·아이콘이 밝은 사진에서도 읽히게 까는 그림자
const OVERLAY_TEXT_SHADOW = {
  textShadowColor: 'rgba(0, 0, 0, 0.55)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 4,
};

// 내 사진첩 사진을 화면 가득(전체 화면) 크게 본다. 사진은 자르지 않고 원본 비율 그대로(4:3, 16:9 모두) 화면에 맞춘다.
// 두 손가락으로 벌리거나 두 번 눌러 확대하고, 확대하지 않은 상태에서 좌우로 밀면 이전·다음 사진으로 넘어간다.
// 맨 위 한 줄: 왼쪽 뒤로 가기, 오른쪽 "N 완료"(고를 수 있을 때). 고르기 동그라미(고른 순번)는 사진 안 오른쪽 위에 얹는다.
// 맨 아래: 작은 사진 줄과 "5 / 6" 순번. 위아래 옅은 검은 그라데이션과 글자 그림자로 밝은 사진에서도 읽히게 한다.
// Modal은 앱 루트 밖에 따로 그려져 제스처 루트를 다시 감싸야 확대 제스처가 동작한다.
// selectedIds·onToggleSelect를 넘기면 카카오톡 사진 보내기처럼 크게 본 채로 고르고 "완료"로 닫는다
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
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const photoId = index === null ? null : photoIds[index];
  const canSelect = selectedIds != null && onToggleSelect != null;
  const selectedOrder = photoId && selectedIds ? selectedIds.indexOf(photoId) + 1 : 0;
  // 지금 사진의 원본 크기 (그려진 뒤 알 수 있다). 고르기 동그라미를 화면 모서리가 아니라 사진 안 오른쪽 위에 두려고 잰다
  const [photoSize, setPhotoSize] = React.useState<{ id: string; width: number; height: number }>();
  const fitScale =
    photoSize?.id === photoId
      ? Math.min(screenWidth / photoSize.width, screenHeight / photoSize.height)
      : null;
  const photoRight = fitScale ? (screenWidth - photoSize!.width * fitScale) / 2 : 0;
  const photoTop = fitScale ? (screenHeight - photoSize!.height * fitScale) / 2 : 0;
  const topBarBottom = insets.top + 6 + 44;

  function showNeighbor(direction: 'previous' | 'next') {
    if (index === null) return;
    const nextIndex = direction === 'next' ? index + 1 : index - 1;
    if (nextIndex >= 0 && nextIndex < photoIds.length) onChangeIndex(nextIndex);
  }

  return (
    <Modal visible={photoId != null} animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView className="flex-1 bg-black">
        {photoId && (
          <View className="flex-1">
            <ZoomableMedia
              resetKey={photoId}
              onZoomActiveChange={noop}
              onZoomedChange={noop}
              onSwipe={showNeighbor}
            >
              <FullPhoto
                id={photoId}
                onSize={(width, height) => setPhotoSize({ id: photoId, width, height })}
              />
            </ZoomableMedia>

            <EdgeGradient position="top" height={insets.top + 72} />
            <EdgeGradient position="bottom" height={insets.bottom + 150} />

            <View
              pointerEvents="box-none"
              className="absolute left-0 right-0 flex-row items-center justify-between px-3"
              style={{ top: insets.top + 6, height: 44 }}
            >
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="뒤로 가기"
                hitSlop={12}
                onPress={onClose}
                className="h-10 w-10 items-center justify-center"
              >
                <ArrowLeftIcon size={24} className="text-white" />
              </TouchableOpacity>
              {canSelect && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`${selectedIds.length}장 고르고 완료`}
                  hitSlop={8}
                  onPress={onClose}
                  className="h-9 flex-row items-center gap-1.5 rounded-full bg-mju-primary pl-2 pr-4"
                >
                  <View className="h-5 items-center justify-center rounded-full bg-white px-1.5">
                    <Text className="text-mju-primary text-caption01">{selectedIds.length}</Text>
                  </View>
                  <Text className="text-white text-body04">완료</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 고르기 동그라미: 사진 안 오른쪽 위 (사진이 맨 위까지 차면 윗줄 바로 아래) */}
            {canSelect && (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selectedOrder > 0 }}
                accessibilityLabel="리뷰에 올릴 사진으로 고르기"
                hitSlop={12}
                onPress={() => onToggleSelect(photoId)}
                className={cn(
                  'absolute h-8 w-8 items-center justify-center rounded-full border-2 border-white',
                  selectedOrder > 0 ? 'bg-mju-primary' : 'bg-black/25'
                )}
                style={{ right: photoRight + 12, top: Math.max(photoTop + 12, topBarBottom + 8) }}
              >
                {selectedOrder > 0 && (
                  <Text className="text-white text-caption01">{selectedOrder}</Text>
                )}
              </Pressable>
            )}

            <View
              pointerEvents="box-none"
              className="absolute bottom-0 left-0 right-0"
              style={{ paddingBottom: insets.bottom + 8 }}
            >
              {photoIds.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="grow-0"
                  contentContainerStyle={{ gap: 6, paddingHorizontal: 16, paddingBottom: 10 }}
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

              <View className="h-9 items-center justify-center px-4">
                <Text className="text-white text-body05" style={OVERLAY_TEXT_SHADOW}>
                  {(index ?? 0) + 1} / {photoIds.length}
                </Text>
              </View>
            </View>
          </View>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

function noop() {}

// 사진 위·아래 끝에 까는 옅은 검은 그라데이션 (글자·버튼이 밝은 사진 위에서도 보이게)
function EdgeGradient({ position, height }: { position: 'top' | 'bottom'; height: number }) {
  const gradientId = `library-photo-${position}-gradient`;
  return (
    <View
      pointerEvents="none"
      style={[styles.edgeGradient, position === 'top' ? { top: 0 } : { bottom: 0 }, { height }]}
    >
      <Svg height="100%" width="100%">
        <Defs>
          <LinearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor="#000000" stopOpacity={position === 'top' ? 0.45 : 0} />
            <Stop offset="1" stopColor="#000000" stopOpacity={position === 'top' ? 0 : 0.55} />
          </LinearGradient>
        </Defs>
        <Rect fill={`url(#${gradientId})`} height="100%" width="100%" x="0" y="0" />
      </Svg>
    </View>
  );
}

function FullPhoto({
  id,
  onSize,
}: {
  id: string;
  onSize: (width: number, height: number) => void;
}) {
  const uri = useLibraryPhotoUri(id);
  if (!uri) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      className="h-full w-full"
      resizeMode="contain"
      onLoad={(event) => onSize(event.nativeEvent.source.width, event.nativeEvent.source.height)}
    />
  );
}

function Thumbnail({ id }: { id: string }) {
  const uri = useLibraryPhotoUri(id);
  return uri ? (
    <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />
  ) : (
    <View className="h-full w-full bg-grey-80" />
  );
}

const styles = StyleSheet.create({
  edgeGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
