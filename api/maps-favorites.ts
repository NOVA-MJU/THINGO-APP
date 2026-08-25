import { AxiosError } from 'axios';
import { client } from './client';

// 즐겨찾기 그룹 색상 팔레트 10색. UI 쪽 선택 팔레트(app/(tabs)/maps/favorites/_constants/group-colors.ts)의
// GroupColor['label']이 이 타입을 그대로 참조해서, 팔레트에 서버가 모르는 색상이 섞이면 타입 에러로 걸러진다.
export type FavoriteGroupColor =
  | 'CORAL'
  | 'RED'
  | 'ORANGE'
  | 'AMBER'
  | 'LIME'
  | 'GREEN'
  | 'SKY'
  | 'BLUE'
  | 'PURPLE'
  | 'GRAY';

// USER: 사용자가 만든 그룹. SYSTEM_MY_PLACES/SYSTEM_BUS: 시스템이 기본 제공하는 '내 장소'/'버스' 그룹(사용자가 추가한 게 아님)
export type FavoriteGroupType = 'USER' | 'SYSTEM_MY_PLACES' | 'SYSTEM_BUS';

export type FavoriteGroup = {
  // '버스'는 실제 그룹 로우가 없는 가상 항목(정류장/노선 즐겨찾기를 응답에 끼워 넣은 것)이라 id가 null로 내려온다
  id: number | null;
  name: string;
  color: FavoriteGroupColor;
  type: FavoriteGroupType;
  system: boolean;
  placeCount: number;
};

export type FavoriteGroupSort = 'latest' | 'name' | 'place_added';

export type CreateFavoriteGroupParams = {
  name: string;
  // 미지정 시 서버 기본값(BLUE, 띵고 색)으로 생성됨
  color?: FavoriteGroupColor;
};

export type UpdateFavoriteGroupParams = {
  groupId: number;
  name: string;
  color?: FavoriteGroupColor;
};

type ApiResponse<T> = {
  status: string;
  data: T;
  timestamp: string;
};

// 성공 응답(ApiResponse)과 별개인 에러 응답 봉투. FAVORITE_GROUP_NAME_INVALID,
// FAVORITE_GROUP_SYSTEM_MODIFY_NOT_ALLOWED, FAVORITE_GROUP_FORBIDDEN, FAVORITE_GROUP_NOT_FOUND 등을
// message에 이미 한국어로 풀어서 내려주므로, 별도 에러 코드 분기 없이 이 메시지를 그대로 보여주면 된다.
type ApiErrorResponse = {
  error: string;
  message: string;
  status: number;
};

// 즐겨찾기 그룹 API 에러에서 서버가 내려준 안내 메시지를 뽑아낸다. 없으면 fallback 사용.
export function getFavoriteGroupErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.message) return data.message;
  }
  return fallback;
}

// 즐겨찾기 그룹 목록 조회. '내 장소' → '버스' 순으로 항상 상단 고정(서버가 이 순서로 내려줌), 이어서 sort 기준으로
// 사용자 그룹 정렬. 로그인 필요 — 최초 호출 시 '내 장소' 그룹이 없으면 서버가 자동 생성한다.
export async function getFavoriteGroups(
  sort: FavoriteGroupSort = 'latest'
): Promise<FavoriteGroup[]> {
  const { data } = await client.get<ApiResponse<FavoriteGroup[]>>('/map/favorites/groups', {
    params: { sort },
  });

  return data.data;
}

// 즐겨찾기 그룹명/색상 수정. 시스템 그룹(내 장소)은 수정 불가(FAVORITE_GROUP_SYSTEM_MODIFY_NOT_ALLOWED),
// 남의 그룹이면 403(FAVORITE_GROUP_FORBIDDEN), 없는 그룹이면 404(FAVORITE_GROUP_NOT_FOUND)
export async function updateFavoriteGroup({
  groupId,
  name,
  color,
}: UpdateFavoriteGroupParams): Promise<FavoriteGroup> {
  const { data } = await client.patch<ApiResponse<FavoriteGroup>>(
    `/map/favorites/groups/${groupId}`,
    { name, color }
  );

  return data.data;
}

// 즐겨찾기 그룹 삭제. 그룹 안에 저장된 장소/메모도 함께 삭제된다(핀 자체는 삭제 안 됨).
// 시스템 그룹(내 장소)은 삭제 불가(FAVORITE_GROUP_SYSTEM_MODIFY_NOT_ALLOWED),
// 남의 그룹이면 403(FAVORITE_GROUP_FORBIDDEN), 없는 그룹이면 404(FAVORITE_GROUP_NOT_FOUND)
export async function deleteFavoriteGroup(groupId: number): Promise<void> {
  await client.delete<ApiResponse<null>>(`/map/favorites/groups/${groupId}`);
}

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
