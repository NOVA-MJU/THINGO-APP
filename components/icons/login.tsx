import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface LoginIconProps {
  size?: number;
  className?: string;
}

export default function LoginIcon({ size = 24, className = 'text-black' }: LoginIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <Path
        d="M14.3335 19H17.4446C17.8572 19 18.2528 18.8361 18.5446 18.5444C18.8363 18.2527 19.0002 17.857 19.0002 17.4444V6.55556C19.0002 6.143 18.8363 5.74733 18.5446 5.45561C18.2528 5.16389 17.8572 5 17.4446 5H14.3335"
        stroke="currentColor"
        strokeWidth="1.55556"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.4443 8.11133L14.3332 12.0002L10.4443 15.8891"
        stroke="currentColor"
        strokeWidth="1.55556"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14.3333 12H5"
        stroke="currentColor"
        strokeWidth="1.55556"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </StyledSvg>
  );
}
