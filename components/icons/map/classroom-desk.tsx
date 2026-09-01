import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface ClassroomDeskIconProps {
  size?: number;
  className?: string;
}

export default function ClassroomDeskIcon({
  size = 28,
  className = 'text-black',
}: ClassroomDeskIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <Path
        d="M9.11111 22.4935H5.44444C4.79614 22.4935 4.17438 22.236 3.71596 21.7776C3.25754 21.3192 3 20.6974 3 20.0491V8.92687C3 8.27856 3.25754 7.65681 3.71596 7.19838C4.17438 6.73996 4.79614 6.48242 5.44444 6.48242H22.5556C23.2039 6.48242 23.8256 6.73996 24.284 7.19838C24.7425 7.65681 25 8.27856 25 8.92687V21.2713C25 21.5955 24.8712 21.9063 24.642 22.1356C24.4128 22.3648 24.1019 22.4935 23.7778 22.4935"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14.1864 15.6704C14.0634 15.3737 14.0001 15.0558 14 14.7347C13.9998 14.0863 14.2573 13.4643 14.7157 13.0056C15.1741 12.547 15.796 12.2892 16.4444 12.2891C17.0929 12.2889 17.7149 12.5463 18.1735 13.0048C18.6322 13.4632 18.8899 14.085 18.8901 14.7335C18.8902 15.0546 18.827 15.3726 18.7042 15.6692C18.5814 15.9659 18.4014 16.2355 18.1744 16.4626C17.9474 16.6897 17.6779 16.8699 17.3813 16.9928C17.0847 17.1158 16.7668 17.1791 16.4457 17.1792C16.1246 17.1793 15.8066 17.1161 15.5099 16.9933C15.2133 16.8705 14.9437 16.6905 14.7166 16.4635C14.4895 16.2365 14.3093 15.967 14.1864 15.6704Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20.8752 22.7385V21.6385C20.8752 20.4235 19.8902 19.4385 18.6752 19.4385H14.2752C13.0602 19.4385 12.0752 20.4234 12.0752 21.6385V22.7385"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </StyledSvg>
  );
}
