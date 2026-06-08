import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface BreakRoomIconProps {
  size?: number;
  className?: string;
}

export default function BreakRoomIcon({ size = 28, className = 'text-black' }: BreakRoomIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.75 6.25C4.16421 6.25 4.5 6.58579 4.5 7V16.167H12.2246V9.33301C12.2248 8.91907 12.5607 8.58322 12.9746 8.58301H22.7129C23.353 8.58313 23.9441 8.87354 24.3633 9.35059C24.7797 9.82458 24.9999 10.4492 25 11.083V21C25 21.4142 24.6642 21.75 24.25 21.75C23.8358 21.75 23.5 21.4142 23.5 21V17.667H4.5V21C4.5 21.4142 4.16421 21.75 3.75 21.75C3.33579 21.75 3 21.4142 3 21V7C3 6.58579 3.33579 6.25 3.75 6.25ZM13.7246 16.167H23.5V11.083C23.4999 10.7888 23.3964 10.5231 23.2363 10.3408C23.079 10.1618 22.888 10.0831 22.7129 10.083H13.7246V16.167Z"
        fill="currentColor"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.66699 9.16797C10.0475 9.16817 11.167 10.2874 11.167 11.668C11.167 13.0486 10.0475 14.1678 8.66699 14.168C7.28628 14.168 6.16699 13.0487 6.16699 11.668C6.16699 10.2873 7.28628 9.16797 8.66699 9.16797ZM8.66699 10.668C8.11471 10.668 7.66699 11.1157 7.66699 11.668C7.66699 12.2203 8.11471 12.668 8.66699 12.668C9.21911 12.6678 9.66699 12.2201 9.66699 11.668C9.66699 11.1158 9.21911 10.6682 8.66699 10.668Z"
        fill="currentColor"
      />
    </StyledSvg>
  );
}
