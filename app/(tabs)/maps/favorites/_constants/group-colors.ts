import type { FavoriteGroupColor } from '@/api/maps-favorites';

// label은 서버에 그룹 색상을 전송할 때 쓰는 식별자라 대문자로 고정.
// FavoriteGroupColor(api/maps-favorites.ts)를 그대로 참조해서, 서버가 모르는 값이 팔레트에 섞이면 타입 에러로 걸러진다.
export type GroupColor = {
  label: FavoriteGroupColor;
  className: string;
};

const GROUP_COLORS: GroupColor[] = [
  { label: 'CORAL', className: 'bg-[#FF8282]' },
  { label: 'RED', className: 'bg-[#F45353]' },
  { label: 'ORANGE', className: 'bg-[#F57F36]' },
  { label: 'AMBER', className: 'bg-[#EDAE26]' },
  { label: 'LIME', className: 'bg-[#9ED74A]' },
  { label: 'GREEN', className: 'bg-[#34AA6F]' },
  { label: 'SKY', className: 'bg-[#8BC7FF]' },
  { label: 'BLUE', className: 'bg-[#3F71AE]' },
  { label: 'PURPLE', className: 'bg-[#9D4FBF]' },
  { label: 'GRAY', className: 'bg-[#CDD0D4]' },
];

export default GROUP_COLORS;
