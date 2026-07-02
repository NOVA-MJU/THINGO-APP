import type { ComponentType } from 'react';
import {
  BankIcon,
  BuildingIcon,
  CafeIcon,
  CafeteriaIcon,
  ConvenienceStoreIcon,
  LoungeIcon,
  PrinterIcon,
  StudyRoomIcon,
} from '@/components/icons/map';

export type PlaceKind = 'building' | 'facility' | 'external';

export type OperatingStatus =
  | '곧 운영 시작'
  | '운영중'
  | '곧 운영 종료'
  | '운영 종료'
  | '24시간 운영'
  | '휴무';

export type PlaceFacility = {
  id: string;
  label: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
};

export type PlaceFloorInfo = {
  floor: string;
  description: string;
};

export type MyeongjiPlace = {
  id: string;
  kind: PlaceKind;
  name: string;
  code?: string;
  aliases: string[];
  keywords: string[];
  parentBuildingId?: string;
  categoryLabel: string;
  status: OperatingStatus;
  location: string;
  distance: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  operationHours: string;
  notice?: string;
  isFavorite?: boolean;
  Icon: ComponentType<{ size?: number; className?: string }>;
  iconClassName: string;
  facilities: PlaceFacility[];
  floors: PlaceFloorInfo[];
};

export const PLACES: MyeongjiPlace[] = [
  {
    id: 'mcc',
    kind: 'building',
    name: 'MCC(Myongji Campus Complex)관',
    code: 'S10XXX',
    aliases: ['mcc', '엠씨씨', '엠씨시', '명지캠퍼스컴플렉스', '베리타스홀', '코이노니아홀'],
    keywords: [
      '건물',
      '강의실',
      '박물관',
      '공연장',
      '다목적홀',
      '대학원교학팀',
      '경영대학',
      '스타벅스',
      '이마트에브리데이',
      '다이소',
      '올리브영',
      '애슐리퀸즈',
      '세븐일레븐',
      '건강과땀',
      '하나은행',
    ],
    categoryLabel: '건물',
    status: '운영중',
    location: '명지대학교 인문캠퍼스 MCC관',
    distance: '220m',
    latitude: 37.57915,
    longitude: 126.9225,
    imageUrl: 'https://picsum.photos/seed/mcc/240/240',
    operationHours: '운영 시간 정보 준비중',
    notice:
      '베리타스홀과 코이노니아홀로 구성된 교육문화복합시설이에요. 강의실, 공연장, 상업시설이 함께 있어요.',
    Icon: BuildingIcon,
    iconClassName: 'text-blue-20',
    facilities: [
      { id: 'cafe', label: '카페', Icon: CafeIcon },
      { id: 'convenience-store', label: '편의시설', Icon: ConvenienceStoreIcon },
      { id: 'bank', label: '은행·ATM', Icon: BankIcon },
      { id: 'lounge', label: '휴게공간', Icon: LoungeIcon },
    ],
    floors: [
      {
        floor: '1F',
        description: '베리타스홀 강의실, 박물관, 공연장, 다목적홀, 코이노니아홀 상업시설',
      },
      {
        floor: '2F',
        description: '베리타스홀 강의실, 대학원교학팀, 코이노니아홀 상업시설, 하나은행, 건강과땀',
      },
      { floor: '3F', description: '베리타스홀 강의실, 단과대학 강의실, 보조배터리 대여' },
      { floor: '4F', description: '경영대학 교학팀, 특수대학원 원장실' },
    ],
  },
  {
    id: 'administration',
    kind: 'building',
    name: '행정동',
    code: 'S5XXX',
    aliases: ['대학본부', '본부', '행정관'],
    keywords: ['건물', '하나은행', '입학', '경력개발', '학사지원', '총장실', '새마을금고'],
    categoryLabel: '건물',
    status: '운영중',
    location: '명지대학교 인문캠퍼스 행정동',
    distance: '160m',
    latitude: 37.580098,
    longitude: 126.924244,
    imageUrl: 'https://picsum.photos/seed/administration/240/240',
    operationHours: '운영 시간 정보 준비중',
    notice: '입학, 학사, 경력개발, 총무 등 주요 행정 부서가 있는 건물이에요.',
    isFavorite: true,
    Icon: BuildingIcon,
    iconClassName: 'text-blue-20',
    facilities: [{ id: 'bank', label: '은행·ATM', Icon: BankIcon }],
    floors: [
      { floor: '1F', description: '하나은행, 입학기획팀, 입학관리팀, 경력개발팀, 학사지원팀' },
      { floor: '2F', description: '총무시설팀, 대외홍보팀, 콜센터, 국제교육원 교학팀' },
      { floor: '3F', description: '총장실, 비서실, 부총장실, 접견실, 화상회의실' },
      { floor: '4F', description: '한국문화유산자료실, 평가감사팀, 새마을금고' },
      { floor: '5F', description: '국제한국학연구소, 다기능행정실, 입학사정관실, 세미나실' },
    ],
  },
  {
    id: 'library',
    kind: 'building',
    name: '방목학술정보관',
    code: 'S9XXX',
    aliases: ['방목', '도서관', '도관', '학정'],
    keywords: ['건물', '열람실', '스터디룸', '복사실', '무인반납소', '자료실', '멀티미디어'],
    categoryLabel: '건물',
    status: '운영중',
    location: '명지대학교 인문캠퍼스 방목학술정보관',
    distance: '340m',
    latitude: 37.58075,
    longitude: 126.924498,
    imageUrl: 'https://picsum.photos/seed/library/240/240',
    operationHours: '운영 시간 정보 준비중',
    notice: '열람실과 스터디룸은 학기 중 이용 시간이 달라질 수 있어요.',
    Icon: BuildingIcon,
    iconClassName: 'text-blue-20',
    facilities: [
      { id: 'study-room', label: '스터디룸', Icon: StudyRoomIcon },
      { id: 'printer', label: '프린터', Icon: PrinterIcon },
      { id: 'cafe', label: '카페', Icon: CafeIcon },
    ],
    floors: [
      {
        floor: '1F',
        description: '복사실, 일반열람실, 자유열람실, 국제회의장, 무인반납소, 스터디라운지',
      },
      { floor: '2F', description: '방목기념전시관, 개인문고, 그룹스터디룸, 통역실, 사료실' },
      { floor: '3F', description: '자연과학/예체능 자료, UCC스튜디오, 멀티미디어자료실, 대출실' },
      { floor: '4F', description: '인문과학자료실, 사회과학자료실, 지정도서실, 스터디라운지' },
    ],
  },
  {
    id: 'dormitory',
    kind: 'building',
    name: '생활관(인문)',
    code: 'S8XXX',
    aliases: ['생활관', '기숙사', '인문생활관'],
    keywords: ['건물', '휴게실', '세븐일레븐', '세탁실', '택배실', '세미나실', '기숙사'],
    categoryLabel: '건물',
    status: '운영중',
    location: '명지대학교 인문캠퍼스 생활관(인문)',
    distance: '260m',
    latitude: 37.5808,
    longitude: 126.923064,
    imageUrl: 'https://picsum.photos/seed/dormitory/240/240',
    operationHours: '운영 시간 정보 준비중',
    notice: '인문캠퍼스 기숙사와 생활 편의 공간이 있는 건물이에요.',
    Icon: BuildingIcon,
    iconClassName: 'text-blue-20',
    facilities: [
      { id: 'lounge', label: '휴게실', Icon: LoungeIcon },
      { id: 'convenience-store', label: '세븐일레븐', Icon: ConvenienceStoreIcon },
    ],
    floors: [
      { floor: '1F', description: '세븐일레븐, 세탁실, 택배실, 휴게실' },
      { floor: '2F', description: '생활관 다목적세미나실, 세미나실, 소회의실, 상담실' },
      { floor: '4F', description: '운영팀사무실, 관리팀사무실, 간이취사실, 컴퓨터 A/S' },
      { floor: '6F', description: '휴게실' },
      { floor: '7F', description: '휴게실' },
    ],
  },
  {
    id: 'student-center',
    kind: 'building',
    name: '학생회관',
    code: 'S2XXX',
    aliases: ['학관', '학회'],
    keywords: [
      '건물',
      '학생식당',
      '이마트24',
      '리에토커피',
      '우편취급국',
      '새마을금고',
      '소강당',
      '자동증명발급기',
      '세미나실',
      '동아리',
      '학생회',
    ],
    categoryLabel: '건물',
    status: '운영중',
    location: '명지대학교 인문캠퍼스 학생회관',
    distance: '120m',
    latitude: 37.5803,
    longitude: 126.92345,
    imageUrl: 'https://picsum.photos/seed/student-center/240/240',
    operationHours: '운영 시간 정보 준비중',
    notice:
      '학생식당, 이마트24, 리에토커피, 우편취급국, 새마을금고와 학생회 및 동아리 공간이 있는 건물이에요.',
    Icon: BuildingIcon,
    iconClassName: 'text-blue-20',
    facilities: [
      { id: 'cafeteria', label: '학생식당', Icon: CafeteriaIcon },
      { id: 'cafe', label: '리에토커피', Icon: CafeIcon },
      { id: 'convenience-store', label: '이마트24', Icon: ConvenienceStoreIcon },
      { id: 'bank', label: '새마을금고', Icon: BankIcon },
      { id: 'lounge', label: '휴게실', Icon: LoungeIcon },
    ],
    floors: [
      { floor: 'B1', description: '안경원, 해병전우회, 체력단련실, 샤워장' },
      { floor: '1F', description: '우편취급국, 소강당, 새마을금고, AED' },
      { floor: '2F', description: '명지미디어센터, 명대신문사, 영자신문사' },
      { floor: '3F', description: '학생식당, 이마트24, 리에토커피, 자동증명발급기' },
      {
        floor: '4F',
        description: '잡스튜디오, 남자휴게실, 여자휴게실, 세미나실, 진로취업전용강의실',
      },
      { floor: '5F', description: '총학생회, 단과대 학생회, 사회봉사단, 동아리 공간' },
      { floor: '6F', description: '동아리연합회, 학생복지위원회, 동아리 공간' },
      { floor: '7F', description: '동아리 공간' },
      { floor: '8F', description: '교수협의회, 학군단장실, 회의실, 졸업준비위원회' },
      { floor: '9F', description: '명지미디어센터 서고, 출판부, 교양학습실' },
      { floor: '10F', description: '정책과학연구소, 대학원연구실, 중동문제연구소, 인문과학연구소' },
    ],
  },
  {
    id: 'future-building',
    kind: 'building',
    name: '미래관(미래교육원,어린이집)',
    code: 'S3XXX',
    aliases: ['미래관', '미래교육원', '어린이집'],
    keywords: [
      '건물',
      '사회교육원',
      '원목실',
      '세미나실',
      '컴퓨터실',
      '만화창작학과',
      '음악실습실',
    ],
    categoryLabel: '건물',
    status: '곧 운영 시작',
    location: '명지대학교 인문캠퍼스 미래관',
    distance: '430m',
    latitude: 37.580104,
    longitude: 126.921604,
    imageUrl: 'https://picsum.photos/seed/future-building/240/240',
    operationHours: '운영 시간 정보 준비중',
    notice: '미래교육원, 어린이집, 실습실이 있는 건물이에요.',
    Icon: BuildingIcon,
    iconClassName: 'text-blue-20',
    facilities: [{ id: 'study-room', label: '세미나실', Icon: StudyRoomIcon }],
    floors: [
      { floor: '2F', description: '사회교육원 교학팀, 원목실, 세미나실, 컴퓨터실, 교강사휴게실' },
      { floor: '3F', description: '만화창작학과 실습실' },
      { floor: '5F', description: '디지털 피아노실, 피아노실습실, 음악실습실, 콘서바토리 교수실' },
    ],
  },
  {
    id: 'international-building',
    kind: 'building',
    name: '국제관(구 경상관, 대학원)',
    code: 'S4XXX',
    aliases: ['국제관', '경상관', '대학원'],
    keywords: [
      '건물',
      '장애학생지원센터',
      '보건의료센터',
      '학생상담센터',
      '정보지원팀',
      '전산실',
      '경영대학',
      '방목기초교육대학',
      '대학원',
      '열람실',
    ],
    categoryLabel: '건물',
    status: '운영중',
    location: '명지대학교 인문캠퍼스 국제관',
    distance: '280m',
    latitude: 37.5809,
    longitude: 126.923826,
    imageUrl: 'https://picsum.photos/seed/international-building/240/240',
    operationHours: '운영 시간 정보 준비중',
    notice:
      '구 경상관으로, 대학원 강의실과 보건의료센터, 학생상담센터 등 학생지원 시설이 있는 건물이에요.',
    Icon: BuildingIcon,
    iconClassName: 'text-blue-20',
    facilities: [
      { id: 'study-room', label: '세미나실', Icon: StudyRoomIcon },
      { id: 'health-center', label: '학생지원', Icon: LoungeIcon },
      { id: 'lounge', label: '열람실', Icon: LoungeIcon },
    ],
    floors: [
      { floor: 'B1', description: '동아리 공간, 학생회실, 무용실습실, 배수펌프실' },
      {
        floor: '1F',
        description: '보건의료센터, 학생상담센터, 장애학생지원센터, 정보지원팀, 전산실',
      },
      { floor: '2F', description: '경영대학 세미나실, 방목기초교육대학 세미나실' },
      { floor: '4F', description: '경영정보학과 PC실' },
      { floor: '6F', description: '대학원 원우회실, 특수대학원교학팀, 대학원 원우회 공간' },
      {
        floor: '7F',
        description: '문화예술대학원 실습실, 심상치료 및 음악치료실, 언어치료 및 아동심리치료실',
      },
      { floor: '8F', description: '음악치료실습실, 예술치료실습실, 특수대학원 세미나실' },
      { floor: '9F', description: '일반열람실, 고시원열람실, 열람실 사무실' },
    ],
  },
  {
    id: 'main-building',
    kind: 'building',
    name: '종합관(구 본관)',
    code: 'S1XXX',
    aliases: ['문대', '문과대', '인문대', '구본관', '본관'],
    keywords: [
      '건물',
      '강의실',
      '방목기초교육대학',
      '인문대학',
      '사회과학대학',
      '법과대학',
      '복사실',
      '이마트24',
      '미용실',
      '대강당',
      '글쓰기센터',
      '잉글리쉬카페',
    ],
    categoryLabel: '건물',
    status: '운영중',
    location: '명지대학교 인문캠퍼스 종합관',
    distance: '210m',
    latitude: 37.5803,
    longitude: 126.922549,
    imageUrl: 'https://picsum.photos/seed/main-building/240/240',
    operationHours: '운영 시간 정보 준비중',
    notice:
      '구 본관으로, 방목기초교육대학, 인문대학, 사회과학대학, 법과대학 관련 공간이 있는 건물이에요.',
    Icon: BuildingIcon,
    iconClassName: 'text-blue-20',
    facilities: [
      { id: 'printer', label: '복사실', Icon: PrinterIcon },
      { id: 'convenience-store', label: '이마트24', Icon: ConvenienceStoreIcon },
      { id: 'cafe', label: 'International Cafe', Icon: CafeIcon },
    ],
    floors: [
      {
        floor: '1F',
        description:
          '로비, PC개방실, 글쓰기센터, English Cafe, 복사실, 방목기초교양교수실, 교수휴게실, 미용실',
      },
      { floor: '2F', description: '학생복지봉사팀, 세미나실, 교목실, 소예배실' },
      {
        floor: '3F',
        description: '열람실, 디지털미디어학과 실습실, 명지미디어센터 방송국, 학군단',
      },
      { floor: '4F', description: '강의실, 교수실, 이마트24 무인점포' },
      { floor: '5F', description: '인문교육학습개발원 스튜디오, 법과대학 모의법정실, 세미나실' },
      { floor: '6F', description: '사회과학대학 교학팀, 세미나실, 법과대학 자료실' },
      { floor: '7F', description: '인문대학 교학팀, 교수회의실, 어학실, PC실, 자료실, 세미나실' },
      { floor: '8F', description: '인문대학 대학원연구실' },
      { floor: '9F', description: '영작문 실습실, International Cafe' },
      { floor: '10F', description: '대강당, 기록과학대학원, 시스템실습실, 세미나실, LAB실' },
    ],
  },
  {
    id: 'student-cafeteria',
    kind: 'facility',
    name: '학생식당',
    aliases: ['학식', '학생 식당', '식당'],
    keywords: ['밥', '점심', '식사', '학생회관', '학생식당'],
    parentBuildingId: 'student-center',
    categoryLabel: '식당',
    status: '운영중',
    location: '학생회관 3층',
    distance: '120m',
    latitude: 37.5803,
    longitude: 126.92345,
    imageUrl: 'https://picsum.photos/seed/student-cafeteria/240/240',
    operationHours: '운영 시간 정보 준비중',
    Icon: CafeteriaIcon,
    iconClassName: 'text-[#F57F36]',
    facilities: [],
    floors: [{ floor: '3F', description: '학생식당' }],
  },
  {
    id: 'lieto-coffee',
    kind: 'facility',
    name: '리에토커피',
    aliases: ['리에토', '학생회관 카페', '커피전문점'],
    keywords: ['카페', '커피', '음료', '학생회관'],
    parentBuildingId: 'student-center',
    categoryLabel: '카페',
    status: '운영중',
    location: '학생회관 3층',
    distance: '120m',
    latitude: 37.5803,
    longitude: 126.92345,
    imageUrl: 'https://picsum.photos/seed/lieto-coffee/240/240',
    operationHours: '운영 시간 정보 준비중',
    Icon: CafeIcon,
    iconClassName: 'text-[#8B5E3C]',
    facilities: [],
    floors: [{ floor: '3F', description: '리에토커피' }],
  },
  {
    id: 'student-center-emart24',
    kind: 'facility',
    name: '이마트24',
    aliases: ['이마트24', '학생회관 편의점', '편의점'],
    keywords: ['편의점', '간식', '음료', '학생회관'],
    parentBuildingId: 'student-center',
    categoryLabel: '편의점',
    status: '운영중',
    location: '학생회관 3층',
    distance: '120m',
    latitude: 37.5803,
    longitude: 126.92345,
    imageUrl: 'https://picsum.photos/seed/student-center-emart24/240/240',
    operationHours: '운영 시간 정보 준비중',
    Icon: ConvenienceStoreIcon,
    iconClassName: 'text-[#34AA6F]',
    facilities: [],
    floors: [{ floor: '3F', description: '이마트24' }],
  },
  {
    id: 'main-building-copy-room',
    kind: 'facility',
    name: '복사실',
    aliases: ['프린터', '인쇄실', '복사', '종합관 복사실'],
    keywords: ['출력', '인쇄', '프린트', '종합관', '본관'],
    parentBuildingId: 'main-building',
    categoryLabel: '프린터',
    status: '운영중',
    location: '종합관 1층',
    distance: '210m',
    latitude: 37.5803,
    longitude: 126.922549,
    imageUrl: 'https://picsum.photos/seed/main-building-copy-room/240/240',
    operationHours: '운영 시간 정보 준비중',
    Icon: PrinterIcon,
    iconClassName: 'text-blue-20',
    facilities: [],
    floors: [{ floor: '1F', description: '복사실' }],
  },
  {
    id: 'mcc-starbucks',
    kind: 'facility',
    name: '스타벅스 명지대점',
    aliases: ['스타벅스', '스벅', 'MCC 카페'],
    keywords: ['카페', '커피', '코이노니아홀', 'MCC'],
    parentBuildingId: 'mcc',
    categoryLabel: '카페',
    status: '운영중',
    location: 'MCC관 코이노니아홀 1층',
    distance: '220m',
    latitude: 37.57915,
    longitude: 126.9225,
    imageUrl: 'https://picsum.photos/seed/mcc-starbucks/240/240',
    operationHours: '운영 시간 정보 준비중',
    Icon: CafeIcon,
    iconClassName: 'text-[#34AA6F]',
    facilities: [],
    floors: [{ floor: '1F', description: '스타벅스 명지대점' }],
  },
  {
    id: 'mcc-convenience-zone',
    kind: 'facility',
    name: 'MCC 편의시설',
    aliases: ['이마트에브리데이', '다이소', '올리브영', '세븐일레븐', '편의시설'],
    keywords: ['편의점', '마트', '생활용품', '코이노니아홀', 'MCC'],
    parentBuildingId: 'mcc',
    categoryLabel: '편의시설',
    status: '운영중',
    location: 'MCC관 코이노니아홀 1-2층',
    distance: '220m',
    latitude: 37.57915,
    longitude: 126.9225,
    imageUrl: 'https://picsum.photos/seed/mcc-convenience-zone/240/240',
    operationHours: '운영 시간 정보 준비중',
    Icon: ConvenienceStoreIcon,
    iconClassName: 'text-blue-20',
    facilities: [],
    floors: [
      { floor: '1F', description: '이마트에브리데이, 다이소, 올리브영' },
      { floor: '2F', description: '세븐일레븐' },
    ],
  },
  {
    id: 'mcc-health-gym',
    kind: 'facility',
    name: '건강과땀',
    aliases: ['헬스장', '건강과 땀', 'MCC 헬스장'],
    keywords: ['헬스', '운동', '체육시설', '코이노니아홀', 'MCC'],
    parentBuildingId: 'mcc',
    categoryLabel: '운동 시설',
    status: '운영중',
    location: 'MCC관 코이노니아홀 2층',
    distance: '220m',
    latitude: 37.57915,
    longitude: 126.9225,
    imageUrl: 'https://picsum.photos/seed/mcc-health-gym/240/240',
    operationHours: '운영 시간 정보 준비중',
    Icon: LoungeIcon,
    iconClassName: 'text-[#34AA6F]',
    facilities: [],
    floors: [{ floor: '2F', description: '건강과땀 헬스장' }],
  },
  {
    id: 'library-copy-store',
    kind: 'facility',
    name: '복사실',
    aliases: ['복사문구', '프린터', '문구', '복사', '도서관 복사실'],
    keywords: ['출력', '인쇄', '프린트', '방목학술정보관'],
    parentBuildingId: 'library',
    categoryLabel: '프린터',
    status: '운영중',
    location: '방목학술정보관 1층',
    distance: '340m',
    latitude: 37.58075,
    longitude: 126.924498,
    imageUrl: 'https://picsum.photos/seed/library-copy-store/240/240',
    operationHours: '운영 시간 정보 준비중',
    Icon: PrinterIcon,
    iconClassName: 'text-blue-20',
    facilities: [],
    floors: [{ floor: '1F', description: '복사실' }],
  },
  {
    id: 'hana-bank',
    kind: 'facility',
    name: '하나은행',
    aliases: ['은행', '하나은행', 'atm', '에이티엠'],
    keywords: ['입금', '출금', '현금', '행정동'],
    parentBuildingId: 'administration',
    categoryLabel: '은행·ATM',
    status: '운영중',
    location: '행정동 1층',
    distance: '160m',
    latitude: 37.580098,
    longitude: 126.924244,
    imageUrl: 'https://picsum.photos/seed/hana-bank/240/240',
    operationHours: '운영 시간 정보 준비중',
    Icon: BankIcon,
    iconClassName: 'text-blue-20',
    facilities: [],
    floors: [{ floor: '1F', description: '하나은행' }],
  },
];

export function findPlaceById(placeId?: string | string[] | null) {
  const normalizedId = Array.isArray(placeId) ? placeId[0] : placeId;
  return PLACES.find((place) => place.id === normalizedId);
}

export function getParentBuilding(place: MyeongjiPlace) {
  if (place.kind === 'building') return place;
  return findPlaceById(place.parentBuildingId);
}

export function searchPlaces(keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return [];

  return PLACES.filter((place) =>
    [
      place.name,
      place.code,
      place.categoryLabel,
      place.location,
      ...place.aliases,
      ...place.keywords,
    ]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(normalizedKeyword))
  );
}
