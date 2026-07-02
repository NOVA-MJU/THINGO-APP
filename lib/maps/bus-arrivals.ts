import { client } from '@/api/client';
import type { BusStopStation } from './bus-stops';

export interface BusArrival {
  remainingTime: string;
  stationCount: string | null;
  congestion: '여유' | '보통' | '혼잡' | '매우혼잡' | null;
}

export interface Bus {
  routeName: string;
  direction: string;
  lastBusTime: string;
  favorite: boolean;
  arrivals: BusArrival[];
}

export interface BusStationInfo {
  arsId: string;
  stationName: string;
  lat: number;
  lng: number;
  buses: Bus[];
}

// 버스 도착 정보 조회
export async function fetchBusArrivals(station: BusStopStation): Promise<BusStationInfo> {
  const { data } = await client.get<{ data: BusStationInfo }>('/bus/arrivals', {
    params: { station },
  });
  return data.data;
}

// 버스 즐겨찾기 토글
export async function toggleBusFavorite(station: BusStopStation, routeName: string): Promise<void> {
  await client.post('/bus/favorites', null, { params: { station, routeName } });
}
