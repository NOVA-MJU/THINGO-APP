import { cssInterop } from 'nativewind';
import Svg, { Circle, Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface BackCircleIconProps {
  size?: number;
  className?: string;
}

// 원형 배경의 뒤로가기 버튼 아이콘. 배경색은 className으로 바꿀 수 있고
// (예: FavoriteBadgeIcon과 동일한 패턴), 안쪽 화살표는 항상 흰색으로 고정된다.
export default function BackCircleIcon({
  size = 24,
  className = 'text-[#CDD0D4]',
}: BackCircleIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <Circle cx="12" cy="12" r="12" fill="currentColor" />
      <Path
        d="M14 18L8 12L14 6"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </StyledSvg>
  );
}
