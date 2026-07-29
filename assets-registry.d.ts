/**
 * @react-native/assets-registry에 타입 선언이 없어서 직접 최소 타입만 선언한다.
 * components/naver-map/naver-map.web.tsx에서 require(png) 자산의 URL을 직접 계산할 때 사용.
 */
declare module '@react-native/assets-registry/registry' {
  export type PackagerAsset = {
    httpServerLocation: string;
    width?: number;
    height?: number;
    scales: number[];
    hash: string;
    name: string;
    type: string;
  };

  export function getAssetByID(assetId: number): PackagerAsset;
}
