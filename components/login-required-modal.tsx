import { Text } from '@/components/ui/text';
import { Platform, Pressable, Modal as RNModal, View, useWindowDimensions } from 'react-native';

type LoginRequiredModalProps = {
  visible: boolean;
  onCancel: () => void;
  onLogin: () => void;
};

export function LoginRequiredModal({ visible, onCancel, onLogin }: LoginRequiredModalProps) {
  const { width } = useWindowDimensions();
  const modalWidth = Math.min(width - 40, 320);
  const androidTextAdjust =
    Platform.OS === 'android'
      ? { includeFontPadding: false, transform: [{ translateY: -1 }] }
      : undefined;

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/40 px-5">
        <View
          className="items-center gap-4 rounded-[12px] border-2 border-grey-02 bg-white p-5"
          style={{ width: modalWidth }}
        >
          <Text className="text-center text-grey-80 text-body04" style={androidTextAdjust}>
            로그인이 필요한 서비스입니다.
          </Text>

          <View className="h-9 w-full flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="로그인 필요 모달 취소"
              className="h-9 flex-1 items-center justify-center rounded-[8px] border border-grey-10 bg-white active:opacity-70"
              onPress={onCancel}
            >
              <Text className="text-grey-40 text-body05" style={androidTextAdjust}>
                취소
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="로그인 화면으로 이동"
              className="h-9 flex-1 items-center justify-center rounded-[8px] bg-blue-35 active:opacity-80"
              onPress={onLogin}
            >
              <Text className="text-white text-body05" style={androidTextAdjust}>
                로그인
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </RNModal>
  );
}
