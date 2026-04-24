import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface ArrowBackIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function ArrowBackIcon({ width = 20, height = 20, className = 'text-[#000]' }: ArrowBackIconProps) {
  return (
    <StyledSvg width={width} height={height} viewBox="0 0 20 20" fill="none" className={className}>
      <Path d="M13 16L7 10L13 4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </StyledSvg>
  );
}
