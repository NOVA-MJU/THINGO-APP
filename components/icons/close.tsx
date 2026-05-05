import { cssInterop } from 'nativewind';
import Svg, { Circle, Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface CloseIconProps {
  size?: number;
  className?: string;
}

export default function CloseIcon({ size = 24, className = 'text-[#CDD0D4]' }: CloseIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <Circle cx={12} cy={12} r={12} fill="currentColor" />
      <Path
        d="M15.9599 6.38322C16.37 5.97317 17.0352 5.97219 17.4453 6.38225C17.8552 6.79231 17.8543 7.45759 17.4443 7.8676L13.3984 11.9135L17.4453 15.9604C17.8548 16.3704 17.855 17.0348 17.4453 17.4447C17.0352 17.8548 16.37 17.8548 15.9599 17.4447L11.913 13.3979L7.86714 17.4447C7.45709 17.8545 6.79274 17.8546 6.38276 17.4447C5.97279 17.0348 5.97295 16.3704 6.38276 15.9604L10.4287 11.9135L6.38276 7.8676C5.9729 7.45753 5.97277 6.79224 6.38276 6.38225C6.79282 5.97228 7.45809 5.9732 7.86811 6.38322L11.914 10.4291L15.9599 6.38322Z"
        fill="white"
      />
    </StyledSvg>
  );
}
