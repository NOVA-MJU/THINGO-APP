import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface StarIconProps {
  size?: number;
  className?: string;
}

export default function StarIcon({ size = 24, className = 'text-black' }: StarIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <Path
        d="M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.49l-5.87 3.09 1.12-6.54L2.5 9.41l6.56-.95L12 2.5z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </StyledSvg>
  );
}
