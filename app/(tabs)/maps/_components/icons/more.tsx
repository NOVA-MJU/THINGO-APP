import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface MoreIconProps {
  size?: number;
  className?: string;
}

export default function MoreIcon({ size = 20, className = 'text-black' }: MoreIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <Path
        d="M3.75 8.75C3.0625 8.75 2.5 9.3125 2.5 10C2.5 10.6875 3.0625 11.25 3.75 11.25C4.4375 11.25 5 10.6875 5 10C5 9.3125 4.4375 8.75 3.75 8.75ZM16.25 8.75C15.5625 8.75 15 9.3125 15 10C15 10.6875 15.5625 11.25 16.25 11.25C16.9375 11.25 17.5 10.6875 17.5 10C17.5 9.3125 16.9375 8.75 16.25 8.75ZM10 8.75C9.3125 8.75 8.75 9.3125 8.75 10C8.75 10.6875 9.3125 11.25 10 11.25C10.6875 11.25 11.25 10.6875 11.25 10C11.25 9.3125 10.6875 8.75 10 8.75Z"
        fill="currentColor"
      />
    </StyledSvg>
  );
}
