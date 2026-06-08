import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface CorridorIconProps {
  size?: number;
  className?: string;
}

export default function CorridorIcon({ size = 28, className = 'text-black' }: CorridorIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <Path
        d="M13.75 4.00195C14.1641 4.00195 14.4998 4.33793 14.5 4.75195V7.08398H20.0654C20.2585 7.08398 20.4444 7.15864 20.584 7.29199L23.2686 9.86133C23.4162 10.0027 23.4999 10.1989 23.5 10.4033C23.4999 10.6076 23.4161 10.803 23.2686 10.9443L20.584 13.5137C20.4444 13.6471 20.2585 13.7217 20.0654 13.7217H14.4453C14.4799 13.8078 14.4999 13.9015 14.5 14V22.498H16.75C17.1641 22.498 17.4998 22.834 17.5 23.248C17.4999 23.6622 17.1641 23.998 16.75 23.998H10.75C10.3359 23.998 10.0001 23.6622 10 23.248C10.0002 22.834 10.3359 22.498 10.75 22.498H13V14C13.0001 13.9015 13.0201 13.8078 13.0547 13.7217H5.75C5.33579 13.7217 5 13.3859 5 12.9717V7.83398C5.00015 7.4199 5.33588 7.08398 5.75 7.08398H13V4.75195C13.0002 4.33793 13.3359 4.00195 13.75 4.00195ZM6.5 12.2217H19.7646L21.665 10.4023L19.7646 8.58398H6.5V12.2217Z"
        fill="currentColor"
      />
    </StyledSvg>
  );
}
