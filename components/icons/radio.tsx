import { cssInterop } from 'nativewind';
import Svg, { Circle } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface RadioIconProps {
  size?: number;
  checked?: boolean;
  className?: string;
}

export default function RadioIcon({ size = 20, checked = false, className }: RadioIconProps) {
  const colorClassName = className ?? (checked ? 'text-[#3B96FF]' : 'text-[#CDD0D4]');

  return (
    <StyledSvg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      className={colorClassName}
    >
      <Circle
        cx="10"
        cy="10"
        r={checked ? 5.5 : 7.5}
        fill={checked ? 'white' : 'none'}
        stroke="currentColor"
        strokeWidth={checked ? 5 : 1}
      />
    </StyledSvg>
  );
}
