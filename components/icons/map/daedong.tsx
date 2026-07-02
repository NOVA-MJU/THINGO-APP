import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';

const StyledSvg = cssInterop(Svg, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface DaedongIconProps {
  size?: number;
  className?: string;
}

export default function DaedongIcon({ size = 28, className = 'text-black' }: DaedongIconProps) {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <Path
        d="M8.41905 5.20622C11.464 2.26595 16.2746 2.26585 19.3194 5.20622C22.1088 7.90072 22.5381 12.2354 20.3321 15.4308L14.3673 24.0705C14.1267 24.4189 13.6119 24.4188 13.3712 24.0705L7.40538 15.4308C5.19959 12.2354 5.62964 7.90065 8.41905 5.20622ZM18.2765 6.28532C15.8899 3.98094 12.1665 3.90904 9.69639 6.0695L9.46104 6.28532C7.20052 8.4689 6.85049 11.986 8.63975 14.5783L13.8683 22.1506L19.0978 14.5783C20.8872 11.9859 20.5371 8.46895 18.2765 6.28532ZM13.9562 12.1486H13.9835L15.3419 7.84294H17.0538V13.8957H15.8185V9.3693H15.7921L14.3536 13.8957H13.3741L11.9532 9.36051H11.9269V13.8957H10.8419V7.84294H12.5802L13.9562 12.1486Z"
        fill="currentColor"
      />
    </StyledSvg>
  );
}
