import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface ExploreIconProps {
  size?: number;
  filled?: boolean;
  className?: string;
}

export default function ExploreIcon({ size = 28, filled = false, className = 'text-black' }: ExploreIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <Path
        d="M5 5H12.0771V12.07H5V5ZM15.5291 5H22.6059V12.07H15.5291V5ZM5 15.5314H12.0771V22.6059H5V15.5314Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16.5586 21.895C15.8511 21.1875 15.4536 20.2279 15.4536 19.2273C15.4536 18.2267 15.8511 17.2671 16.5586 16.5596C17.2661 15.8521 18.2257 15.4546 19.2263 15.4546C20.2269 15.4546 21.1865 15.8521 21.894 16.5596C22.6015 17.2671 22.999 18.2267 22.999 19.2273C22.999 20.2279 22.6015 21.1875 21.894 21.895C21.1865 22.6025 20.2269 23 19.2263 23C18.2257 23 17.2661 22.6025 16.5586 21.895Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </StyledSvg>
  );
}
