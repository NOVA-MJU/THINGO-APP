import Svg, { Circle } from 'react-native-svg';

interface MyeongwolIconProps {
  size?: number;
}

export default function MyeongwolIcon({ size = 28 }: MyeongwolIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Circle cx="11" cy="14" r="9" fill="#fff08f" />
      <Circle cx="19" cy="14" r="9" fill="#3e3e3d" />
    </Svg>
  );
}
