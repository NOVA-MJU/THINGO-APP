import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface InfoOutlineIconProps {
  size?: number;
  className?: string;
}

export default function InfoOutlineIcon({ size = 24, className = 'text-[#000]' }: InfoOutlineIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <Path d="M13.0737 18.2871H10.9482V16.1411H13.0737V18.2871Z" fill="currentColor" />
      <Path d="M12.898 8.55615L12.6636 14.6206H11.3584L11.124 8.55615L11.0464 4.5H12.9756L12.898 8.55615Z" fill="currentColor" />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 0C18.6274 0 24 5.37258 24 12C24 18.6274 18.6274 24 12 24C5.37258 24 0 18.6274 0 12C0 5.37258 5.37258 0 12 0ZM12 2.12256C6.54457 2.12256 2.12256 6.54457 2.12256 12C2.12256 17.4554 6.54457 21.8774 12 21.8774C17.4554 21.8774 21.8774 17.4554 21.8774 12C21.8774 6.54457 17.4554 2.12256 12 2.12256Z"
        fill="currentColor"
      />
    </StyledSvg>
  );
}
