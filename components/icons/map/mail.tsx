import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface MailIconProps {
  size?: number;
  className?: string;
}

export default function MailIcon({ size = 28, className = 'text-black' }: MailIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <Path
        d="M24.1025 5.00488C24.6067 5.05621 25 5.48232 25 6V22L24.9951 22.1025C24.9472 22.573 24.573 22.9472 24.1025 22.9951L24 23H4C3.48232 23 3.05621 22.6067 3.00488 22.1025L3 22V6C3 5.44772 3.44772 5 4 5H24L24.1025 5.00488ZM15.2051 15.3896C14.5297 16.031 13.4703 16.031 12.7949 15.3896L4.5 7.50879V21.5H23.5V7.50879L15.2051 15.3896ZM13.8281 14.3018C13.9246 14.3933 14.0754 14.3933 14.1719 14.3018L22.3848 6.5H5.61523L13.8281 14.3018Z"
        fill="currentColor"
      />
    </StyledSvg>
  );
}
