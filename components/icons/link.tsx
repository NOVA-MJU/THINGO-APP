import { cssInterop } from 'nativewind';
import Svg, { Circle, Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface LinkIconProps {
  size?: number;
  className?: string;
}

export default function LinkIcon({ size = 24, className = 'text-[#1778FF]' }: LinkIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <Circle cx="12" cy="12" r="10" fill="#E8F1FF" />
      <Path
        d="M12.3825 15.4427L11.6175 16.2078C10.5612 17.2641 8.84855 17.2641 7.79223 16.2078C6.73592 15.1515 6.73592 13.4388 7.79223 12.3825L8.55728 11.6175M15.4427 12.3825L16.2078 11.6175C17.2641 10.5612 17.2641 8.84854 16.2078 7.79223C15.1515 6.73592 13.4388 6.73592 12.3825 7.79223L11.6175 8.55728M10.1066 13.8934L13.8934 10.1066"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </StyledSvg>
  );
}
