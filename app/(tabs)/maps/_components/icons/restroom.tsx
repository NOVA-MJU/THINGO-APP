import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface RestroomIconProps {
  size?: number;
  className?: string;
}

export default function RestroomIcon({ size = 28, className = 'text-black' }: RestroomIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <Path
        d="M7.91634 7.66667C9.20501 7.66667 10.2497 6.622 10.2497 5.33333C10.2497 4.04467 9.20501 3 7.91634 3C6.62768 3 5.58301 4.04467 5.58301 5.33333C5.58301 6.622 6.62768 7.66667 7.91634 7.66667Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.4163 7.66667C19.705 7.66667 20.7497 6.622 20.7497 5.33333C20.7497 4.04467 19.705 3 18.4163 3C17.1277 3 16.083 4.04467 16.083 5.33333C16.083 6.622 17.1277 7.66667 18.4163 7.66667Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 11.167H10.8333L9.66667 24.0003H6.16667L5 11.167ZM15.5 11.167H21.3333L22.5 17.5837H20.75L20.1667 24.0003H16.6667L16.0833 17.5837H14.3333L15.5 11.167Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </StyledSvg>
  );
}
