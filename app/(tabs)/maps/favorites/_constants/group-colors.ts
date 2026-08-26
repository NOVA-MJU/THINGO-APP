import type { FavoriteGroupColor } from '@/api/maps-favorites';

// label은 서버에 그룹 색상을 전송할 때 쓰는 식별자라 대문자로 고정.
// FavoriteGroupColor(api/maps-favorites.ts)를 그대로 참조해서, 서버가 모르는 값이 팔레트에 섞이면 타입 에러로 걸러진다.
//
// swatchClassName/badgeClassName을 같은 hex로 각각 bg-/text- 접두사만 다르게 중복 선언하는 이유:
// NativeWind는 코드에 실제로 등장하는 클래스 문자열만 정적으로 스캔해서 스타일을 생성하기 때문에
// `bg-[${hex}]`처럼 런타임에 조합한 문자열은 인식하지 못한다. 그래서 두 형태 모두 리터럴로 적어둬야 한다.
// - swatchClassName: group-edit-sheet.tsx의 색상 선택 원(plain View, bg-*)에 사용
// - badgeClassName: favorites/index.tsx의 FavoriteBadgeIcon(SVG currentColor, text-*)에 사용
export type GroupColor = {
  label: FavoriteGroupColor;
  swatchClassName: string;
  badgeClassName: string;
};

const GROUP_COLORS: GroupColor[] = [
  { label: 'CORAL', swatchClassName: 'bg-[#FF8282]', badgeClassName: 'text-[#FF8282]' },
  { label: 'RED', swatchClassName: 'bg-[#F45353]', badgeClassName: 'text-[#F45353]' },
  { label: 'ORANGE', swatchClassName: 'bg-[#F57F36]', badgeClassName: 'text-[#F57F36]' },
  { label: 'AMBER', swatchClassName: 'bg-[#EDAE26]', badgeClassName: 'text-[#EDAE26]' },
  { label: 'LIME', swatchClassName: 'bg-[#9ED74A]', badgeClassName: 'text-[#9ED74A]' },
  { label: 'GREEN', swatchClassName: 'bg-[#34AA6F]', badgeClassName: 'text-[#34AA6F]' },
  { label: 'SKY', swatchClassName: 'bg-[#8BC7FF]', badgeClassName: 'text-[#8BC7FF]' },
  { label: 'BLUE', swatchClassName: 'bg-[#3F71AE]', badgeClassName: 'text-[#3F71AE]' },
  { label: 'PURPLE', swatchClassName: 'bg-[#9D4FBF]', badgeClassName: 'text-[#9D4FBF]' },
  { label: 'GRAY', swatchClassName: 'bg-[#CDD0D4]', badgeClassName: 'text-[#CDD0D4]' },
];

export default GROUP_COLORS;

// 서버가 내려주는 color 라벨(FavoriteGroupColor)로 FavoriteBadgeIcon용 className을 바로 찾을 때 사용.
// 팔레트에 없는 값이 오면(예: 서버가 새 색상을 추가) 아이콘이 무색이 되는 대신 grey-20으로 대체한다.
const FALLBACK_GROUP_BADGE_CLASSNAME = 'text-grey-20';

export function getGroupBadgeClassName(label: FavoriteGroupColor): string {
  return (
    GROUP_COLORS.find((color) => color.label === label)?.badgeClassName ??
    FALLBACK_GROUP_BADGE_CLASSNAME
  );
}
