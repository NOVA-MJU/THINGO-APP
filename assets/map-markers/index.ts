import type { ImageRequireSource } from 'react-native/Libraries/Image/ImageSource';

// scripts/generate-map-marker-icons.mjs로 생성한 "파란 원 배경 + 흰색 아이콘" PNG 매니페스트.
// 키는 lib/maps/icons.ts의 ICONS_BY_KEY / category-data.ts의 iconKey와 동일한 네임스페이스(PascalCase 아이콘 컴포넌트명)를 쓴다.
// Metro는 동적 경로의 require()를 지원하지 않아, 아이콘별로 정적으로 나열해야 한다.
export const CATEGORY_MARKER_IMAGES: Record<string, ImageRequireSource> = {
  BankIcon: require('./bank.png'),
  BreakRoomIcon: require('./break-room.png'),
  BuildingEntranceIcon: require('./building-entrance.png'),
  BuildingIcon: require('./building.png'),
  BusIcon: require('./bus.png'),
  CafeIcon: require('./cafe.png'),
  CafeteriaIcon: require('./cafeteria.png'),
  CampusEntranceIcon: require('./campus-entrance.png'),
  CertificateKioskIcon: require('./certificate-kiosk.png'),
  ClassroomIcon: require('./classroom.png'),
  ClubRoomIcon: require('./club-room.png'),
  ConvenienceStoreIcon: require('./convenience-store.png'),
  CorridorIcon: require('./corridor.png'),
  GymIcon: require('./gym.png'),
  LoungeIcon: require('./lounge.png'),
  MailIcon: require('./mail.png'),
  ParkingIcon: require('./parking.png'),
  PinIcon: require('./pin.png'),
  PowerBankIcon: require('./power-bank.png'),
  ProfessorRoomIcon: require('./professor-room.png'),
  PrinterIcon: require('./printer.png'),
  ReadingRoomIcon: require('./reading-room.png'),
  RestaurantIcon: require('./restaurant.png'),
  RestroomIcon: require('./restroom.png'),
  ShortcutIcon: require('./shortcut.png'),
  SmokingIcon: require('./smoking.png'),
  StudyRoomIcon: require('./study-room.png'),
  TerraceIcon: require('./terrace.png'),
  TruckIcon: require('./truck.png'),
};

// CATEGORY_MARKER_IMAGES와 동일한 키를 쓰는 active(선택) 상태 PNG 매니페스트.
export const CATEGORY_MARKER_ACTIVE_IMAGES: Record<string, ImageRequireSource> = {
  BankIcon: require('./bank-active.png'),
  BreakRoomIcon: require('./break-room-active.png'),
  BuildingEntranceIcon: require('./building-entrance-active.png'),
  BuildingIcon: require('./building-active.png'),
  BusIcon: require('./bus-active.png'),
  CafeIcon: require('./cafe-active.png'),
  CafeteriaIcon: require('./cafeteria-active.png'),
  CampusEntranceIcon: require('./campus-entrance-active.png'),
  CertificateKioskIcon: require('./certificate-kiosk-active.png'),
  ClassroomIcon: require('./classroom-active.png'),
  ClubRoomIcon: require('./club-room-active.png'),
  ConvenienceStoreIcon: require('./convenience-store-active.png'),
  CorridorIcon: require('./corridor-active.png'),
  GymIcon: require('./gym-active.png'),
  LoungeIcon: require('./lounge-active.png'),
  MailIcon: require('./mail-active.png'),
  ParkingIcon: require('./parking-active.png'),
  PinIcon: require('./pin-active.png'),
  PowerBankIcon: require('./power-bank-active.png'),
  ProfessorRoomIcon: require('./professor-room-active.png'),
  PrinterIcon: require('./printer-active.png'),
  ReadingRoomIcon: require('./reading-room-active.png'),
  RestaurantIcon: require('./restaurant-active.png'),
  RestroomIcon: require('./restroom-active.png'),
  ShortcutIcon: require('./shortcut-active.png'),
  SmokingIcon: require('./smoking-active.png'),
  StudyRoomIcon: require('./study-room-active.png'),
  TerraceIcon: require('./terrace-active.png'),
  TruckIcon: require('./truck-active.png'),
};

// scripts/generate-building-marker-icons.mjs로 생성한 건물 번호(1~9) PNG 매니페스트.
// 1~9 범위를 벗어나는 건물 id는 buildingEmpty로 대체한다.
export const BUILDING_MARKER_IMAGES: Record<string, ImageRequireSource> = {
  '1': require('./building-1.png'),
  '2': require('./building-2.png'),
  '3': require('./building-3.png'),
  '4': require('./building-4.png'),
  '5': require('./building-5.png'),
  '6': require('./building-6.png'),
  '7': require('./building-7.png'),
  '8': require('./building-8.png'),
  '9': require('./building-9.png'),
};

// BUILDING_MARKER_IMAGES와 동일한 키를 쓰는 active(선택) 상태 PNG 매니페스트.
export const BUILDING_MARKER_ACTIVE_IMAGES: Record<string, ImageRequireSource> = {
  '1': require('./building-1-active.png'),
  '2': require('./building-2-active.png'),
  '3': require('./building-3-active.png'),
  '4': require('./building-4-active.png'),
  '5': require('./building-5-active.png'),
  '6': require('./building-6-active.png'),
  '7': require('./building-7-active.png'),
  '8': require('./building-8-active.png'),
  '9': require('./building-9-active.png'),
};

export const BUILDING_MARKER_EMPTY_IMAGE: ImageRequireSource = require('./building-empty.png');
export const BUILDING_MARKER_EMPTY_ACTIVE_IMAGE: ImageRequireSource = require('./building-empty-active.png');
