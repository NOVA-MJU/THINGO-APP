import { type UploadDomain, uploadFile, uploadImage } from '@/api/upload';
import { compressImageToJpeg } from '@/lib/compress-image';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { Platform } from 'react-native';

type ImageUploadState = {
  isLoading: boolean;
  imageUrl: string | null;
  error: string | null;
};

type MediaUploadState = {
  isLoading: boolean;
  url: string | null;
  error: string | null;
};

export type UploadedMedia = {
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string | null;
};

const MAX_VIDEO_UPLOAD_BYTES = 50 * 1024 * 1024;
const VIDEO_THUMBNAIL_TIME_MS = 500;
const VIDEO_THUMBNAIL_MAX_SIZE = 720;

const IMAGE_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: false,
  quality: 1,
};

const MEDIA_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images', 'videos'],
  allowsEditing: false,
  quality: 1,
  videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
  videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
};

function getImagePickerOptions(): ImagePicker.ImagePickerOptions {
  return {
    ...IMAGE_PICKER_OPTIONS,
  };
}

function getMediaPickerOptions(): ImagePicker.ImagePickerOptions {
  return {
    ...MEDIA_PICKER_OPTIONS,
  };
}

export function useImageUpload(domain: UploadDomain) {
  const isPickingRef = useRef(false);
  const [state, setState] = useState<ImageUploadState>({
    isLoading: false,
    imageUrl: null,
    error: null,
  });

  async function pickAndUpload(): Promise<string | null> {
    if (isPickingRef.current) return null;

    isPickingRef.current = true;

    try {
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
        err instanceof Error ? getUploadErrorMessage(err) : '이미지 업로드에 실패했습니다.';
      setState({ isLoading: false, imageUrl: null, error: message });
      return null;
    } finally {
      isPickingRef.current = false;
    }
  }

  return { ...state, pickAndUpload };
}

export function useMediaUpload(domain: UploadDomain) {
  const isPickingRef = useRef(false);
  const [state, setState] = useState<MediaUploadState>({
    isLoading: false,
    url: null,
    error: null,
  });

  async function pickAndUpload(): Promise<UploadedMedia | null> {
    if (isPickingRef.current) return null;

    isPickingRef.current = true;

    try {
      const picked = await ImagePicker.launchImageLibraryAsync(getMediaPickerOptions());
      if (picked.canceled) return null;

      const asset = picked.assets[0];
      const mediaType = getPickedMediaType(asset);
      validatePickedMedia(asset, mediaType);
      setState({ isLoading: true, url: null, error: null });

      if (mediaType === 'video') {
        const cdnUrl = await uploadFile({
          uri: asset.uri,
          domain,
          fileName: getUploadFileName(asset, 'video'),
          mimeType: getVideoMimeType(asset.fileName, asset.mimeType),
          file: Platform.OS === 'web' ? asset.file : null,
        });
        const thumbnailUrl = await createAndUploadVideoThumbnail(asset, domain);
        setState({ isLoading: false, url: cdnUrl, error: null });
        return { url: cdnUrl, type: 'video', thumbnailUrl };
      }

      const { uri } = await compressImageToJpeg(asset.uri, {
        width: asset.width,
        height: asset.height,
      });
      const cdnUrl = await uploadImage(uri, domain);
      setState({ isLoading: false, url: cdnUrl, error: null });
      return { url: cdnUrl, type: 'image' };
    } catch (err) {
      const message =
        err instanceof Error ? getUploadErrorMessage(err) : '사진/영상 업로드에 실패했습니다.';
      setState({ isLoading: false, url: null, error: message });
      return null;
    } finally {
      isPickingRef.current = false;
    }
  }

  return { ...state, pickAndUpload };
}

function validatePickedMedia(
  asset: ImagePicker.ImagePickerAsset,
  mediaType: UploadedMedia['type']
) {
  if (mediaType !== 'video') return;

  const fileSize = asset.fileSize ?? asset.file?.size;
  if (fileSize && fileSize > MAX_VIDEO_UPLOAD_BYTES) {
    throw new Error(
      `영상 용량은 최대 ${formatFileSize(MAX_VIDEO_UPLOAD_BYTES)}까지 업로드할 수 있습니다. 더 짧거나 용량이 작은 영상으로 다시 시도해주세요.`
    );
  }
}

async function createAndUploadVideoThumbnail(
  asset: ImagePicker.ImagePickerAsset,
  domain: UploadDomain
) {
  try {
    const thumbnail = await createVideoThumbnail(asset);
    if (!thumbnail) return null;

    return uploadFile({
      uri: thumbnail.uri,
      domain,
      fileName: thumbnail.fileName,
      mimeType: 'image/jpeg',
      file: thumbnail.file,
    });
  } catch {
    return null;
  }
}

