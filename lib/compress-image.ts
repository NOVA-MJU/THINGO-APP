import * as FileSystem from 'expo-file-system/legacy';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_BYTES = 1 * 1024 * 1024; // 1MB

type CompressResult = {
  uri: string;
  size: number;
};

type CompressStep = {
  maxSide: number;
  quality: number;
};

const STEPS: CompressStep[] = [
  { maxSide: 1920, quality: 0.6 },
  { maxSide: 1080, quality: 0.6 },
  { maxSide: 720, quality: 0.6 },
];

function getResizeOption(
  originWidth: number,
  originHeight: number,
  maxSide: number
): { width: number } | { height: number } {
  return originWidth >= originHeight ? { width: maxSide } : { height: maxSide };
}

async function getFileSize(uri: string): Promise<number> {
  const fileInfo = await FileSystem.getInfoAsync(uri);
  return fileInfo.exists && typeof fileInfo.size === 'number' ? fileInfo.size : 0;
}

type ImageDimensions = { width: number; height: number };

export async function compressImageToJpeg(
  uri: string,
  originDimensions: ImageDimensions
): Promise<CompressResult> {
  const { width: originWidth, height: originHeight } = originDimensions;

  for (const { maxSide, quality } of STEPS) {
    const resizeOption = getResizeOption(originWidth, originHeight, maxSide);
    const imageRef = await ImageManipulator.manipulate(uri).resize(resizeOption).renderAsync();
    const result = await imageRef.saveAsync({ compress: quality, format: SaveFormat.JPEG });

    const size = await getFileSize(result.uri);
    if (size <= MAX_BYTES) {
      return { uri: result.uri, size };
    }
  }

  throw new Error('이미지 크기를 1MB 이하로 줄일 수 없습니다. 다른 이미지를 선택해주세요.');
}
