import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface StudyRoomIconProps {
  size?: number;
  className?: string;
}

export default function StudyRoomIcon({ size = 28, className = 'text-black' }: StudyRoomIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <Path
        d="M3 24.25V12.9746C3.00021 12.5606 3.33594 12.2246 3.75 12.2246H7.09961V9.625H4.77539C4.55079 9.625 4.33777 9.52422 4.19531 9.35059C4.05286 9.17682 3.99597 8.94787 4.04004 8.72754L5.06445 3.60254L5.10156 3.47656C5.21226 3.19336 5.48699 3.00008 5.7998 3H9.90039L10.0312 3.01172C10.3306 3.06477 10.5743 3.29591 10.6357 3.60254L11.6602 8.72754C11.7042 8.94787 11.6473 9.17682 11.5049 9.35059C11.3624 9.52428 11.1494 9.625 10.9248 9.625H8.59961V12.2246H24.25C24.6641 12.2246 24.9998 12.5606 25 12.9746V24.25C25 24.6642 24.6642 25 24.25 25H16.0498C15.6357 24.9999 15.2998 24.6641 15.2998 24.25V16.5439H4.5V24.25C4.5 24.6642 4.16421 25 3.75 25C3.33579 25 3 24.6642 3 24.25ZM16.7998 23.5H23.5V20.7715H16.7998V23.5ZM16.7998 19.2715H23.5V16.5439H16.7998V19.2715ZM4.5 15.0439H23.5V13.7246H4.5V15.0439ZM5.69043 8.125H10.0098L9.28516 4.5H6.41504L5.69043 8.125Z"
        fill="currentColor"
      />
    </StyledSvg>
  );
}
