import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { PlacePhotosStatus } from '@/hooks/use-place-photos';
import { REVIEW_PIN_COLOR } from '@/components/naver-map/building-label';
import { Images, X } from 'lucide-react-native';
import { ActivityIndicator, Pressable, View } from 'react-native';

const BUTTON_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 6,
  elevation: 4,
};

const BUTTON_CLASS = 'absolute left-4 h-9 flex-row items-center gap-1 rounded-full px-3';

// 지도 왼쪽 아래 작은 버튼. 내 사진첩으로 찾은 "다녀온 곳" 핀을 켜고 끈다 (iOS 전용)
// 핀은 기본으로 꺼져 있고 이 버튼을 눌렀을 때만 지도에 뜬다
// - 아직 권한을 묻지 않음: 누르면 사진 권한을 묻고, 허용하면 핀을 켠다 (지도를 열자마자 팝업을 띄우지 않으려고 버튼으로 둔다)
// - 핀 꺼짐: 흰 버튼 "다녀온 곳 N", 누르면 핀을 켠다
// - 핀 켜짐: 다홍 버튼 "다녀온 곳 N ×", 누르면 핀을 끈다
export default function VisitedPlacesButton({
  status,
  count,
  isFetching,
  pinsShown,
  bottom,
  onFind,
  onTogglePins,
}: {
  status: PlacePhotosStatus;
  count: number;
  isFetching: boolean;
  pinsShown: boolean;
  bottom: number;
  onFind: () => void;
  onTogglePins: () => void;
}) {
  // 오른쪽 현위치 버튼과 세로 가운데를 맞춘다
  const style = [BUTTON_SHADOW, { bottom: bottom + 6 }];

  if (status === 'undetermined') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="내 사진으로 다녀온 곳 찾기"
        onPress={onFind}
        className={`${BUTTON_CLASS} bg-white active:opacity-80`}
        style={style}
      >
        <Icon as={Images} size={14} color={REVIEW_PIN_COLOR} />
        <Text className="text-grey-80 text-caption01">다녀온 곳 찾기</Text>
      </Pressable>
    );
  }

  if (status !== 'granted') return null;

  if (count === 0) {
    if (!isFetching) return null;
    return (
      <View className={`${BUTTON_CLASS} bg-white`} style={style}>
        <ActivityIndicator size="small" />
        <Text className="text-grey-60 text-caption01">찾는 중</Text>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={pinsShown ? '다녀온 곳 핀 숨기기' : `다녀온 곳 ${count}곳 지도에 보기`}
      accessibilityState={{ selected: pinsShown }}
      onPress={onTogglePins}
      className={`${BUTTON_CLASS} active:opacity-80 ${pinsShown ? '' : 'bg-white'}`}
      style={[style, pinsShown && { backgroundColor: REVIEW_PIN_COLOR }]}
    >
      <Icon as={Images} size={14} color={pinsShown ? '#FFFFFF' : REVIEW_PIN_COLOR} />
      <Text className={`text-caption01 ${pinsShown ? 'text-white' : 'text-grey-80'}`}>
        다녀온 곳 {count}
      </Text>
      {pinsShown && <Icon as={X} size={14} color="#FFFFFF" />}
    </Pressable>
  );
}
