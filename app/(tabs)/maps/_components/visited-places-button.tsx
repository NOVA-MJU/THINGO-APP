import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { PlacePhotosStatus } from '@/hooks/use-place-photos';
import { REVIEW_PIN_COLOR } from '@/components/naver-map/building-label';
import { EyeOff, Images } from 'lucide-react-native';
import { ActivityIndicator, Pressable, View } from 'react-native';

const BUTTON_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.18,
  shadowRadius: 8,
  elevation: 5,
};

// 지도 왼쪽 아래 버튼. 내 사진첩으로 "다녀온 곳"을 찾게 하고, 찾았으면 리뷰 남길 곳 수를 보여준다 (iOS 전용)
// - 아직 권한을 묻지 않음: 누르면 사진 권한을 묻는다 (지도를 열자마자 팝업을 띄우지 않으려고 버튼으로 둔다)
// - 다녀온 곳이 있음: 누르면 가장 최근에 다녀온 곳 상세를 연다. 오른쪽 눈 버튼으로 지도 핀을 끈다
// - 핀을 끈 상태: 흰 버튼으로 줄어들고, 누르면 핀을 다시 켠다
export default function VisitedPlacesButton({
  status,
  count,
  isFetching,
  pinsHidden,
  bottom,
  onFind,
  onOpen,
  onTogglePins,
}: {
  status: PlacePhotosStatus;
  count: number;
  isFetching: boolean;
  pinsHidden: boolean;
  bottom: number;
  onFind: () => void;
  onOpen: () => void;
  onTogglePins: () => void;
}) {
  if (status === 'undetermined') {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onFind}
        className="absolute left-4 h-11 flex-row items-center gap-1.5 rounded-full bg-white px-4 active:opacity-80"
        style={[BUTTON_SHADOW, { bottom: bottom + 2 }]}
      >
        <Icon as={Images} size={16} color={REVIEW_PIN_COLOR} />
        <Text className="text-grey-80 text-caption01">내 사진으로 다녀온 곳 찾기</Text>
      </Pressable>
    );
  }

  if (status !== 'granted') return null;

  if (count === 0) {
    if (!isFetching) return null;
    return (
      <View
        className="absolute left-4 h-11 flex-row items-center gap-1.5 rounded-full bg-white px-4"
        style={[BUTTON_SHADOW, { bottom: bottom + 2 }]}
      >
        <ActivityIndicator size="small" />
        <Text className="text-grey-60 text-caption01">다녀온 곳 찾는 중</Text>
      </View>
    );
  }

  if (pinsHidden) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`다녀온 곳 ${count}곳 지도에 다시 보기`}
        onPress={onTogglePins}
        className="absolute left-4 h-11 flex-row items-center gap-1.5 rounded-full bg-white px-4 active:opacity-80"
        style={[BUTTON_SHADOW, { bottom: bottom + 2 }]}
      >
        <Icon as={Images} size={16} color={REVIEW_PIN_COLOR} />
        <Text className="text-grey-80 text-caption01">다녀온 곳 {count}곳 보기</Text>
      </Pressable>
    );
  }

  return (
    <View
      className="absolute left-4 h-11 flex-row items-center rounded-full"
      style={[BUTTON_SHADOW, { bottom: bottom + 2, backgroundColor: REVIEW_PIN_COLOR }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`리뷰 남길 곳 ${count}곳, 가장 최근에 다녀온 곳 보기`}
        onPress={onOpen}
        className="h-full flex-row items-center gap-1.5 pl-4 pr-3 active:opacity-80"
      >
        <Icon as={Images} size={16} className="text-white" />
        <Text className="text-white text-caption01">다녀온 곳 {count}곳, 리뷰 남겨볼까요?</Text>
      </Pressable>
      <View className="h-4 w-px bg-white/40" />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="다녀온 곳 핀 숨기기"
        hitSlop={4}
        onPress={onTogglePins}
        className="h-full items-center justify-center pl-2.5 pr-3.5 active:opacity-80"
      >
        <Icon as={EyeOff} size={16} className="text-white" />
      </Pressable>
    </View>
  );
}
