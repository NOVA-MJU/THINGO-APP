import { cssInterop } from 'nativewind';
import Svg, { Circle, Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface InfoIconProps {
  size?: number;
  className?: string;
}

export default function InfoIcon({ size = 16, className = 'text-black' }: InfoIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <Circle cx="8" cy="8" r="6.33333" stroke="currentColor" strokeWidth="1.33333" />
      <Path
        d="M7.99902 4.66797H8.00569"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
      />
      <Path
        d="M6.66602 7.33594H7.99935V10.6693M6.66602 10.6693H9.33268"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </StyledSvg>
  );
}
