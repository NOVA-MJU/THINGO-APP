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
      { id: 'daedong', label: '대동명지도', Icon: MyeongwolIcon },
      { id: 'cafeteria', label: '학생식당', Icon: CafeteriaIcon },
      { id: 'restaurant', label: '음식점', Icon: RestaurantIcon },
      { id: 'cafe', label: '카페', Icon: CafeIcon },
      { id: 'truck', label: '야식트럭', Icon: TruckIcon },
      { id: 'convenience-store', label: '편의점', Icon: ConvenienceStoreIcon },
    ],
  },
  {
    id: 'study',
    label: '학습 및 휴식 (Study/Rest)',
    iconClassName: 'text-[#EDAE26]',
    chips: [
      { id: 'lounge', label: '라운지', Icon: LoungeIcon },
      { id: 'reading-room', label: '열람실', Icon: ReadingRoomIcon },
      { id: 'study-room', label: '스터디룸', Icon: StudyRoomIcon },
      { id: 'gym', label: '운동 시설', Icon: GymIcon },
      { id: 'break-room', label: '휴게실', Icon: BreakRoomIcon },
      { id: 'terrace', label: '테라스', Icon: TerraceIcon },
      { id: 'club-room', label: '동아리방', Icon: ClubRoomIcon },
    ],
  },
  {
    id: 'convenience',
    label: '편의 (Convenience)',
    iconClassName: 'text-blue-20',
    chips: [
      { id: 'printer', label: '프린터', Icon: PrinterIcon },
      { id: 'certificate-kiosk', label: '자동증명발급기', Icon: CertificateKioskIcon },
      { id: 'bank', label: '은행·ATM', Icon: BankIcon },
      { id: 'mail', label: '우편', Icon: MailIcon },
      { id: 'smoking', label: '흡연 부스', Icon: SmokingIcon },
      { id: 'power-bank', label: '보조배터리', Icon: PowerBankIcon },
      { id: 'restroom', label: '화장실', Icon: RestroomIcon },
    ],
  },
  {
    id: 'map-guide',
    label: '건물·이동 (Map Guide)',
    iconClassName: 'text-[#34AA6F]',
    chips: [
      { id: 'building', label: '건물', Icon: BuildingIcon },
      { id: 'parking', label: '주차장', Icon: ParkingIcon },
      { id: 'campus-entrance', label: '캠퍼스 출입구', Icon: CampusEntranceIcon },
      { id: 'building-entrance', label: '건물 출입구', Icon: BuildingEntranceIcon },
      { id: 'corridor', label: '건물 통로', Icon: CorridorIcon },
      { id: 'shortcut', label: '지름길', Icon: ShortcutIcon },
      { id: 'bus', label: '버스', Icon: BusIcon },
    ],
  },
];

export default CATEGORIES;
