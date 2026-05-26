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

export function MegaphoneIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
      <G clipPath="url(#clip0)">
        <G filter="url(#filter0)">
          <Path
            d="M9 23C6.23858 23 4 20.7614 4 18C4 15.2386 6.23858 13 9 13L13 13V23H9Z"
            fill="#2587FF"
          />
          <Path
            d="M9 25H15V33C15 34.6569 13.6569 36 12 36C10.3431 36 9 34.6569 9 33V25Z"
            fill="url(#paint0)"
          />
          <Path
            d="M7 13C7 11.8954 7.89543 11 9 11H18V25H9C7.89543 25 7 24.1046 7 23V13Z"
            fill="url(#paint1)"
          />
          <Path d="M18 11L31 7V29L18 25V11Z" fill="white" />
          <Path
            d="M30 7C30 5.34315 31.3431 4 33 4C34.6569 4 36 5.34315 36 7V29C36 30.6569 34.6569 32 33 32C31.3431 32 30 30.6569 30 29V7Z"
            fill="url(#paint2)"
          />
          <Path
            opacity={0.8}
            d="M20 12.5C20.8284 12.5 21.5 13.1716 21.5 14C21.5 14.8284 20.8284 15.5 20 15.5H13C12.1716 15.5 11.5 14.8284 11.5 14C11.5 13.1716 12.1716 12.5 13 12.5H20Z"
            fill="url(#paint3)"
          />
        </G>
      </G>
      <Defs>
        <Filter id="filter0" x={1} y={1} width={40} height={40} filterUnits="userSpaceOnUse">
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
        <LinearGradient id="paint0" x1={12} y1={25} x2={12} y2={36} gradientUnits="userSpaceOnUse">
          <Stop stopColor="#3B96FF" />
          <Stop offset={1} stopColor="#2587FF" />
        </LinearGradient>
        <LinearGradient
          id="paint1"
          x1={12.5}
          y1={11}
          x2={12.5}
          y2={25}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#3B96FF" />
          <Stop offset={1} stopColor="#2587FF" />
        </LinearGradient>
        <LinearGradient id="paint2" x1={33} y1={4} x2={33} y2={32} gradientUnits="userSpaceOnUse">
          <Stop stopColor="#3B96FF" />
          <Stop offset={1} stopColor="#2587FF" />
        </LinearGradient>
        <LinearGradient
          id="paint3"
          x1={10}
          y1={13.5}
          x2={25.5}
          y2={13.5}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="white" stopOpacity={0.7} />
          <Stop offset={1} stopColor="white" stopOpacity={0} />
        </LinearGradient>
        <ClipPath id="clip0">
          <Rect width={40} height={40} fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}
