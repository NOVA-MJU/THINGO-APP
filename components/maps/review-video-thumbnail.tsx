import { Text } from '@/components/ui/text';
import { FilmIcon, PlayIcon } from 'lucide-react-native';
import { Image, View } from 'react-native';

type ReviewVideoThumbnailProps = {
  uri: string;
  thumbnailUrl?: string | null;
  label?: string;
};

export function ReviewVideoThumbnail({ thumbnailUrl, label = '영상' }: ReviewVideoThumbnailProps) {
  return (
    <View className="h-full w-full overflow-hidden bg-[#111217]">
      {thumbnailUrl ? (
        <>
          <Image
            source={{ uri: thumbnailUrl }}
            className="h-full w-full"
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
          <VideoPlayOverlay />
        </>
      ) : (
        <View className="absolute inset-0 items-center justify-center bg-[#111217]">
          <FilmIcon size={22} color="#FFFFFF" />
          <View className="mt-1 flex-row items-center gap-1">
            <PlayIcon size={10} color="#FFFFFF" fill="#FFFFFF" />
            <Text className="text-white text-caption04">{label}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function VideoPlayOverlay() {
  return (
    <View className="absolute inset-0 items-center justify-center bg-black/15">
      <View className="h-6 w-6 items-center justify-center rounded-full bg-black/35">
        <PlayIcon size={12} color="#FFFFFF" fill="#FFFFFF" />
      </View>
    </View>
  );
}
