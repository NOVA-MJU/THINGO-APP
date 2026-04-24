import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface HeartIconProps {
  width?: number;
  height?: number;
  filled?: boolean;
  className?: string;
}

export default function HeartIcon({ width = 24, height = 24, filled = false, className = 'text-[#000]' }: HeartIconProps) {
  return (
    <StyledSvg width={width} height={height} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} className={className}>
      <Path
        d="M15.1504 6.25C16.8404 6.25022 18.2498 7.67 18.25 9.47168C18.25 11.48 17.1411 13.4661 15.1162 15.3818C14.4353 16.0255 13.6956 16.5962 12.9502 17.1162C12.8182 17.2079 12.6924 17.2943 12.5732 17.374L12.2363 17.5928C12.1623 17.6392 12.1001 17.6796 12.0547 17.709C12.0316 17.7239 12.0141 17.7352 12 17.7441C11.9859 17.7352 11.9684 17.7239 11.9453 17.709C11.8999 17.6796 11.8377 17.6392 11.7637 17.5928C11.6585 17.5269 11.546 17.4538 11.4268 17.374L11.0498 17.1162C10.3044 16.5962 9.56466 16.0255 8.88379 15.3818C6.85887 13.4661 5.75 11.48 5.75 9.47168C5.75017 7.67 7.15963 6.25022 8.84961 6.25C9.86189 6.25 10.818 6.77823 11.4121 7.60645L12.0088 8.43848L12.6221 7.61914C13.2462 6.78512 14.2169 6.25 15.1504 6.25Z"
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.5}
      />
    </StyledSvg>
  );
}
