import { requireOptionalNativeModule } from 'expo';

export type ScannedPhoto = {
  id: string;
  takenAt: number;
  latitude: number;
  longitude: number;
  width: number;
  height: number;
};

type PhotoLocationScanModule = {
  findPhotosInBounds(
    minLatitude: number,
    maxLatitude: number,
    minLongitude: number,
    maxLongitude: number
  ): Promise<ScannedPhoto[]>;
  // 사진 id → 사진에 찍힌 것 라벨(Apple Vision 분류, 확신도 0.3 이상). 기기에 이미지가 없어 분류 못 한 사진은 빠진다
  classifyPhotos(ids: string[]): Promise<Record<string, string[]>>;
  // 서버 이미지(이미 올린 리뷰 사진) 주소 -> 같은 사진첩 사진 id (찾은 것만). 이 함수가 없는 예전 앱 빌드도 있어서 optional이다
  findPhotosMatchingImages?(ids: string[], imageUrls: string[]): Promise<Record<string, string>>;
};

// iOS 네이티브 모듈. 웹·안드로이드에는 없어서 null이다
export default requireOptionalNativeModule<PhotoLocationScanModule>('PhotoLocationScan');
