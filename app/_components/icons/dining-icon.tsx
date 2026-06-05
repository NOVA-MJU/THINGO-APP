import React from 'react';
import Svg, {
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
  Stop,
} from 'react-native-svg';

export function DiningIcon() {
  return (
    <Svg width={56} height={56} viewBox="0 0 56 56" fill="none">
      <G filter="url(#filter0)">
        <Path
          d="M16.8012 37.6863V24.2863C15.4412 23.8863 14.3015 23.0006 13.382 21.8006C12.4626 20.6006 12.0023 19.2006 12.0012 17.6006L13.001 6.60316C13.0526 6.03535 13.5287 5.60059 14.0988 5.60059C14.7077 5.60059 15.2012 6.09414 15.2012 6.70297V15.6376C15.2012 16.0906 15.5684 16.4577 16.0213 16.4577C16.4582 16.4577 16.8184 16.1152 16.8404 15.6788L17.2938 6.65216C17.3234 6.06305 17.8097 5.60059 18.3996 5.60059C18.9893 5.60059 19.4755 6.06283 19.5053 6.65179L19.9618 15.6789C19.9839 16.1153 20.3441 16.4577 20.781 16.4577C21.234 16.4577 21.6012 16.0905 21.6012 15.6375V6.70297C21.6012 6.09414 22.0948 5.60059 22.7036 5.60059C23.2738 5.60059 23.7498 6.03535 23.8015 6.60316L24.8012 17.6006C24.8012 19.2006 24.3415 20.6006 23.422 21.8006C22.5026 23.0006 21.3623 23.8863 20.0012 24.2863V37.6863H16.8012Z"
          fill="#CDD0D4"
        />
        <Path
          d="M37.2813 26.4006V36.0006H40.8012V6.13392C40.8012 5.83937 40.5625 5.60059 40.2679 5.60059C35.2605 5.60059 31.2012 9.65987 31.2012 14.6673V25.6157C31.2012 26.0492 31.5527 26.4006 31.9862 26.4006H37.2813Z"
          fill="#CDD0D4"
        />
        <Path
          d="M15.2258 29.3951C15.324 27.8243 16.6266 26.6006 18.2005 26.6006C19.7744 26.6006 21.077 27.8243 21.1751 29.3951L22.1385 44.8088C22.2805 47.0803 20.4765 49.0006 18.2005 49.0006C15.9245 49.0006 14.1205 47.0803 14.2625 44.8088L15.2258 29.3951Z"
          fill="url(#paint0)"
        />
        <Path
          d="M36.2258 29.3951C36.324 27.8243 37.6266 26.6006 39.2005 26.6006C40.7744 26.6006 42.077 27.8243 42.1752 29.3951L43.1385 44.8088C43.2805 47.0803 41.4765 49.0006 39.2005 49.0006C36.9245 49.0006 35.1205 47.0803 35.2625 44.8088L36.2258 29.3951Z"
          fill="url(#paint1)"
        />
        <Path
          opacity={0.8}
          d="M16.45 33.6006V29.4006C16.45 28.8207 16.9201 28.3506 17.5 28.3506C18.0799 28.3506 18.55 28.8207 18.55 29.4006V33.6006C18.55 34.1805 18.0799 34.6506 17.5 34.6506C16.9201 34.6506 16.45 34.1805 16.45 33.6006ZM37.45 33.6006V29.4006C37.45 28.8207 37.9201 28.3506 38.5 28.3506C39.0798 28.3506 39.55 28.8207 39.55 29.4006V33.6006C39.55 34.1805 39.0798 34.6506 38.5 34.6506C37.9201 34.6506 37.45 34.1805 37.45 33.6006Z"
          fill="url(#paint2)"
        />
      </G>
      <Defs>
        <Filter
          id="filter0"
          x={7.80122}
          y={1.40059}
          width={42.345}
          height={54.5999}
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
          x1={39.2003}
          y1={26.6013}
          x2={39.2003}
          y2={49.0013}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#3B96FF" />
          <Stop offset={1} stopColor="#2587FF" />
        </LinearGradient>
        <LinearGradient
          id="paint1"
          x1={39.2003}
          y1={26.6013}
          x2={39.2003}
          y2={49.0013}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#3B96FF" />
          <Stop offset={1} stopColor="#2587FF" />
        </LinearGradient>
        <LinearGradient
          id="paint2"
          x1={38.3466}
          y1={26.8806}
          x2={38.3466}
          y2={39.9006}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="white" stopOpacity={0.7} />
          <Stop offset={1} stopColor="white" stopOpacity={0} />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}
