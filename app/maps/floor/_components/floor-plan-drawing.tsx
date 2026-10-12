import type { FloorPlanText } from '@/assets/map-floors';
import type React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { type SvgProps, Text as SvgText, TSpan } from 'react-native-svg';

// 도면의 대상 이름을 다시 그릴 강조색(blue-35)과 굵기. 굵은 글꼴은 글자 폭이 달라져 원본 회색 글자가 삐져나오므로
// 같은 글꼴·폭 그대로 같은 색 외곽선을 얇게 둘러 굵어 보이게 한다
const TARGET_TEXT_COLOR = '#2587ff';
const TARGET_TEXT_STROKE_RATIO = 0.06;

type FloorPlanDrawingProps = {
  FloorPlan: React.FC<SvgProps>;
  width: number;
  height: number;
  // 도면 좌표계(SVG viewBox) 중 그릴 영역. 없으면 도면 전체를 크기에 맞춰 그린다
  viewBox?: string;
  // 강조할 대상 이름을 그릴 때 쓰는 도면 원본 viewBox ('0 0 W H')
  layoutViewBox?: string;
  targetTexts: FloorPlanText[];
};

// 도면 SVG와, 도면에 이미 있는 대상 이름을 같은 자리·글꼴·크기·회전으로 강조색으로 덮어 그린 레이어.
// 확대 전 기본 레이어와 확대 후 선명하게 다시 그리는 레이어가 같은 그림을 써야 해서 분리했다
export default function FloorPlanDrawing({
  FloorPlan,
  width,
  height,
  viewBox,
  layoutViewBox,
  targetTexts,
}: FloorPlanDrawingProps) {
  return (
    <View style={{ width, height }}>
      <FloorPlan width={width} height={height} {...(viewBox ? { viewBox } : {})} />
      {layoutViewBox && targetTexts.length > 0 && (
        <Svg
          width={width}
          height={height}
          viewBox={viewBox ?? layoutViewBox}
          style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
        >
          {targetTexts.map((text, index) => (
            <SvgText
              key={index}
              transform={text.transform}
              fontFamily="Pretendard"
              fontSize={text.fontSize}
              fontWeight={text.fontWeight}
              fill={TARGET_TEXT_COLOR}
              stroke={TARGET_TEXT_COLOR}
              strokeWidth={text.fontSize * TARGET_TEXT_STROKE_RATIO}
            >
              {text.lines.map(([x, y, content], lineIndex) => (
                <TSpan key={lineIndex} x={x} y={y}>
                  {content}
                </TSpan>
              ))}
            </SvgText>
          ))}
        </Svg>
      )}
    </View>
  );
}
