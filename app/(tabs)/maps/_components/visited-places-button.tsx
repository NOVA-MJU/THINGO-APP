import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { PlacePhotosStatus } from '@/hooks/use-place-photos';
import { REVIEW_PIN_COLOR } from '@/components/naver-map/building-label';
import { Images } from 'lucide-react-native';
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
// - 다녀온 곳이 있음: 누르면 가장 최근에 다녀온 곳 상세를 연다
export default function VisitedPlacesButton({
  status,
  count,
  isFetching,
  bottom,
  onFind,
  onOpen,
}: {
  status: PlacePhotosStatus;
  count: number;
  isFetching: boolean;
  bottom: number;
  onFind: () => void;
  onOpen: () => void;
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

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`리뷰 남길 곳 ${count}곳, 가장 최근에 다녀온 곳 보기`}
      onPress={onOpen}
      className="absolute left-4 h-11 flex-row items-center gap-1.5 rounded-full px-4 active:opacity-80"
      style={[BUTTON_SHADOW, { bottom: bottom + 2, backgroundColor: REVIEW_PIN_COLOR }]}
    >
      <Icon as={Images} size={16} className="text-white" />
      <Text className="text-white text-caption01">다녀온 곳 {count}곳, 리뷰 남겨볼까요?</Text>
    </Pressable>
  );
}
