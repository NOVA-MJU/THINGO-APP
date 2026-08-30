import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface BulletListIconProps {
  size?: number;
  className?: string;
}

export default function BulletListIcon({
  size = 24,
  className = 'text-black',
}: BulletListIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <Path
        d="M5 7H5.00889M5 12H5.00889M5 17H5.00889M8.44444 7L19 7M8.44444 12H19M8.44444 17H19"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </StyledSvg>
  );
}
