import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

interface LunchMealIconProps {
  size?: number;
}

export default function LunchMealIcon({ size = 24 }: LunchMealIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient
          id="lunch_paint0"
          x1="12"
          y1="21.002"
          x2="12"
          y2="18.002"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0.45" stopColor="#EC9750" />
          <Stop offset="1" stopColor="#F8CD84" />
        </LinearGradient>
        <LinearGradient
          id="lunch_paint1"
          x1="11.9999"
          y1="14.002"
          x2="11.9999"
          y2="17.002"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#9C3A1D" />
          <Stop offset="1" stopColor="#5F1E0A" />
        </LinearGradient>
        <LinearGradient
          id="lunch_paint2"
          x1="11.9999"
          y1="13.001"
          x2="11.9999"
          y2="16.0867"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#FFD74E" />
          <Stop offset="1" stopColor="#FFAD4A" />
        </LinearGradient>
        <LinearGradient
          id="lunch_paint3"
          x1="12"
          y1="3.00098"
          x2="12"
          y2="12.001"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0.4" stopColor="#EC9750" />
          <Stop offset="1" stopColor="#F8CD84" />
        </LinearGradient>
      </Defs>
      <Path
        d="M2 19.002C2 18.4497 2.44772 18.002 3 18.002H21C21.5523 18.002 22 18.4497 22 19.002V19.502C22 20.3304 21.3284 21.002 20.5 21.002H3.5C2.67157 21.002 2 20.3304 2 19.502V19.002Z"
        fill="url(#lunch_paint0)"
      />
      <Path
        d="M2.40039 17.502C2.40039 17.2258 2.62425 17.002 2.90039 17.002H21.1004C21.3765 17.002 21.6004 17.2258 21.6004 17.502C21.6004 17.7781 21.3765 18.002 21.1004 18.002H2.90039C2.62425 18.002 2.40039 17.7781 2.40039 17.502Z"
        fill="#6EDC53"
      />
      <Path
        d="M2.3999 14.502C2.3999 14.2258 2.62376 14.002 2.8999 14.002H21.0999C21.376 14.002 21.5999 14.2258 21.5999 14.502V16.502C21.5999 16.7781 21.376 17.002 21.0999 17.002H2.8999C2.62376 17.002 2.3999 16.7781 2.3999 16.502V14.502Z"
        fill="url(#lunch_paint1)"
      />
      <Path
        d="M2.3999 11.502C2.3999 11.2258 2.62376 11.002 2.8999 11.002H21.0999C21.376 11.002 21.5999 11.2258 21.5999 11.502V12.502C21.5999 12.7781 21.376 13.002 21.0999 13.002H2.8999C2.62376 13.002 2.3999 12.7781 2.3999 12.502V11.502Z"
        fill="#F54D3A"
      />
      <Path
        d="M2.3999 13.5153C2.3999 13.2312 2.62376 13.001 2.8999 13.001H21.0999C21.376 13.001 21.5999 13.2312 21.5999 13.5153V13.6867C21.5999 13.8943 21.4785 14.0816 21.2922 14.1614L17.1845 15.9219C16.9384 16.0273 16.6614 16.0273 16.4153 15.9219L12.0922 14.0691C12.0313 14.043 11.9659 14.0295 11.8999 14.0295H2.8999C2.62376 14.0295 2.3999 13.7993 2.3999 13.5153Z"
        fill="url(#lunch_paint2)"
      />
      <Path
        d="M21 11.001C21.5523 11.001 22.0078 10.5506 21.9222 10.005C21.6471 8.25047 20.6505 6.60771 19.0711 5.34412C17.1957 3.84383 14.6522 3.00098 12 3.00098C9.34783 3.00098 6.80429 3.84383 4.92893 5.34412C3.34944 6.60771 2.3529 8.25047 2.07776 10.005C1.9922 10.5506 2.44771 11.001 3 11.001L21 11.001Z"
        fill="url(#lunch_paint3)"
      />
    </Svg>
  );
}
