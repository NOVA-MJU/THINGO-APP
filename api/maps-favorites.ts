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

// 그룹 상세(장소 목록)의 정렬 기준. 그룹 목록 정렬(FavoriteGroupSort)과 달리 'latest'가 없다.
export type FavoriteGroupPlaceSort = 'place_added' | 'name';

// 그룹에 담긴 장소 카드 하나. MapCategoryPin(api/maps.ts)과 필드가 겹치지만 식별자 이름(pinId)과
// memo/favorite(그룹 카드라 항상 true)가 달라서 별도 타입으로 둔다.
export type FavoriteGroupPlace = {
  pinId: number;
  type: 'BUILDING' | 'PLACE';
  name: string;
  categoryCode: string;
  iconKey: string | null;
  imageUrl: string | null;
  classroomCode: string | null;
  location: string | null;
  operatingStatus: string | null;
  distanceMeters: number | null;
  latitude: number;
  longitude: number;
  // 이 그룹 안에서만 붙는 메모
  memo: string | null;
  // 그룹에 담긴 카드이므로 항상 true
  favorite: boolean;
};

export type FavoriteGroupDetail = {
  group: FavoriteGroup;
  places: FavoriteGroupPlace[];
};

// 그룹 선택 바텀시트(별 클릭 시)의 그룹 목록 항목 하나. FavoriteGroup과 필드가 겹치지만
// "이 핀이 이 그룹에 담겨 있는지"(selected)가 추가로 붙는다.
export type FavoritePinGroupOption = {
  id: number;
  name: string;
  color: FavoriteGroupColor;
  type: FavoriteGroupType;
  system: boolean;
  placeCount: number;
  selected: boolean;
};

// 그룹 선택 바텀시트 조회 응답. '버스'는 핀을 담을 수 없어 groups에 포함되지 않는다.
export type FavoritePinGroups = {
  pinId: number;
  placeName: string;
  // (그룹, 핀) 단위로 저장되는 메모의 프리필값 — '내 장소'의 메모를 우선 보여주고, 없으면 다른 그룹의 메모 중 하나
  memo: string | null;
  groups: FavoritePinGroupOption[];
};

export type GetFavoriteGroupPlacesParams = {
  groupId: number;
  sort?: FavoriteGroupPlaceSort;
  // 있으면 장소별 distanceMeters를 계산해서 내려줌
  lat?: number;
  lng?: number;
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

// 그룹 상세 — 그룹 헤더(이름/색상/개수)와 그 그룹에 담긴 장소 카드 목록을 함께 조회.
// '버스'는 그룹으로 저장되지 않아 이 엔드포인트로 조회하지 않는다(버스 도착정보 화면에서 별도 처리).
export async function getFavoriteGroupPlaces({
  groupId,
  sort = 'place_added',
  lat,
  lng,
}: GetFavoriteGroupPlacesParams): Promise<FavoriteGroupDetail> {
  const { data } = await client.get<ApiResponse<FavoriteGroupDetail>>(
    `/map/favorites/groups/${groupId}/places`,
    { params: { sort, lat, lng } }
  );

  return data.data;
}

// 별(즐겨찾기) 클릭 시 뜨는 그룹 선택 바텀시트 데이터 조회 — 회원의 그룹들('내 장소' 상단 고정 후
// 최신순)과 각 그룹에 이 핀이 이미 담겨 있는지, 그리고 메모 프리필값을 함께 내려준다.
export async function getFavoritePinGroups(pinId: number): Promise<FavoritePinGroups> {
  const { data } = await client.get<ApiResponse<FavoritePinGroups>>(
    `/map/favorites/pins/${pinId}/groups`
  );

  return data.data;
}

export type SaveFavoritePinGroupsParams = {
  pinId: number;
  // 이 핀이 속할 그룹 집합 — 통째로 교체(replace)된다. 빈 배열이면 전 그룹에서 제거(즐겨찾기 완전 해제)
  groupIds: number[];
  // 선택된 각 그룹 멤버십에 동일하게 저장 (최대 30자)
  memo: string;
};

// 그룹 선택 바텀시트의 저장 버튼 — groupIds에 있는 그룹에는 담고(없으면 추가), 빠진 그룹에서는 제거한다.
// 존재하지 않거나 소유하지 않은 그룹 id는 무시됨. 응답은 조회(getFavoritePinGroups)와 동일한 형태로,
// 저장 후 최신 바텀시트 상태를 그대로 돌려준다.
export async function saveFavoritePinGroups({
  pinId,
  groupIds,
  memo,
}: SaveFavoritePinGroupsParams): Promise<FavoritePinGroups> {
  const { data } = await client.patch<ApiResponse<FavoritePinGroups>>(
    `/map/favorites/pins/${pinId}`,
    { groupIds, memo }
  );

  return data.data;
}

// 그룹 상세에서 장소 카드의 별 아이콘을 눌러 이 그룹에서만 제거(멱등 — 원래 없어도 200).
// toggleMapFavorite(POST /map/favorites)와 달리 전역 즐겨찾기가 아니라 "이 그룹 멤버십만" 지운다 —
// 같은 핀이 다른 그룹에 담겨 있으면 그쪽엔 영향 없음. 다시 담는 API는 없어서, 별을 다시 누르면
// 화면([favoriteId]/index.tsx)에서 로컬로만 별 표시를 되돌린다(서버엔 재등록 요청을 보내지 않음).
export async function removeFavoriteGroupPlace(groupId: number, pinId: number): Promise<void> {
  await client.delete<ApiResponse<null>>(`/map/favorites/groups/${groupId}/places/${pinId}`);
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
