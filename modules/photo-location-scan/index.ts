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
};

// iOS 네이티브 모듈. 웹·안드로이드에는 없어서 null이다
export default requireOptionalNativeModule<PhotoLocationScanModule>('PhotoLocationScan');
