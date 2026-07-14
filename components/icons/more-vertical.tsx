import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface MoreVerticalIconProps {
  size?: number;
  className?: string;
}

export default function MoreVerticalIcon({
  size = 20,
  className = 'text-black',
}: MoreVerticalIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <Path
        d="M8.75 16.25C8.75 16.9375 9.3125 17.5 10 17.5C10.6875 17.5 11.25 16.9375 11.25 16.25C11.25 15.5625 10.6875 15 10 15C9.3125 15 8.75 15.5625 8.75 16.25ZM8.75 3.75C8.75 4.4375 9.3125 5 10 5C10.6875 5 11.25 4.4375 11.25 3.75C11.25 3.0625 10.6875 2.5 10 2.5C9.3125 2.5 8.75 3.0625 8.75 3.75ZM8.75 10C8.75 10.6875 9.3125 11.25 10 11.25C10.6875 11.25 11.25 10.6875 11.25 10C11.25 9.3125 10.6875 8.75 10 8.75C9.3125 8.75 8.75 9.3125 8.75 10Z"
        fill="currentColor"
      />
    </StyledSvg>
  );
}
