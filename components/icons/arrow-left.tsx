import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface ArrowLeftIconProps {
  size?: number;
  className?: string;
}

export default function ArrowLeftIcon({ size = 24, className = 'text-[#000]' }: ArrowLeftIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <Path d="M15.6 19.2L8.4 12L15.6 4.8" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </StyledSvg>
  );
}
