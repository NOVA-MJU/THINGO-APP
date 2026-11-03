import { Text } from '@/components/ui/text';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Image, TouchableOpacity, View } from 'react-native';

type ProfileImageFieldProps = {
  value: string | null;
  onChange: (url: string) => void;
};

// 가입 화면의 프로필 사진(선택) 칸. 고른 사진을 바로 올리고 주소를 알린다
export default function ProfileImageField({ value, onChange }: ProfileImageFieldProps) {
  const { isLoading: isUploadingImage, pickAndUpload } = useImageUpload('PROFILE_IMAGE');

  const handlePickProfileImage = async () => {
    const url = await pickAndUpload();
    if (url) onChange(url);
  };

  return (
    <>
      <View className="mt-4 flex-row items-center gap-1">
        <Text className="text-black text-title03">프로필 사진</Text>
        <Text className="text-grey-80 text-body02">(선택)</Text>
      </View>
      <View className="mt-2 rounded-xl bg-white p-4">
        <Text className="text-grey-80 text-body04">프로필</Text>
        <TouchableOpacity
          className="mt-2 self-start"
          onPress={handlePickProfileImage}
          disabled={isUploadingImage}
        >
          <View className="aspect-square w-[88px] items-center justify-center overflow-hidden rounded-xl border border-grey-10">
            {value ? (
              <Image source={{ uri: value }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <Text className="text-grey-20 text-caption02">
                {isUploadingImage ? '업로드 중...' : '이미지 업로드'}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </>
  );
}
