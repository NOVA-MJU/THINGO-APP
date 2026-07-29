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
  CurrentLocationIcon: require('./current-location.png'),
  GymIcon: require('./gym.png'),
  LoungeIcon: require('./lounge.png'),
  MailIcon: require('./mail.png'),
  MyeongwolIcon: require('./myeongwol.png'),
  ParkingIcon: require('./parking.png'),
  PinIcon: require('./pin.png'),
  PowerBankIcon: require('./power-bank.png'),
  ProfessorRoomIcon: require('./professor-room.png'),
  PrinterIcon: require('./printer.png'),
  ReadingRoomIcon: require('./reading-room.png'),
  RestaurantIcon: require('./restaurant.png'),
  RestroomIcon: require('./restroom.png'),
  ResetIcon: require('./reset.png'),
  ShortcutIcon: require('./shortcut.png'),
  SmokingIcon: require('./smoking.png'),
  StudyRoomIcon: require('./study-room.png'),
  TerraceIcon: require('./terrace.png'),
  TruckIcon: require('./truck.png'),
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

export const BUILDING_MARKER_EMPTY_IMAGE: ImageRequireSource = require('./building-empty.png');
