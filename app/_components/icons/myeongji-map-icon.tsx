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

export function MyeongjiMapIcon() {
  return (
    <Svg width={56} height={56} viewBox="0 0 56 56" fill="none">
      <G clipPath="url(#clip0)">
        <G filter="url(#filter0)">
          <Path
            d="M42.2937 24.981V37.1323L37.7683 35.4878L34.9988 34.48L32.2292 35.4868L19.5994 40.0786L12.3054 37.4263V25.2759L16.8289 26.9204L19.5984 27.9272L22.3679 26.9204L34.9978 22.3286L42.2937 24.981Z"
            stroke="#CDD0D4"
            strokeWidth={16.2105}
          />
          <Path
            d="M4.19995 16.5974C4.19995 14.6542 6.13072 13.3019 7.95683 13.9659L19.6 18.1998V47.5998L6.04307 42.67C4.93654 42.2676 4.19995 41.216 4.19995 40.0386L4.19995 16.5974Z"
            fill="url(#paint0)"
          />
          <Path
            d="M35 12.6001L48.5569 17.5299C49.6634 17.9322 50.4 18.9839 50.4 20.1613V43.6025C50.4 45.5456 48.4692 46.898 46.6431 46.234L35 42.0001L35 12.6001Z"
            fill="url(#paint1)"
          />
          <Path
            d="M34.9999 12.6001L19.5999 18.2001V47.6001L34.9999 42.0001V12.6001Z"
            fill="white"
          />
          <Path
            d="M27.6573 11.3579C30.6748 8.34035 35.5672 8.34035 38.5847 11.3579C41.1702 13.9434 41.5894 17.9873 39.5892 21.0482L34.184 29.3201C33.6828 30.087 32.5592 30.087 32.058 29.3201L26.6527 21.0482C24.6525 17.9873 25.0718 13.9434 27.6573 11.3579Z"
            fill="url(#paint2)"
          />
          <Path
            d="M30.1521 13.4247C31.7923 11.7845 34.4516 11.7845 36.0918 13.4247C37.732 15.0649 37.732 17.7242 36.0918 19.3644C34.4516 21.0046 31.7923 21.0046 30.1521 19.3644C28.5119 17.7242 28.5119 15.0649 30.1521 13.4247Z"
            fill="white"
          />
        </G>
      </G>
      <Defs>
        <Filter
          id="filter0"
          x={-0.00004839}
          y={4.89473}
          width={57.4}
          height={50.8084}
          filterUnits="userSpaceOnUse"
        >
          <FeFlood floodOpacity={0} result="BackgroundImageFix" />
          <FeColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <FeOffset dx={1.4} dy={1.4} />
          <FeGaussianBlur stdDeviation={2.8} />
          <FeComposite in2="hardAlpha" operator="out" />
          <FeColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
          <FeBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <FeBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </Filter>
        <LinearGradient
          id="paint0"
          x1={11.9}
          y1={12.5993}
          x2={11.9}
          y2={47.5993}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#8BC7FF" />
          <Stop offset={1} stopColor="#E8F1FF" />
        </LinearGradient>
        <LinearGradient
          id="paint1"
          x1={42.7}
          y1={12.6001}
          x2={42.7}
          y2={47.6001}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#8BC7FF" />
          <Stop offset={1} stopColor="#E8F1FF" />
        </LinearGradient>
        <LinearGradient
          id="paint2"
          x1={33.1214}
          y1={9.39465}
          x2={33.1214}
          y2={29.5226}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#3B96FF" />
          <Stop offset={1} stopColor="#2587FF" />
        </LinearGradient>
        <ClipPath id="clip0">
          <Rect width={56} height={56} fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}
