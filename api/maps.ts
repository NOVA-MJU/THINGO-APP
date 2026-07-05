import { AxiosError } from 'axios';
import { client } from './client';

export type MapEntityType = 'BUILDING' | 'PLACE';
export type MapPlaceType = 'BUILDING' | 'FACILITY' | 'EXTERNAL_LOCATION';

export type MapSearchItem = {
  id: number;
  type: MapEntityType;
  name: string;
  categoryCode: string;
  iconKey: string;
  imageUrl: string | null;
  classroomCode: string | null;
  location: string | null;
  favorite: boolean;
  operatingStatus: string | null;
  distanceMeters: number | null;
  latitude: number;
  longitude: number;
};

export type MapBuilding = {
  id: number;
  type: MapPlaceType;
  name: string;
  categoryCode: string;
  iconKey: string | null;
  imageUrl: string | null;
  classroomCode: string | null;
  location: string | null;
  favorite: boolean;
  operatingStatus: string | null;
  distanceMeters: number;
  latitude: number;
  longitude: number;
};

export type MapBuildingWeeklyHour = {
  dayOfWeek: string;
  dayLabel: string;
  text: string;
  note: string | null;
};

export type MapBuildingCategoryTab = {
  code: string;
  label: string;
  iconKey: string | null;
};

export type MapBuildingPlace = {
  id: number;
  name: string;
  categoryCode: string;
  iconKey: string | null;
};

export type MapBuildingFloor = {
  floorId: number;
  floorLabel: string;
  floorOrder: number;
  mapImageUrl: string | null;
  places: MapBuildingPlace[];
};

export type MapBuildingDetail = {
  id: number;
  name: string;
  iconKey: string | null;
  imageUrl: string | null;
  buildingNumber: number;
  classroomCode: string | null;
  favorite: boolean;
  operatingStatus: string | null;
  distanceMeters: number;
  latitude: number;
  longitude: number;
  infoText: string | null;
  weeklyOperatingHours: MapBuildingWeeklyHour[];
  categoryTabs: MapBuildingCategoryTab[];
  floors: MapBuildingFloor[];
};

export type MapPlaceDetail = {
  id: number;
  name: string;
  categoryCode: string;
  iconKey: string | null;
  imageUrl: string | null;
  favorite: boolean;
  distanceMeters: number | null;
  latitude: number;
  longitude: number;
  location: string | null;
  infoText: string | null;
};

export type MapCategoryPin = {
  id: number;
  type: MapPlaceType;
  name: string;
  categoryCode: string;
  iconKey: string | null;
  imageUrl: string | null;
  classroomCode: string | null;
  location: string | null;
  favorite: boolean;
  operatingStatus: string | null;
  distanceMeters: number | null;
  latitude: number;
  longitude: number;
};

export type MapSearchSuggestion = Pick<
  MapSearchItem,
  'id' | 'name' | 'type' | 'categoryCode' | 'iconKey'
>;

export type MapSearchParams = {
  keyword: string;
  type?: MapEntityType;
  lat?: number;
  lng?: number;
  page?: number;
  size?: number;
};

export type MapSearchSuggestionParams = {
  keyword: string;
  type?: MapEntityType;
  limit?: number;
};

type ApiResponse<T> = {
  status: string;
  data: T;
  timestamp: string;
};

export const MAP_SEARCH_PAGE_SIZE = 20;
export const MAP_SEARCH_SUGGESTION_LIMIT = 10;

export async function getMapSearchResults({
  keyword,
  type,
  lat,
  lng,
  page = 0,
  size = MAP_SEARCH_PAGE_SIZE,
}: MapSearchParams): Promise<MapSearchItem[]> {
  const trimmedKeyword = keyword.trim();
  if (!trimmedKeyword) return [];

  const { data } = await client.get<ApiResponse<MapSearchItem[]>>('/map/search', {
    params: { keyword: trimmedKeyword, type, lat, lng, page, size },
  });

  return data.data;
}

// 칩 클릭 시 장소/건물 목록 조회
export async function getCategoryPins(
  code: string,
  lat?: number,
  lng?: number,
  page = 0,
  size = 20
): Promise<MapCategoryPin[]> {
  const { data } = await client.get<ApiResponse<MapCategoryPin[]>>(`/map/categories/${code}/pins`, {
    params: { lat, lng, page, size },
  });

  return data.data;
}

export async function getMapSearchSuggestions({
  keyword,
  type,
  limit = MAP_SEARCH_SUGGESTION_LIMIT,
}: MapSearchSuggestionParams): Promise<MapSearchSuggestion[]> {
  const trimmedKeyword = keyword.trim();
  if (!trimmedKeyword) return [];

  const { data } = await client.get<ApiResponse<MapSearchSuggestion[]>>('/map/search/suggest', {
    params: { keyword: trimmedKeyword, type, limit },
  });

  return data.data;
}

// 캠퍼스 건물 목록 조회
export async function getBuildings(lat: number, lng: number): Promise<MapBuilding[]> {
  const { data } = await client.get<ApiResponse<MapBuilding[]>>('/map/buildings', {
    params: { lat, lng },
  });

  return data.data;
}

// 캠퍼스 건물 상세 조회
export async function getBuildingDetail(
  id: number,
  lat?: number,
  lng?: number
): Promise<MapBuildingDetail | null> {
  try {
    const { data } = await client.get<ApiResponse<MapBuildingDetail>>(`/map/buildings/${id}`, {
      params: { lat, lng },
    });

    return data.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) return null;
    throw error;
  }
}

// 장소(비건물) 상세 조회
export async function getPlaceDetail(
  id: number,
  lat?: number,
  lng?: number
): Promise<MapPlaceDetail | null> {
  try {
    const { data } = await client.get<ApiResponse<MapPlaceDetail>>(`/map/places/${id}`, {
      params: { lat, lng },
    });

    return data.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) return null;
    throw error;
  }
}

// 건물/장소 즐겨찾기 토글 (등록 시 true, 해제 시 false 반환)
export async function toggleMapFavorite(pinId: number): Promise<boolean> {
  const { data } = await client.post<ApiResponse<boolean>>('/map/favorites', null, {
    params: { pinId },
  });

  return data.data;
}
