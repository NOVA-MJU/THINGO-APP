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
      <Circle cx={12} cy={12} r={8} fill="currentColor" />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.6044 8.21967C14.8972 7.92678 15.372 7.92678 15.6649 8.21967C15.9577 8.51257 15.9578 8.98735 15.6649 9.28022L13.0028 11.9423L15.6649 14.6044C15.9578 14.8973 15.9578 15.3721 15.6649 15.665C15.372 15.9576 14.8972 15.9578 14.6044 15.665L11.9422 13.0029L9.28014 15.665C8.98725 15.9577 8.51244 15.9578 8.21959 15.665C7.92675 15.3721 7.92685 14.8973 8.21959 14.6044L10.8817 11.9423L8.21959 9.28022C7.92691 8.9874 7.92701 8.51254 8.21959 8.21967C8.51244 7.92682 8.98724 7.9269 9.28014 8.21967L11.9422 10.8818L14.6044 8.21967Z"
        fill="white"
      />
    </StyledSvg>
  );
}
