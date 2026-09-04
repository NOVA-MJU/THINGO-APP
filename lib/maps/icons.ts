import {
  BankIcon,
  BreakRoomIcon,
  BuildingEntranceIcon,
  BuildingIcon,
  BusIcon,
  CafeIcon,
  CafeteriaIcon,
  CampusEntranceIcon,
  CertificateKioskIcon,
  ClassroomIcon,
  ClubRoomIcon,
  ConvenienceStoreIcon,
  CorridorIcon,
  CurrentLocationIcon,
  GymIcon,
  LoungeIcon,
  MailIcon,
  MyeongwolIcon,
  ParkingIcon,
  PinIcon,
  PowerBankIcon,
  ProfessorRoomIcon,
  PrinterIcon,
  ReadingRoomIcon,
  RestaurantIcon,
  RestroomIcon,
  ResetIcon,
  ShortcutIcon,
  SmokingIcon,
  StudyRoomIcon,
  TerraceIcon,
  TruckIcon,
} from '@/components/icons/map';
import type { ComponentType } from 'react';

export type MapIconComponent = ComponentType<{ size?: number; className?: string }>;

const ICONS_BY_KEY: Record<string, MapIconComponent> = {
  BankIcon,
  BreakRoomIcon,
  BuildingEntranceIcon,
  BuildingIcon,
  BusIcon,
  CafeIcon,
  CafeteriaIcon,
  CampusEntranceIcon,
  CertificateKioskIcon,
  ClassroomIcon,
  ClubRoomIcon,
  ConvenienceStoreIcon,
  CorridorIcon,
  CurrentLocationIcon,
  GymIcon,
  LoungeIcon,
  MailIcon,
  MyeongwolIcon,
  ParkingIcon,
  PinIcon,
  PowerBankIcon,
  ProfessorRoomIcon,
  PrinterIcon,
  ReadingRoomIcon,
  RestaurantIcon,
  RestroomIcon,
  ResetIcon,
  ShortcutIcon,
  SmokingIcon,
  StudyRoomIcon,
  TerraceIcon,
  TruckIcon,
};

const ICON_KEYS_BY_CATEGORY: Record<string, string> = {
  atm: 'BankIcon',
  bank: 'BankIcon',
  'break-room': 'BreakRoomIcon',
  break_room: 'BreakRoomIcon',
  building: 'BuildingIcon',
  'building-entrance': 'BuildingEntranceIcon',
  building_entrance: 'BuildingEntranceIcon',
  bus: 'BusIcon',
  cafe: 'CafeIcon',
  cafeteria: 'CafeteriaIcon',
  'campus-entrance': 'CampusEntranceIcon',
  campus_entrance: 'CampusEntranceIcon',
  classroom: 'ClassroomIcon',
  'certificate-kiosk': 'CertificateKioskIcon',
  certificate_kiosk: 'CertificateKioskIcon',
  'club-room': 'ClubRoomIcon',
  club_room: 'ClubRoomIcon',
  convenience_store: 'ConvenienceStoreIcon',
  'convenience-store': 'ConvenienceStoreIcon',
  corridor: 'CorridorIcon',
  current_location: 'CurrentLocationIcon',
  'current-location': 'CurrentLocationIcon',
  daedong: 'MyeongwolIcon',
  gym: 'GymIcon',
  lounge: 'LoungeIcon',
  mail: 'MailIcon',
  parking: 'ParkingIcon',
  'power-bank': 'PowerBankIcon',
  power_bank: 'PowerBankIcon',
  professor_room: 'ProfessorRoomIcon',
  'professor-room': 'ProfessorRoomIcon',
  position: 'CurrentLocationIcon',
  printer: 'PrinterIcon',
  'reading-room': 'ReadingRoomIcon',
  reading_room: 'ReadingRoomIcon',
  restaurant: 'RestaurantIcon',
  restroom: 'RestroomIcon',
  shortcut: 'ShortcutIcon',
  smoking: 'SmokingIcon',
  'study-room': 'StudyRoomIcon',
  study_room: 'StudyRoomIcon',
  terrace: 'TerraceIcon',
  truck: 'TruckIcon',
};

export function getMapIcon(iconKey: string, categoryCode: string): MapIconComponent {
  const categoryIconKey = ICON_KEYS_BY_CATEGORY[categoryCode.toLowerCase()];
  return ICONS_BY_KEY[iconKey] ?? ICONS_BY_KEY[categoryIconKey] ?? PinIcon;
}

// getMapIcon과 동일한 우선순위로, 컴포넌트 대신 assets/map-markers(CATEGORY_MARKER_IMAGES)
// 조회용 키 문자열을 리턴한다 (마커를 PNG 이미지로 그릴 때 사용).
export function getMapIconKey(iconKey: string, categoryCode: string): string {
  const categoryIconKey = ICON_KEYS_BY_CATEGORY[categoryCode.toLowerCase()];
  if (iconKey in ICONS_BY_KEY) return iconKey;
  if (categoryIconKey in ICONS_BY_KEY) return categoryIconKey;
  return 'PinIcon';
}

export function getMapIconClassName(categoryCode: string) {
  switch (categoryCode.toLowerCase()) {
    case 'cafe':
    case 'cafeteria':
    case 'restaurant':
      return 'text-[#F57F36]';
    case 'building':
      return 'text-blue-20';
    case 'lounge':
    case 'reading-room':
    case 'study-room':
      return 'text-[#EDAE26]';
    default:
      return 'text-blue-20';
  }
}
