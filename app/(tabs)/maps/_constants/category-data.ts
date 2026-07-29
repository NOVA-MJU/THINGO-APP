import { ComponentType } from 'react';
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
  MyeongwolIcon,
  ParkingIcon,
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

export interface Chip {
  id: string;
  label: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
  // assets/map-markers의 CATEGORY_MARKER_IMAGES / lib/maps/icons.ts의 ICONS_BY_KEY와 동일한 키.
  iconKey: string;
}

export interface Category {
  id: string;
  label: string;
  iconClassName: string;
  chips: Chip[];
}

const CATEGORIES: Category[] = [
  {
    id: 'food',
    label: '식사 (F&B)',
    iconClassName: 'text-[#F57F36]',
    chips: [
      { id: 'daedong', label: '대동명지도', Icon: MyeongwolIcon, iconKey: 'MyeongwolIcon' },
      { id: 'cafeteria', label: '학생식당', Icon: CafeteriaIcon, iconKey: 'CafeteriaIcon' },
      { id: 'restaurant', label: '음식점', Icon: RestaurantIcon, iconKey: 'RestaurantIcon' },
      { id: 'cafe', label: '카페', Icon: CafeIcon, iconKey: 'CafeIcon' },
      { id: 'truck', label: '야식트럭', Icon: TruckIcon, iconKey: 'TruckIcon' },
      {
        id: 'convenience-store',
        label: '편의점',
        Icon: ConvenienceStoreIcon,
        iconKey: 'ConvenienceStoreIcon',
      },
    ],
  },
  {
    id: 'study',
    label: '학습 및 휴식 (Study/Rest)',
    iconClassName: 'text-[#EDAE26]',
    chips: [
      { id: 'lounge', label: '라운지', Icon: LoungeIcon, iconKey: 'LoungeIcon' },
      { id: 'reading-room', label: '열람실', Icon: ReadingRoomIcon, iconKey: 'ReadingRoomIcon' },
      { id: 'study-room', label: '스터디룸', Icon: StudyRoomIcon, iconKey: 'StudyRoomIcon' },
      { id: 'gym', label: '운동 시설', Icon: GymIcon, iconKey: 'GymIcon' },
      { id: 'break-room', label: '휴게실', Icon: BreakRoomIcon, iconKey: 'BreakRoomIcon' },
      { id: 'terrace', label: '테라스', Icon: TerraceIcon, iconKey: 'TerraceIcon' },
      { id: 'club-room', label: '동아리방', Icon: ClubRoomIcon, iconKey: 'ClubRoomIcon' },
    ],
  },
  {
    id: 'convenience',
    label: '편의 (Convenience)',
    iconClassName: 'text-blue-20',
    chips: [
      { id: 'printer', label: '프린터', Icon: PrinterIcon, iconKey: 'PrinterIcon' },
      {
        id: 'certificate-kiosk',
        label: '자동증명발급기',
        Icon: CertificateKioskIcon,
        iconKey: 'CertificateKioskIcon',
      },
      { id: 'bank', label: '은행·ATM', Icon: BankIcon, iconKey: 'BankIcon' },
      { id: 'mail', label: '우편', Icon: MailIcon, iconKey: 'MailIcon' },
      { id: 'smoking', label: '흡연 부스', Icon: SmokingIcon, iconKey: 'SmokingIcon' },
      { id: 'power-bank', label: '보조배터리', Icon: PowerBankIcon, iconKey: 'PowerBankIcon' },
      { id: 'restroom', label: '화장실', Icon: RestroomIcon, iconKey: 'RestroomIcon' },
    ],
  },
  {
    id: 'map-guide',
    label: '건물·이동 (Map Guide)',
    iconClassName: 'text-[#34AA6F]',
    chips: [
      { id: 'building', label: '건물', Icon: BuildingIcon, iconKey: 'BuildingIcon' },
      { id: 'parking', label: '주차장', Icon: ParkingIcon, iconKey: 'ParkingIcon' },
      {
        id: 'campus-entrance',
        label: '캠퍼스 출입구',
        Icon: CampusEntranceIcon,
        iconKey: 'CampusEntranceIcon',
      },
      {
        id: 'building-entrance',
        label: '건물 출입구',
        Icon: BuildingEntranceIcon,
        iconKey: 'BuildingEntranceIcon',
      },
      { id: 'corridor', label: '건물 통로', Icon: CorridorIcon, iconKey: 'CorridorIcon' },
      { id: 'shortcut', label: '지름길', Icon: ShortcutIcon, iconKey: 'ShortcutIcon' },
      { id: 'bus', label: '버스', Icon: BusIcon, iconKey: 'BusIcon' },
    ],
  },
];

export default CATEGORIES;
