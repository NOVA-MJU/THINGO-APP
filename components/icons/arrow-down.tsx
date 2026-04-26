import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface ArrowDownIconProps {
  size?: number;
  className?: string;
}

export default function ArrowDownIcon({ size = 24, className = 'text-[#000]' }: ArrowDownIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <Path d="M17.999 9L11.999 15L5.99902 9" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </StyledSvg>
  );
}
