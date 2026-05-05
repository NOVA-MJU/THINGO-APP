import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface UndoIconProps {
  size?: number;
  className?: string;
}

export default function UndoIcon({ size = 24, className = 'text-[#000]' }: UndoIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 12 12" fill="none" className={className}>
      <Path
        d="M9.49996 7.12496C9.49996 6.08943 8.6605 5.24996 7.62496 5.24996H3.20699L4.60348 6.64645C4.79874 6.84171 4.79874 7.15822 4.60348 7.35348C4.40822 7.54874 4.09171 7.54874 3.89645 7.35348L1.64645 5.10348C1.45118 4.90822 1.45118 4.59171 1.64645 4.39645L3.89645 2.14645C4.09171 1.95118 4.40822 1.95118 4.60348 2.14645C4.79874 2.34171 4.79874 2.65822 4.60348 2.85348L3.20699 4.24996H7.62496C9.21278 4.24996 10.5 5.53714 10.5 7.12496C10.5 8.71278 9.21278 9.99996 7.62496 9.99996H4.24996C3.97382 9.99996 3.74996 9.7761 3.74996 9.49996C3.74996 9.22382 3.97382 8.99996 4.24996 8.99996H7.62496C8.6605 8.99996 9.49996 8.1605 9.49996 7.12496Z"
        fill="currentColor"
      />
    </StyledSvg>
  );
}
