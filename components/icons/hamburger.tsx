import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface HamburgerIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function HamburgerIcon({ width = 24, height = 24, className = 'text-[#17171B]' }: HamburgerIconProps) {
  return (
    <StyledSvg width={width} height={height} viewBox="0 0 24 24" fill="none" className={className}>
      <Path
        d="M4.125 18.375H19.875M4.125 12.375H19.875M4.125 6.375H19.875"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </StyledSvg>
  );
}
