import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface ParkingIconProps {
  size?: number;
  className?: string;
}

export default function ParkingIcon({ size = 28, className = 'text-black' }: ParkingIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <Path
        d="M21.25 4C22.7688 4 24 5.23122 24 6.75V21.25C24 22.7688 22.7688 24 21.25 24H6.75C5.23122 24 4 22.7688 4 21.25V6.75C4 5.23122 5.23122 4 6.75 4H21.25ZM6.75 5.5C6.05964 5.5 5.5 6.05964 5.5 6.75V21.25C5.5 21.9404 6.05964 22.5 6.75 22.5H21.25C21.9404 22.5 22.5 21.9404 22.5 21.25V6.75C22.5 6.05964 21.9404 5.5 21.25 5.5H6.75ZM15.125 8C17.127 8 18.75 9.62297 18.75 11.625C18.75 13.627 17.127 15.25 15.125 15.25H11.75V20.25H10.25V8H15.125ZM11.75 13.75H15.125C16.2986 13.75 17.25 12.7986 17.25 11.625C17.25 10.4514 16.2986 9.5 15.125 9.5H11.75V13.75Z"
        fill="currentColor"
      />
    </StyledSvg>
  );
}
