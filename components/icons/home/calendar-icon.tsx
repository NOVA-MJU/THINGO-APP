import React from 'react';
import Svg, {
  ClipPath,
  Defs,
  FeBlend,
  FeColorMatrix,
  FeComposite,
  FeFlood,
  FeGaussianBlur,
  FeOffset,
  Filter,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

export function CalendarIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
      <G clipPath="url(#calendar-clip)">
        <G filter="url(#calendar-filter)">
          <Path
            d="M4 12C4 8.68629 6.68629 6 10 6H30C33.3137 6 36 8.68629 36 12V15H4V12Z"
            fill="url(#calendar-paint0)"
          />
          <Path d="M36 15H4V14H36V15Z" fill="#2587FF" />
          <Path
            d="M4 31C4 34.3137 6.68629 37 10 37H30C33.3137 37 36 34.3137 36 31V15H4V31Z"
            fill="white"
          />
          <Path
            d="M30 37C33.3137 37 36 34.3137 36 31C36 33.7614 33.3137 36 30 36H10C6.68629 36 4 33.7614 4 31C4 34.3137 6.68629 37 10 37H30Z"
            fill="#CDD0D4"
          />
          <Path
            d="M11 5C11 3.89543 11.8954 3 13 3C14.1046 3 15 3.89543 15 5V7C15 8.10457 14.1046 9 13 9C11.8954 9 11 8.10457 11 7V5Z"
            fill="#CDD0D4"
          />
          <Path
            d="M25 5C25 3.89543 25.8954 3 27 3C28.1046 3 29 3.89543 29 5V7C29 8.10457 28.1046 9 27 9C25.8954 9 25 8.10457 25 7V5Z"
            fill="#CDD0D4"
          />
          <Path
            d="M13 21C13 22.1046 12.1046 23 11 23C9.89543 23 9 22.1046 9 21C9 19.8954 9.89543 19 11 19C12.1046 19 13 19.8954 13 21Z"
            fill="#CDD0D4"
          />
          <Path
            d="M13 28C13 29.1046 12.1046 30 11 30C9.89543 30 9 29.1046 9 28C9 26.8954 9.89543 26 11 26C12.1046 26 13 26.8954 13 28Z"
            fill="#CDD0D4"
          />
          <Path
            d="M19 21C19 22.1046 18.1046 23 17 23C15.8954 23 15 22.1046 15 21C15 19.8954 15.8954 19 17 19C18.1046 19 19 19.8954 19 21Z"
            fill="#CDD0D4"
          />
          <Path
            d="M19 28C19 29.1046 18.1046 30 17 30C15.8954 30 15 29.1046 15 28C15 26.8954 15.8954 26 17 26C18.1046 26 19 26.8954 19 28Z"
            fill="#CDD0D4"
          />
          <Path
            d="M25 21C25 22.1046 24.1046 23 23 23C21.8954 23 21 22.1046 21 21C21 19.8954 21.8954 19 23 19C24.1046 19 25 19.8954 25 21Z"
            fill="#CDD0D4"
          />
          <Path
            d="M31 21C31 22.1046 30.1046 23 29 23C27.8954 23 27 22.1046 27 21C27 19.8954 27.8954 19 29 19C30.1046 19 31 19.8954 31 21Z"
            fill="#5DABFF"
          />
          <Path
            d="M25 28C25 29.1046 24.1046 30 23 30C21.8954 30 21 29.1046 21 28C21 26.8954 21.8954 26 23 26C24.1046 26 25 26.8954 25 28Z"
            fill="#CDD0D4"
          />
          <Path
            d="M31 28C31 29.1046 30.1046 30 29 30C27.8954 30 27 29.1046 27 28C27 26.8954 27.8954 26 29 26C30.1046 26 31 26.8954 31 28Z"
            fill="#CDD0D4"
          />
        </G>
      </G>
      <Defs>
        <Filter
          id="calendar-filter"
          x={1}
          y={0}
          width={40}
          height={42}
          filterUnits="userSpaceOnUse"
        >
          <FeFlood floodOpacity={0} result="BackgroundImageFix" />
          <FeColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <FeOffset dx={1} dy={1} />
          <FeGaussianBlur stdDeviation={2} />
          <FeComposite in2="hardAlpha" operator="out" />
          <FeColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
          <FeBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <FeBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </Filter>
        <LinearGradient
          id="calendar-paint0"
          x1={4}
          y1={10.5}
          x2={36}
          y2={10.5}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#3B96FF" />
          <Stop offset={1} stopColor="#2587FF" />
        </LinearGradient>
        <ClipPath id="calendar-clip">
          <Rect width={40} height={40} fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}
