import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

interface DinnerMealIconProps {
  size?: number;
}

export default function DinnerMealIcon({ size = 24 }: DinnerMealIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient
          id="dinner_paint0"
          x1="10.8752"
          y1="14"
          x2="10.8752"
          y2="3"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#FFAD4A" />
          <Stop offset="1" stopColor="#FFD545" />
        </LinearGradient>
        <LinearGradient
          id="dinner_paint1"
          x1="10.8752"
          y1="14"
          x2="10.8752"
          y2="3"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#FFAD4A" />
          <Stop offset="1" stopColor="#FFD545" />
        </LinearGradient>
        <LinearGradient
          id="dinner_paint2"
          x1="10.8752"
          y1="14"
          x2="10.8752"
          y2="3"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#FFAD4A" />
          <Stop offset="1" stopColor="#FFD545" />
        </LinearGradient>
        <LinearGradient
          id="dinner_paint3"
          x1="10.8752"
          y1="14"
          x2="10.8752"
          y2="3"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#FFAD4A" />
          <Stop offset="1" stopColor="#FFD545" />
        </LinearGradient>
        <LinearGradient
          id="dinner_paint4"
          x1="12.0011"
          y1="10.8477"
          x2="12.0011"
          y2="20.8477"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#F5F7F9" />
          <Stop offset="1" stopColor="#CDD0D4" />
        </LinearGradient>
      </Defs>
      <Path
        d="M8.00024 4.09526C8.00024 3.874 8.17663 3.69375 8.39627 3.69056L21.4967 3.50005C21.7736 3.49603 22.0002 3.72104 22.0002 4C22.0002 4.27614 21.778 4.5 21.5039 4.5H8.40207C8.18015 4.5 8.00024 4.31879 8.00024 4.09526Z"
        fill="#9C3A1D"
      />
      <Path
        d="M7.96606 12.5C7.96606 12.7761 7.74221 13 7.46606 13C7.18992 13 6.96606 12.7761 6.96606 12.5V3.5C6.96606 3.22386 7.18992 3 7.46606 3C7.74221 3 7.96606 3.22386 7.96606 3.5V12.5Z"
        fill="url(#dinner_paint0)"
      />
      <Path
        d="M9.2688 12.5C9.2688 12.7761 9.04494 13 8.7688 13C8.49266 13 8.2688 12.7761 8.2688 12.5V3.5C8.2688 3.22386 8.49266 3 8.7688 3C9.04494 3 9.2688 3.22386 9.2688 3.5V12.5Z"
        fill="url(#dinner_paint1)"
      />
      <Path
        d="M10.5715 12.5C10.5715 12.7761 10.3477 13 10.0715 13C9.79539 13 9.57153 12.7761 9.57153 12.5V3.5C9.57153 3.22386 9.79539 3 10.0715 3C10.3477 3 10.5715 3.22386 10.5715 3.5V12.5Z"
        fill="url(#dinner_paint2)"
      />
      <Path
        d="M11.8752 12.5C11.8752 12.7761 11.6514 13 11.3752 13C11.0991 13 10.8752 12.7761 10.8752 12.5V3.5C10.8752 3.22386 11.0991 3 11.3752 3C11.6514 3 11.8752 3.22386 11.8752 3.5V12.5Z"
        fill="url(#dinner_paint3)"
      />
      <Path
        d="M8.00024 5.4073C8.00024 5.18286 8.18089 5.00091 8.40374 5.0009L21.5038 5C21.778 4.99998 22.0002 5.22384 22.0002 5.5C22.0002 5.7789 21.7737 6.00389 21.4968 5.99995L8.39807 5.81366C8.17745 5.81052 8.00024 5.62951 8.00024 5.4073Z"
        fill="#9C3A1D"
      />
      <Path
        d="M21.0461 10.8477C21.5983 10.8477 22.0515 11.2963 21.9963 11.8457C21.8984 12.8164 21.6579 13.7701 21.2814 14.6748C20.7766 15.8879 20.0373 16.9905 19.1047 17.9189C18.1719 18.8475 17.0637 19.5844 15.8449 20.0869C14.6263 20.5893 13.3201 20.8476 12.0012 20.8477C10.682 20.8477 9.3752 20.5895 8.15643 20.0869C6.93772 19.5844 5.83041 18.8475 4.89764 17.9189C3.96488 16.9904 3.22474 15.888 2.71991 14.6748C2.34348 13.7701 2.10388 12.8164 2.00604 11.8457C1.95082 11.2964 2.40316 10.8478 2.95526 10.8477H21.0461Z"
        fill="url(#dinner_paint4)"
      />
      <Path
        d="M21.5468 10.8477C21.8229 10.8477 22.0479 11.0719 22.0341 11.3477C22.0257 11.5148 22.0118 11.6814 21.995 11.8477H2.00769C1.99091 11.6814 1.97703 11.5148 1.96863 11.3477C1.95476 11.0719 2.17979 10.8477 2.45593 10.8477H21.5468Z"
        fill="#F54D3A"
      />
      <Path
        d="M8.00088 20H16.0009V21C16.0009 21.5523 15.5532 22 15.0009 22H9.00088C8.44859 22 8.00088 21.5523 8.00088 21V20Z"
        fill="#F45353"
      />
    </Svg>
  );
}
