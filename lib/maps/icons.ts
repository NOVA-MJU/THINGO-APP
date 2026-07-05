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
  ClubRoomIcon,
  ConvenienceStoreIcon,
  CorridorIcon,
  GymIcon,
  LoungeIcon,
  MailIcon,
  ParkingIcon,
  PinIcon,
  PowerBankIcon,
  PrinterIcon,
  ReadingRoomIcon,
  RestaurantIcon,
  RestroomIcon,
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
  ClubRoomIcon,
  ConvenienceStoreIcon,
  CorridorIcon,
  GymIcon,
  LoungeIcon,
  MailIcon,
  ParkingIcon,
  PinIcon,
  PowerBankIcon,
  PrinterIcon,
  ReadingRoomIcon,
  RestaurantIcon,
  RestroomIcon,
  ShortcutIcon,
  SmokingIcon,
  StudyRoomIcon,
  TerraceIcon,
  TruckIcon,
};

const ICON_KEYS_BY_CATEGORY: Record<string, string> = {
  atm: 'BankIcon',
  bank: 'BankIcon',
  building: 'BuildingIcon',
  bus: 'BusIcon',
  cafe: 'CafeIcon',
  cafeteria: 'CafeteriaIcon',
  'certificate-kiosk': 'CertificateKioskIcon',
  'club-room': 'ClubRoomIcon',
  convenience_store: 'ConvenienceStoreIcon',
  'convenience-store': 'ConvenienceStoreIcon',
  gym: 'GymIcon',
  lounge: 'LoungeIcon',
  mail: 'MailIcon',
  parking: 'ParkingIcon',
  printer: 'PrinterIcon',
  'reading-room': 'ReadingRoomIcon',
  restaurant: 'RestaurantIcon',
  restroom: 'RestroomIcon',
  smoking: 'SmokingIcon',
  'study-room': 'StudyRoomIcon',
};

export function getMapIcon(iconKey: string, categoryCode: string): MapIconComponent {
  const categoryIconKey = ICON_KEYS_BY_CATEGORY[categoryCode.toLowerCase()];
  return ICONS_BY_KEY[iconKey] ?? ICONS_BY_KEY[categoryIconKey] ?? PinIcon;
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
