import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

type MinusIconProps = {
  size?: number;
  className?: string;
};

// PlusIcon의 가로 획만 남긴 아이콘 (같은 굵기·끝 처리를 맞추기 위해 plus.tsx 경로에서 가져옴)
export default function MinusIcon({ size = 16, className = 'text-black' }: MinusIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <Path
        d="M1.83398 7.3291H14.3252C14.7393 7.3291 15.075 7.66506 15.0752 8.0791C15.0752 8.49332 14.7394 8.8291 14.3252 8.8291H1.83398C1.41979 8.82908 1.08398 8.4933 1.08398 8.0791C1.08418 7.66507 1.41991 7.32912 1.83398 7.3291Z"
        fill="currentColor"
      />
    </StyledSvg>
  );
}
