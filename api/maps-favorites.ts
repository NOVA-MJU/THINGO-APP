import { client } from './client';

// 즐겨찾기 그룹 색상 팔레트 10색. UI 쪽 선택 팔레트(app/(tabs)/maps/favorites/_constants/group-colors.ts)의
// GroupColor['label']이 이 타입을 그대로 참조해서, 팔레트에 서버가 모르는 색상이 섞이면 타입 에러로 걸러진다.
export type FavoriteGroupColor =
  | 'PINK'
  | 'RED'
  | 'ORANGE'
  | 'YELLOW'
  | 'YELLOWGREEN'
  | 'GREEN'
  | 'BLUE'
  | 'NAVYBLUE'
  | 'PURPLE'
  | 'GRAY';

export type FavoriteGroupOwnerType = 'USER' | 'SYSTEM';

export type FavoriteGroup = {
  id: number;
  name: string;
  color: FavoriteGroupColor;
  type: FavoriteGroupOwnerType;
  system: boolean;
  placeCount: number;
};

export type CreateFavoriteGroupParams = {
  name: string;
  // 미지정 시 서버 기본값(BLUE, 띵고 색)으로 생성됨
  color?: FavoriteGroupColor;
};

type ApiResponse<T> = {
  status: string;
  data: T;
  timestamp: string;
};

// 건물/장소 즐겨찾기 토글 (등록 시 true, 해제 시 false 반환)
export async function toggleMapFavorite(pinId: number): Promise<boolean> {
  const { data } = await client.post<ApiResponse<boolean>>('/map/favorites', null, {
    params: { pinId },
  });

  return data.data;
}

// 즐겨찾기 그룹 생성 (바텀시트에서 이름/색상 입력 후 저장)
export async function createFavoriteGroup({
  name,
  color,
}: CreateFavoriteGroupParams): Promise<FavoriteGroup> {
  const { data } = await client.post<ApiResponse<FavoriteGroup>>('/map/favorites/groups', {
    name,
    color,
  });

  return data.data;
}