async function createVideoThumbnail(asset: ImagePicker.ImagePickerAsset) {
  if (Platform.OS === 'web') return createWebVideoThumbnail(asset);

  const VideoThumbnails = await import('expo-video-thumbnails');
  const { uri } = await VideoThumbnails.getThumbnailAsync(asset.uri, {
    time: VIDEO_THUMBNAIL_TIME_MS,
    quality: 0.85,
  });

  return {
    uri,
    fileName: createThumbnailFileName(asset.fileName),
    file: null,
  };
}

function createWebVideoThumbnail(asset: ImagePicker.ImagePickerAsset) {
  if (!asset.file || typeof document === 'undefined' || typeof URL === 'undefined') {
    return Promise.resolve(null);
  }

  const objectUrl = URL.createObjectURL(asset.file);

  return new Promise<{ uri: string; fileName: string; file: Blob } | null>((resolve) => {
    const video = document.createElement('video');
    const timeoutId = window.setTimeout(() => finish(null), 10_000);
    let didFinish = false;

    function finish(result: { uri: string; fileName: string; file: Blob } | null) {
      if (didFinish) return;
      didFinish = true;
      window.clearTimeout(timeoutId);
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(objectUrl);
      resolve(result);
    }

    function captureThumbnail() {
      const { width, height } = getThumbnailCanvasSize(video.videoWidth, video.videoHeight);
      if (!width || !height) {
        finish(null);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')?.drawImage(video, 0, 0, width, height);
      canvas.toBlob(
        (blob) =>
          finish(
            blob
              ? {
                  uri: '',
                  fileName: createThumbnailFileName(asset.fileName),
                  file: blob,
                }
              : null
          ),
        'image/jpeg',
        0.85
      );
    }

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.onerror = () => finish(null);
    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const targetTime = Math.min(VIDEO_THUMBNAIL_TIME_MS / 1000, Math.max(duration / 2, 0));
      if (targetTime <= 0) {
        captureThumbnail();
        return;
      }
      video.currentTime = targetTime;
    };
    video.onseeked = captureThumbnail;
    video.src = objectUrl;
  });
}

function getThumbnailCanvasSize(videoWidth: number, videoHeight: number) {
  if (!videoWidth || !videoHeight) return { width: 0, height: 0 };

  const scale = Math.min(1, VIDEO_THUMBNAIL_MAX_SIZE / Math.max(videoWidth, videoHeight));
  return {
    width: Math.round(videoWidth * scale),
    height: Math.round(videoHeight * scale),
  };
}

function createThumbnailFileName(fileName?: string | null) {
  const baseName = fileName?.replace(/\.[^.]+$/, '') || 'video-thumbnail';
  return `${baseName}-thumbnail.jpg`;
}

function isImagePickerFileWriteError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes('ExponentImagePicker.launchImageLibraryAsync') &&
    error.message.includes('Failed to write a file')
  );
}

function getUploadErrorMessage(error: Error) {
  if (isImagePickerFileWriteError(error)) {
    return '파일을 불러오지 못했습니다. 다른 파일을 선택하거나 앱을 다시 실행한 뒤 다시 시도해주세요.';
  }

  if (error.message === 'Failed to fetch') {
    return '업로드 요청에 실패했습니다. 파일 용량을 줄이거나 네트워크 상태를 확인해주세요.';
  }

  return error.message;
}

function getPickedMediaType(asset: ImagePicker.ImagePickerAsset): UploadedMedia['type'] {
  if (asset.type === 'video') return 'video';
  if (asset.mimeType?.startsWith('video/')) return 'video';

  const extension = asset.fileName?.split('.').pop()?.toLowerCase();
  if (extension && ['mp4', 'mov', 'm4v', 'webm'].includes(extension)) return 'video';

  return 'image';
}

function getUploadFileName(asset: ImagePicker.ImagePickerAsset, mediaType: UploadedMedia['type']) {
  if (asset.fileName && /\.[a-z0-9]+$/i.test(asset.fileName)) return asset.fileName;
  return mediaType === 'video' ? 'upload.mp4' : 'upload.jpg';
}

function getVideoMimeType(fileName?: string | null, mimeType?: string | null) {
  if (mimeType?.startsWith('video/')) return mimeType;

  const extension = fileName?.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'mov':
      return 'video/quicktime';
    case 'm4v':
      return 'video/x-m4v';
    case 'webm':
      return 'video/webm';
    default:
      return 'video/mp4';
  }
}

function formatFileSize(bytes: number) {
  return `${Math.round(bytes / 1024 / 1024)}MB`;
}
