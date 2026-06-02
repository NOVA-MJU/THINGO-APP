import { type UploadDomain, uploadImage } from '@/api/upload';
import { compressImageToJpeg } from '@/lib/compress-image';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { Platform } from 'react-native';

type State = {
  isLoading: boolean;
  imageUrl: string | null;
  error: string | null;
};

const IMAGE_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: false,
  quality: 1,
};

function getImagePickerOptions(): ImagePicker.ImagePickerOptions {
  return {
    ...IMAGE_PICKER_OPTIONS,
    legacy: Platform.OS === 'android',
  };
}

export function useImageUpload(domain: UploadDomain) {
  const isPickingRef = useRef(false);
  const [state, setState] = useState<State>({
    isLoading: false,
    imageUrl: null,
    error: null,
  });

  async function pickAndUpload(): Promise<string | null> {
    if (isPickingRef.current) return null;

    isPickingRef.current = true;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setState((prev) => ({ ...prev, error: '갤러리 접근 권한이 필요합니다.' }));
        return null;
      }

      const picked = await ImagePicker.launchImageLibraryAsync(getImagePickerOptions());
      if (picked.canceled) return null;

      const asset = picked.assets[0];
      setState({ isLoading: true, imageUrl: null, error: null });

      const { uri } = await compressImageToJpeg(asset.uri, {
        width: asset.width,
        height: asset.height,
      });

      const cdnUrl = await uploadImage(uri, domain);
      setState({ isLoading: false, imageUrl: cdnUrl, error: null });
      return cdnUrl;
    } catch (err) {
      const message =
        err instanceof Error ? getImageUploadErrorMessage(err) : '이미지 업로드에 실패했습니다.';
      setState({ isLoading: false, imageUrl: null, error: message });
      return null;
    } finally {
      isPickingRef.current = false;
    }
  }

  return { ...state, pickAndUpload };
}

function isImagePickerFileWriteError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes('ExponentImagePicker.launchImageLibraryAsync') &&
    error.message.includes('Failed to write a file')
  );
}

function getImageUploadErrorMessage(error: Error) {
  if (isImagePickerFileWriteError(error)) {
    return '이미지를 불러오지 못했습니다. 다른 이미지를 선택하거나 앱을 다시 실행한 뒤 다시 시도해주세요.';
  }

  return error.message;
}
