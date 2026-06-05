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
  Path,
  Rect,
} from 'react-native-svg';

export function ChatIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
      <G clipPath="url(#clip0)">
        <G filter="url(#filter0)">
          <Path
            d="M20 4C10.6534 4 3 11.0993 3 19.9693C3 22.7586 3.75141 25.4699 5.17771 27.8422C5.94441 29.118 6.01579 30.9332 4.85979 33.3871C4 34.914 3.93331 35.7097 6.24021 35.9386C8.54711 36.1675 10.4953 35.763 13.1473 34.6079C15.2587 35.4667 17.6472 35.9386 20 35.9386C29.3466 35.9386 37 28.8376 37 19.9693C37 11.0993 29.3466 4 20 4Z"
            fill="white"
          />
          <Path
            d="M10 17.5C10 16.6716 10.6716 16 11.5 16H28.5C29.3284 16 30 16.6716 30 17.5C30 18.3284 29.3284 19 28.5 19H11.5C10.6716 19 10 18.3284 10 17.5Z"
            fill="#5DABFF"
          />
          <Path
            d="M10 23.5C10 22.6716 10.6716 22 11.5 22H23.5C24.3284 22 25 22.6716 25 23.5C25 24.3284 24.3284 25 23.5 25H11.5C10.6716 25 10 24.3284 10 23.5Z"
            fill="#5DABFF"
          />
        </G>
      </G>
      <Defs>
        <Filter id="filter0" x={0} y={1} width={42} height={40} filterUnits="userSpaceOnUse">
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
        <ClipPath id="clip0">
          <Rect width={40} height={40} fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}
