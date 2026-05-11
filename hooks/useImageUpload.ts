import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { compressImageToJpeg } from '@/lib/compress-image';
import { type UploadDomain, uploadImage } from '@/api/upload';

type State = {
  isLoading: boolean;
  imageUrl: string | null;
  error: string | null;
};

export function useImageUpload(domain: UploadDomain) {
  const [state, setState] = useState<State>({
    isLoading: false,
    imageUrl: null,
    error: null,
  });

  async function pickAndUpload(): Promise<string | null> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setState((prev) => ({ ...prev, error: '갤러리 접근 권한이 필요합니다.' }));
      return null;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (picked.canceled) return null;

    const asset = picked.assets[0];
    setState({ isLoading: true, imageUrl: null, error: null });

    try {
      const { uri } = await compressImageToJpeg(asset.uri, {
        width: asset.width,
        height: asset.height,
      });
      const cdnUrl = await uploadImage(uri, domain);
      setState({ isLoading: false, imageUrl: cdnUrl, error: null });
      return cdnUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.';
      setState({ isLoading: false, imageUrl: null, error: message });
      return null;
    }
  }

  return { ...state, pickAndUpload };
}
