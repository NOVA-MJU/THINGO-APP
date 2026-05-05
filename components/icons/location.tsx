import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface LocationIconProps {
  size?: number;
  className?: string;
}

export default function LocationIcon({ size = 24, className = 'text-[#000]' }: LocationIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.81979 1.70418C6.11056 -0.56806 9.72944 -0.568061 12.0202 1.70418C14.1188 3.78639 14.4421 7.13594 12.7825 9.60524L8.79335 15.5398C8.38086 16.1534 7.45914 16.1534 7.04664 15.5398L3.05752 9.60524C1.3979 7.13594 1.72117 3.78639 3.81979 1.70418ZM7.92 2.43709C6.20948 2.43709 4.82281 3.87022 4.82253 5.63752C4.82226 7.40482 6.20931 8.83795 7.92 8.83795C9.63067 8.83796 11.0175 7.40507 11.0175 5.63752C11.0175 3.86997 9.63051 2.43709 7.92 2.43709Z"
        fill="currentColor"
      />
    </StyledSvg>
  );
}
