import { ExternalLinkIcon, XIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { openLink } from '@/lib/open-link';
import { TouchableOpacity, View } from 'react-native';

// 네이버 지도 기본 글자(가게·장소)를 눌렀는데 우리 DB에 없는 곳일 때.
// 이름만 알 수 있어서 네이버 지도 검색으로 넘겨 준다 (네이버 장소 정보는 약관상 우리 앱에 가져와 보여줄 수 없다)
export default function UnknownPlaceSheet({
  caption,
  onClose,
}: {
  caption: string;
  onClose: () => void;
}) {
  return (
    <View className="gap-4 px-4 pb-6">
      <View className="flex-row items-start">
        <View className="flex-1 gap-1">
          <Text className="text-black text-title03" numberOfLines={2}>
            {caption}
          </Text>
          <Text className="text-grey-60 text-caption02">띵고에 아직 정보가 없는 곳이에요</Text>
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

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => openLink(`https://map.naver.com/p/search/${encodeURIComponent(caption)}`)}
        className="h-11 flex-row items-center justify-center gap-1.5 rounded-xl bg-grey-02"
      >
        <Text className="text-grey-80 text-body04">네이버 지도에서 보기</Text>
        <ExternalLinkIcon size={14} className="text-grey-60" />
      </TouchableOpacity>
    </View>
  );
}
