import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface ResetIconProps {
  size?: number;
  className?: string;
}

export default function ResetIcon({ size = 28, className = 'text-black' }: ResetIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <Path
        d="M7.37868 7.37868C10.7975 3.95988 16.2454 3.78004 19.8765 6.83916L20.25 7.16913V5.25C20.25 4.83579 20.5858 4.5 21 4.5C21.4142 4.5 21.75 4.83579 21.75 5.25V9.25C21.75 9.66421 21.4142 10 21 10H17C16.5858 10 16.25 9.66421 16.25 9.25C16.25 8.83579 16.5858 8.5 17 8.5H19.2159L18.8345 8.15398C15.7914 5.45558 11.1325 5.56229 8.43934 8.43934C5.36771 11.511 5.36771 16.489 8.43934 19.5607C11.511 22.6323 16.489 22.6323 19.5607 19.5607C20.7471 18.3742 21.5036 16.8559 21.7438 15.228C21.8043 14.8182 22.1856 14.5351 22.5954 14.5956C23.0052 14.6561 23.2883 15.0374 23.2278 15.4472C22.9417 17.386 22.0408 19.1983 20.6213 20.6213C16.9645 24.2782 11.0355 24.2782 7.37868 20.6213C3.72181 16.9645 3.72181 11.0355 7.37868 7.37868Z"
        fill="currentColor"
      />
    </StyledSvg>
  );
}
