import { client } from './client';

export type MapEntityType = 'BUILDING' | 'PLACE';

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
