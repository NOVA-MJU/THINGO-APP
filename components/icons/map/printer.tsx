import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface PrinterIconProps {
  size?: number;
  className?: string;
}

export default function PrinterIcon({ size = 28, className = 'text-black' }: PrinterIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <Path
        d="M19.4545 21.2727H22.1818C22.664 21.2727 23.1265 21.0812 23.4675 20.7402C23.8084 20.3992 24 19.9368 24 19.4545V10.3636C24 9.88142 23.8084 9.41896 23.4675 9.07799C23.1265 8.73701 22.664 8.54545 22.1818 8.54545H5.81818C5.33597 8.54545 4.87351 8.73701 4.53253 9.07799C4.19156 9.41896 4 9.88142 4 10.3636V19.4545C4 19.9368 4.19156 20.3992 4.53253 20.7402C4.87351 21.0812 5.33597 21.2727 5.81818 21.2727H8.54545M8.54545 8.54545V4H19.4545V8.54545M7.63636 14.9091H20.3636M8.54545 14.9091V24H19.4545V14.9091"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M19.25 11.667H20.4167" stroke="currentColor" strokeLinecap="round" />
    </StyledSvg>
  );
}
