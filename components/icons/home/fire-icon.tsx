import React from 'react';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

export function FireIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.0005 14.0764C20.0005 18.453 16.4188 22.001 12.0005 22.001C7.58221 22.001 4.00049 18.453 4.00049 14.0764C4.00049 9.69985 9.33382 2.00098 12.0005 2.00098C12.9078 2.00098 14.2862 4.64249 15.0481 5.77456C15.654 6.67479 16.2418 3.93155 16.9529 5.01984C18.4659 7.33561 20.0005 11.9855 20.0005 14.0764Z"
        fill="url(#fire-icon-gradient-outer)"
      />
      <Path
        d="M16.0005 15.9269C16.0005 18.177 14.2096 20.001 12.0005 20.001C9.79135 20.001 8.00049 18.177 8.00049 15.9269C8.00049 12.862 10.5913 9.00098 12.0005 9.00098C13.4096 9.00098 16.0005 12.862 16.0005 15.9269Z"
        fill="url(#fire-icon-gradient-inner)"
      />
      <Defs>
        <LinearGradient
          id="fire-icon-gradient-outer"
          x1={12.0005}
          y1={1.99917}
          x2={12.0005}
          y2={21.9992}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset={0.45} stopColor="#F54D3A" />
          <Stop offset={1} stopColor="#FF8843" />
        </LinearGradient>
        <LinearGradient
          id="fire-icon-gradient-inner"
          x1={11.9996}
          y1={9.00098}
          x2={11.9996}
          y2={20.001}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#FF8843" />
          <Stop offset={1} stopColor="#FFD545" />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}
