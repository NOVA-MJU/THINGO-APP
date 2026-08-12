import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

type PlusIconProps = {
  size?: number;
  className?: string;
};

export default function PlusIcon({ size = 16, className = 'text-black' }: PlusIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <Path
        d="M8.0791 1.08398C8.4933 1.08398 8.82907 1.41979 8.8291 1.83398V7.3291H14.3252C14.7393 7.3291 15.075 7.66506 15.0752 8.0791C15.0752 8.49332 14.7394 8.8291 14.3252 8.8291H8.8291V14.3252C8.8291 14.7394 8.49332 15.0752 8.0791 15.0752C7.66504 15.075 7.3291 14.7393 7.3291 14.3252V8.8291H1.83398C1.41979 8.82908 1.08398 8.4933 1.08398 8.0791C1.08418 7.66507 1.41991 7.32912 1.83398 7.3291H7.3291V1.83398C7.32913 1.4199 7.66506 1.08416 8.0791 1.08398Z"
        fill="currentColor"
      />
    </StyledSvg>
  );
}
