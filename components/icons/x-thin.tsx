import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface XThinIconProps {
  size?: number;
  className?: string;
}

export default function XThinIcon({ size = 24, className = 'text-black' }: XThinIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.7185 4.22102C19.0115 3.92835 19.4863 3.9282 19.7791 4.22102C20.0718 4.51385 20.0717 4.98869 19.7791 5.28157L13.0603 12.0003L19.7791 18.7191C20.0717 19.012 20.0719 19.4868 19.7791 19.7796C19.4863 20.0723 19.0114 20.0722 18.7185 19.7796L11.9998 13.0609L5.28104 19.7796C4.98816 20.0722 4.5133 20.0723 4.2205 19.7796C3.9277 19.4868 3.9279 19.012 4.2205 18.7191L10.9392 12.0003L4.2205 5.28157C3.92791 4.98871 3.92784 4.51384 4.2205 4.22102C4.5133 3.92822 4.98813 3.92839 5.28104 4.22102L11.9998 10.9398L18.7185 4.22102Z"
        fill="currentColor"
      />
    </StyledSvg>
  );
}
