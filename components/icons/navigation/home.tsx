import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface HomeIconProps {
  size?: number;
  filled?: boolean;
  className?: string;
}

export default function HomeIcon({
  size = 28,
  filled = false,
  className = 'text-black',
}: HomeIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <Path
        d="M6.16667 23C5.52233 23 5 22.4777 5 21.8333V11.6244C5 11.2343 5.19495 10.87 5.51952 10.6537L13.3528 5.43143C13.7447 5.17018 14.2553 5.17018 14.6472 5.43143L22.4805 10.6537C22.805 10.87 23 11.2343 23 11.6244V21.8333C23 22.4777 22.4777 23 21.8333 23H17.4167C16.7723 23 16.25 22.4777 16.25 21.8333V17.1667C16.25 16.5223 15.7277 16 15.0833 16H12.9167C12.2723 16 11.75 16.5223 11.75 17.1667V21.8333C11.75 22.4777 11.2277 23 10.5833 23H6.16667Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.5}
      />
    </StyledSvg>
  );
}
