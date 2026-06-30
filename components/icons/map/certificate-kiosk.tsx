import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface CertificateKioskIconProps {
  size?: number;
  className?: string;
}

export default function CertificateKioskIcon({
  size = 28,
  className = 'text-black',
}: CertificateKioskIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <Path
        d="M10.1533 22.8235H6.66667C5.95942 22.8235 5.28115 22.5756 4.78105 22.1344C4.28095 21.6931 4 21.0946 4 20.4706V6.35294C4 5.7289 4.28095 5.13042 4.78105 4.68916C5.28115 4.2479 5.95942 4 6.66667 4H17.3333C18.0406 4 18.7189 4.2479 19.219 4.68916C19.719 5.13042 20 5.7289 20 6.35294V15.7647M16 21.6471L18.6667 24L24 19.2941M9.33333 8.70588H14.6667M9.33333 13.4118H12"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </StyledSvg>
  );
}
