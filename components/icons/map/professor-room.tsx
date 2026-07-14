import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface ProfessorRoomIconProps {
  size?: number;
  className?: string;
}

export default function ProfessorRoomIcon({
  size = 28,
  className = 'text-black',
}: ProfessorRoomIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <Path
        d="M9.25 6.75C9.25 4.12665 11.3766 2 14 2C16.6234 2 18.75 4.12665 18.75 6.75C18.75 9.37335 16.6234 11.5 14 11.5C11.3766 11.5 9.25 9.37335 9.25 6.75ZM14 3.5C12.2051 3.5 10.75 4.95507 10.75 6.75C10.75 8.54493 12.2051 10 14 10C15.7949 10 17.25 8.54493 17.25 6.75C17.25 4.95507 15.7949 3.5 14 3.5ZM6.25 17.75C6.25 15.1266 8.37665 13 11 13H17C19.6234 13 21.75 15.1266 21.75 17.75V19.75C21.75 20.1642 21.4142 20.5 21 20.5C20.5858 20.5 20.25 20.1642 20.25 19.75V17.75C20.25 15.9551 18.7949 14.5 17 14.5H11C9.20507 14.5 7.75 15.9551 7.75 17.75V19.75C7.75 20.1642 7.41421 20.5 7 20.5C6.58579 20.5 6.25 20.1642 6.25 19.75V17.75ZM4.75 22.5C4.75 22.0858 5.08579 21.75 5.5 21.75H22.5C22.9142 21.75 23.25 22.0858 23.25 22.5C23.25 22.9142 22.9142 23.25 22.5 23.25H5.5C5.08579 23.25 4.75 22.9142 4.75 22.5ZM8.75 25C8.75 24.5858 9.08579 24.25 9.5 24.25H18.5C18.9142 24.25 19.25 24.5858 19.25 25C19.25 25.4142 18.9142 25.75 18.5 25.75H9.5C9.08579 25.75 8.75 25.4142 8.75 25Z"
        fill="currentColor"
      />
    </StyledSvg>
  );
}
