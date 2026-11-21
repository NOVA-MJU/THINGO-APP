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
  StyleSheet,
  TouchableOpacity,
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

// 내 사진첩 사진을 화면 가득(전체 화면) 크게 본다. 두 손가락으로 벌리거나 두 번 눌러 확대한다.
// 닫기 X와 고르기 동그라미는 사진 위 맨 위에, 작은 사진 줄과 "5 / 6" 순번·완료는 사진 위 맨 아래에 얹는다
// (위아래에 옅은 검은 그라데이션과 글자 그림자를 깔아 밝은 사진에서도 읽히게 한다).
// 좌우로 넘기는 스크롤은 확대 제스처(드래그)와 겹쳐서 두지 않고, 아래 작은 사진을 눌러 바꾼다.
// Modal은 앱 루트 밖에 따로 그려져 제스처 루트를 다시 감싸야 확대 제스처가 동작한다.
// selectedIds·onToggleSelect를 넘기면 카카오톡 사진 보내기처럼 크게 본 채로 오른쪽 위 동그라미(고른 순번)로 고르고,
// 아래 "완료"로 닫는다
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
          <View className="flex-1">
            <ZoomableMedia resetKey={photoId} onZoomActiveChange={noop} onZoomedChange={noop}>
              <FullPhoto id={photoId} />
            </ZoomableMedia>

            <EdgeGradient position="top" height={insets.top + 72} />
            <EdgeGradient position="bottom" height={insets.bottom + 150} />

            <View
              pointerEvents="box-none"
              className="absolute left-0 right-0 flex-row items-center justify-between px-4"
              style={{ top: insets.top + 6, height: 44 }}
            >
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="사진 닫기"
                hitSlop={12}
                onPress={onClose}
                className="h-9 w-9 items-center justify-center"
              >
                <XIcon size={24} className="text-white" />
              </TouchableOpacity>
              {canSelect && (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selectedOrder > 0 }}
                  accessibilityLabel="리뷰에 올릴 사진으로 고르기"
                  hitSlop={12}
                  onPress={() => onToggleSelect(photoId)}
                  className={cn(
                    'h-8 w-8 items-center justify-center rounded-full border-2 border-white',
                    selectedOrder > 0 ? 'bg-mju-primary' : 'bg-black/25'
                  )}
                >
                  {selectedOrder > 0 && (
                    <Text className="text-white text-caption01">{selectedOrder}</Text>
                  )}
                </Pressable>
              )}
            </View>

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

              <View className="h-11 flex-row items-center justify-between px-4">
                <Text className="text-white text-body05" style={OVERLAY_TEXT_SHADOW}>
                  {(index ?? 0) + 1} / {photoIds.length}
                </Text>
                {canSelect && (
                  <View className="flex-row items-center gap-3">
                    <Text className="text-white text-body05" style={OVERLAY_TEXT_SHADOW}>
                      {selectedIds.length}장 선택
                    </Text>
                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={onClose}
                      className="h-9 justify-center rounded-full bg-mju-primary px-5"
                    >
                      <Text className="text-white text-body04">완료</Text>
                    </TouchableOpacity>
                  </View>
                )}
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

const styles = StyleSheet.create({
  edgeGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
