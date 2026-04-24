import Svg, { Path } from 'react-native-svg';

interface ArrowBackIconProps {
  width?: number;
  height?: number;
  color?: string;
}

export default function ArrowBackIcon({ width = 20, height = 20, color = '#000' }: ArrowBackIconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 20 20" fill="none">
      <Path d="M13 16L7 10L13 4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
