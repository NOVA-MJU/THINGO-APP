import { AxiosError } from 'axios';
import { client } from './client';

export type MapPlaceType = 'BUILDING' | 'FACILITY' | 'EXTERNAL_LOCATION';

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

type ApiResponse<T> = {
  status: string;
  data: T;
  timestamp: string;
};

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
