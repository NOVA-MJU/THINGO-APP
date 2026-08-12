// react-native-svg-transformer로 .svg를 React 컴포넌트로 import하기 위한 타입 선언
declare module '*.svg' {
  import type React from 'react';
  import type { SvgProps } from 'react-native-svg';

  const content: React.FC<SvgProps>;
  export default content;
}
