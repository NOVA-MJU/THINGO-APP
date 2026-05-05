import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface XIconProps {
  size?: number;
  className?: string;
}

export default function XIcon({ size = 24, className = 'text-black' }: XIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 12 12" fill="none" className={className}>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.87043 2.05662C9.16316 1.76384 9.63725 1.76387 9.93 2.05662C10.2228 2.3496 10.2227 2.82416 9.93 3.11717L7.05207 5.99705L9.92316 8.8701C10.2159 9.1631 10.2159 9.63765 9.92316 9.93065C9.63038 10.2236 9.15636 10.2236 8.86359 9.93065L5.9925 7.0576L3.12238 9.93065C2.8296 10.2237 2.35462 10.2237 2.06183 9.93065C1.76936 9.6377 1.76935 9.16305 2.06183 8.8701L4.93195 5.99705L2.055 3.11815C1.76229 2.82514 1.76224 2.3496 2.055 2.05662C2.34776 1.76365 2.82275 1.7637 3.11555 2.05662L5.9925 4.93553L8.87043 2.05662Z"
        fill="currentColor"
      />
    </StyledSvg>
  );
}
