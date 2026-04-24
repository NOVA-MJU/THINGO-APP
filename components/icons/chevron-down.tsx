import Svg, { Path } from 'react-native-svg';

interface ChevronDownIconProps {
  width?: number;
  height?: number;
  color?: string;
}

export default function ChevronDownIcon({ width = 24, height = 24, color = '#000' }: ChevronDownIconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path d="M17.999 9L11.999 15L5.99902 9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
