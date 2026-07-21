import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

type AlertOffIconProps = {
  size?: number;
  className?: string;
};

export default function AlertOffIcon({ size = 20, className = 'text-grey-30' }: AlertOffIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <Path
        d="M15.3595 12.2355C15.122 11.8561 14.996 11.4175 14.9957 10.9699V7.65549C14.9957 6.28817 14.4525 4.97685 13.4857 4.01001C12.5189 3.04317 11.2075 2.5 9.84023 2.5C8.47291 2.5 7.16159 3.04317 6.19475 4.01001C5.22791 4.97685 4.68474 6.28817 4.68474 7.65549V10.9683C4.68481 11.4165 4.55875 11.8556 4.32099 12.2355L3.45497 13.6205C3.37967 13.741 3.33799 13.8794 3.33426 14.0214C3.33053 14.1635 3.36489 14.3039 3.43377 14.4282C3.50264 14.5525 3.60353 14.656 3.72595 14.7282C3.84838 14.8003 3.98787 14.8383 4.12995 14.8383H15.5505C15.6926 14.8383 15.8321 14.8003 15.9545 14.7282C16.0769 14.656 16.1778 14.5525 16.2467 14.4282C16.3156 14.3039 16.3499 14.1635 16.3462 14.0214C16.3425 13.8794 16.3008 13.741 16.2255 13.6205L15.3595 12.2355Z"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7.55469 15.4336C7.6908 16.0258 7.99088 16.5495 8.40796 16.9221C8.82505 17.2962 9.33606 17.4983 9.8614 17.4983C10.3867 17.4983 10.8978 17.2962 11.3148 16.9229C11.7319 16.5487 12.0312 16.0258 12.1681 15.4336"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="round"
      />
      <Path
        d="M2.5 5.83203L17.9167 14.7326"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="round"
      />
    </StyledSvg>
  );
}
