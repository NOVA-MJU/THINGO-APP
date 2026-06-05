import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface MapIconProps {
  size?: number;
  filled?: boolean;
  className?: string;
}

export default function MapIcon({ size = 28, filled = false, className = 'text-black' }: MapIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      {filled ? (
        <Path
          d="M16.834 20.6504L11.334 23.0781V7.50098L16.834 5.07324V20.6504ZM3.66699 6.49609C3.66712 5.65334 4.53364 5.08867 5.30469 5.42871L9.83398 7.42773V23.0049L4.36328 20.5898C3.9405 20.4032 3.66699 19.9846 3.66699 19.5225V6.49609ZM23.9717 7.48926C24.3942 7.67585 24.6668 8.09378 24.667 8.55566V21.582C24.667 22.425 23.8005 22.9898 23.0293 22.6494L18.334 20.5771V5L23.9717 7.48926Z"
          fill="currentColor"
        />
      ) : (
        <Path
          d="M17.833 20.5769L10.833 23.6667L4.52857 20.8839C4.10579 20.6973 3.83301 20.2787 3.83301 19.8166L3.83301 6.79022C3.83301 5.94724 4.69958 5.3825 5.47078 5.72291L10.833 8.08977M10.833 23.6667V8.08977M10.833 8.08977L17.833 5L24.1374 7.78275C24.5602 7.96936 24.833 8.38794 24.833 8.85007V21.8764C24.833 22.7194 23.9664 23.2842 23.1952 22.9438L17.833 20.5769M17.833 20.5769V5"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      )}
    </StyledSvg>
  );
}
