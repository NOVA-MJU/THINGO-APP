import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface ArrowRightIconProps {
  size?: number;
  className?: string;
}

export default function ArrowRightIcon({ size = 24, className = 'text-[#000]' }: ArrowRightIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <Path d="M8.4 4.8L15.6 12L8.4 19.2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </StyledSvg>
  );
}
