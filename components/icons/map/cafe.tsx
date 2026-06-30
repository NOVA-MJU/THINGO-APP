import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface CafeIconProps {
  size?: number;
  className?: string;
}

export default function CafeIcon({ size = 28, className = 'text-black' }: CafeIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <Path
        d="M19.4265 14.6029H3.75V19.4265C3.75 20.7057 4.25819 21.9326 5.16278 22.8372C6.06737 23.7418 7.29425 24.25 8.57353 24.25H14.6029C15.8822 24.25 17.1091 23.7418 18.0137 22.8372C18.9183 21.9326 19.4265 20.7057 19.4265 19.4265V14.6029ZM19.4265 14.6029H21.8382C22.4779 14.6029 23.0913 14.857 23.5436 15.3093C23.9959 15.7616 24.25 16.3751 24.25 17.0147V18.2206C24.25 18.8602 23.9959 19.4737 23.5436 19.926C23.0913 20.3783 22.4779 20.6324 21.8382 20.6324H19.4265M14.6029 10.9853C14.6029 10.9853 15.8088 9.77941 15.2059 8.57353L14 6.16176C13.3971 4.95588 14.6029 3.75 14.6029 3.75M9.34529 10.9853C9.34529 10.9853 10.5512 9.77941 9.94824 8.57353L8.74235 6.16176C8.13941 4.95588 9.34529 3.75 9.34529 3.75"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </StyledSvg>
  );
}
