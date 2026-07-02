export type BusStopStation = 'A' | 'B';

export interface BusStop {
  id: string;
  station: BusStopStation;
  latitude: number;
  longitude: number;
}

export const BUS_STOPS: BusStop[] = [
  { id: 'bus-stop-1', station: 'A', latitude: 37.5799, longitude: 126.9244 },
  { id: 'bus-stop-2', station: 'B', latitude: 37.5791, longitude: 126.9235 },
];
