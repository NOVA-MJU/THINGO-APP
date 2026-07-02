import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface BusIconProps {
  size?: number;
  className?: string;
}

export default function BusIcon({ size = 28, className = 'text-black' }: BusIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <Path
        d="M5.8 7.85059L3.75 8.87559M11.95 7.85059H16.05M24.25 8.87559L22.2 7.85059"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20.1498 4.77539H7.8498C6.71762 4.77539 5.7998 5.69321 5.7998 6.82539V19.1254C5.7998 20.2576 6.71762 21.1754 7.8498 21.1754H20.1498C21.282 21.1754 22.1998 20.2576 22.1998 19.1254V6.82539C22.1998 5.69321 21.282 4.77539 20.1498 4.77539Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5.7998 12.9756H22.1998M9.8998 17.0756H9.91005M18.0998 17.0756H18.1101M7.8498 21.1756V23.2256M20.1498 23.2256V21.1756"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </StyledSvg>
  );
}
