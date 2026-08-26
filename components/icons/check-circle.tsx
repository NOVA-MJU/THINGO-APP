import { cssInterop } from 'nativewind';
import Svg, { Path, Rect } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface CheckCircleIconProps {
  size?: number;
  checked?: boolean;
  className?: string;
}

// 원형 배경 안에 체크마크가 들어가는 선택 표시 아이콘 (즐겨찾기 그룹 체크리스트 등에서 사용).
// CheckboxIcon(checkbox.tsx)은 사각형이라 원형 디자인은 별도 컴포넌트로 둔다.
export default function CheckCircleIcon({
  size = 20,
  checked = false,
  className,
}: CheckCircleIconProps) {
  const colorClassName = className ?? (checked ? 'text-[#3B96FF]' : 'text-[#AEB2B6]');

  return (
    <StyledSvg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      className={colorClassName}
    >
      {checked ? (
        <>
          <Rect x="2" y="2" width="16" height="16" rx="8" fill="currentColor" />
          <Path
            d="M13.1118 6.91803C13.3026 6.70712 13.6261 6.69281 13.8342 6.88615C14.0423 7.07949 14.0564 7.40735 13.8657 7.61825L8.93225 13.0718C8.89045 13.118 8.84187 13.1539 8.78996 13.1811C8.59457 13.295 8.34083 13.2679 8.17384 13.0986L6.14973 11.047C5.9501 10.8447 5.95008 10.5167 6.14973 10.3144C6.34939 10.1121 6.67304 10.1121 6.8727 10.3144L8.52434 11.9881L13.1118 6.91803Z"
            fill="white"
          />
        </>
      ) : (
        <>
          <Rect x="2.5" y="2.5" width="15" height="15" rx="7.5" stroke="currentColor" />
          <Path
            d="M13.1118 6.91803C13.3026 6.70712 13.6261 6.69281 13.8342 6.88615C14.0423 7.07949 14.0564 7.40735 13.8657 7.61825L8.93225 13.0718C8.89045 13.118 8.84187 13.1539 8.78996 13.1811C8.59457 13.295 8.34083 13.2679 8.17384 13.0986L6.14973 11.047C5.9501 10.8447 5.95008 10.5167 6.14973 10.3144C6.34939 10.1121 6.67304 10.1121 6.8727 10.3144L8.52434 11.9881L13.1118 6.91803Z"
            fill="currentColor"
          />
        </>
      )}
    </StyledSvg>
  );
}
