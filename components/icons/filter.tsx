import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

type FilterIconProps = {
  size?: number;
  className?: string;
};

export default function FilterIcon({ size = 24, className = 'text-[#AEB2B6]' }: FilterIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <Path
        d="M12 19H4M20 5L17 5M20 19H16M13 5H4M7 12H4M20 12H11"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M16 19C16 17.8954 15.1046 17 14 17C12.8954 17 12 17.8954 12 19C12 20.1046 12.8954 21 14 21C15.1046 21 16 20.1046 16 19Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M11 12C11 10.8954 10.1046 10 9 10C7.89543 10 7 10.8954 7 12C7 13.1046 7.89543 14 9 14C10.1046 14 11 13.1046 11 12Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M17 5C17 3.89543 16.1046 3 15 3C13.8954 3 13 3.89543 13 5C13 6.10457 13.8954 7 15 7C16.1046 7 17 6.10457 17 5Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </StyledSvg>
  );
}
