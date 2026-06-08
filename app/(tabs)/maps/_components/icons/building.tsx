import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface BuildingIconProps {
  size?: number;
  className?: string;
}

export default function BuildingIcon({ size = 28, className = 'text-black' }: BuildingIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <Path
        d="M15 5C16.5188 5 17.75 6.23122 17.75 7.75V11H21C22.5188 11 23.75 12.2312 23.75 13.75V23.5H24.25C24.6642 23.5 25 23.8358 25 24.25C25 24.6642 24.6642 25 24.25 25H3.75C3.33579 25 3 24.6642 3 24.25C3 23.8358 3.33579 23.5 3.75 23.5H4.25V7.75C4.25 6.23122 5.48122 5 7 5H15ZM7 6.5C6.30964 6.5 5.75 7.05964 5.75 7.75V23.5H8.25V17.75C8.25 17.3358 8.58579 17 9 17H13C13.4142 17 13.75 17.3358 13.75 17.75V23.5H16.25V7.75C16.25 7.05964 15.6904 6.5 15 6.5H7ZM9.75 23.5H12.25V18.5H9.75V23.5ZM17.75 23.5H22.25V13.75C22.25 13.0596 21.6904 12.5 21 12.5H17.75V23.5ZM13.25 12.8418C13.6642 12.8418 14 13.1776 14 13.5918C14 14.006 13.6642 14.3418 13.25 14.3418H8.75C8.33579 14.3418 8 14.006 8 13.5918C8 13.1776 8.33579 12.8418 8.75 12.8418H13.25ZM13.25 9.8418C13.6642 9.8418 14 10.1776 14 10.5918C14 11.006 13.6642 11.3418 13.25 11.3418H8.75C8.33579 11.3418 8 11.006 8 10.5918C8 10.1776 8.33579 9.8418 8.75 9.8418H13.25Z"
        fill="currentColor"
      />
    </StyledSvg>
  );
}
