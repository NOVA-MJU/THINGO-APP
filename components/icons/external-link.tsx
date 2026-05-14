import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface ExternalLinkIconProps {
  size?: number;
  className?: string;
}

export default function ExternalLinkIcon({
  size = 24,
  className = 'text-black',
}: ExternalLinkIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <Path
        d="M12.9167 7.875H16.125V11.0833M16.125 13.2545V15.4375C16.125 15.6198 16.0526 15.7947 15.9236 15.9236C15.7947 16.0526 15.6198 16.125 15.4375 16.125H8.5625C8.38016 16.125 8.2053 16.0526 8.07636 15.9236C7.94743 15.7947 7.875 15.6198 7.875 15.4375V8.5625C7.875 8.38016 7.94743 8.2053 8.07636 8.07636C8.2053 7.94743 8.38016 7.875 8.5625 7.875H10.625M12.4125 11.5875L15.9187 8.08125"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </StyledSvg>
  );
}
