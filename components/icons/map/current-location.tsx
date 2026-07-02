import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface CurrentLocationIconProps {
  size?: number;
  className?: string;
}

export default function CurrentLocationIcon({
  size = 28,
  className = 'text-black',
}: CurrentLocationIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <Path
        d="M24.25 14C24.25 19.6609 19.6609 24.25 14 24.25M24.25 14C24.25 8.33908 19.6609 3.75 14 3.75M24.25 14H19.125M14 24.25C8.33908 24.25 3.75 19.6609 3.75 14M14 24.25V19.125M3.75 14C3.75 8.33908 8.33908 3.75 14 3.75M3.75 14H8.875M14 3.75V8.875"
        stroke="currentColor"
        strokeWidth={1.5}
      />
    </StyledSvg>
  );
}
