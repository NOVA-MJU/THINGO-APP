import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface ClassroomIconProps {
  size?: number;
  className?: string;
}

export default function ClassroomIcon({ size = 28, className = 'text-black' }: ClassroomIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <Path
        d="M5.75 5.75C5.75 4.50736 6.75736 3.5 8 3.5H20C21.2426 3.5 22.25 4.50736 22.25 5.75V17.25C22.25 18.4926 21.2426 19.5 20 19.5H14.75V22.25H18.25C18.6642 22.25 19 22.5858 19 23C19 23.4142 18.6642 23.75 18.25 23.75H9.75C9.33579 23.75 9 23.4142 9 23C9 22.5858 9.33579 22.25 9.75 22.25H13.25V19.5H8C6.75736 19.5 5.75 18.4926 5.75 17.25V5.75ZM8 5C7.58579 5 7.25 5.33579 7.25 5.75V17.25C7.25 17.6642 7.58579 18 8 18H20C20.4142 18 20.75 17.6642 20.75 17.25V5.75C20.75 5.33579 20.4142 5 20 5H8ZM10.25 8.25C10.25 7.83579 10.5858 7.5 11 7.5H17C17.4142 7.5 17.75 7.83579 17.75 8.25C17.75 8.66421 17.4142 9 17 9H11C10.5858 9 10.25 8.66421 10.25 8.25ZM10.25 11.5C10.25 11.0858 10.5858 10.75 11 10.75H17C17.4142 10.75 17.75 11.0858 17.75 11.5C17.75 11.9142 17.4142 12.25 17 12.25H11C10.5858 12.25 10.25 11.9142 10.25 11.5ZM10.25 14.75C10.25 14.3358 10.5858 14 11 14H14.5C14.9142 14 15.25 14.3358 15.25 14.75C15.25 15.1642 14.9142 15.5 14.5 15.5H11C10.5858 15.5 10.25 15.1642 10.25 14.75Z"
        fill="currentColor"
      />
    </StyledSvg>
  );
}
