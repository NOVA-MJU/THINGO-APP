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
  RadialGradient,
  Stop,
} from 'react-native-svg';

interface BreakfastMealIconProps {
  size?: number;
}

export default function BreakfastMealIcon({ size = 24 }: BreakfastMealIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <Filter
          id="filter0_i"
          x="9"
          y="8.76049"
          width="6.24"
          height="6.24"
          filterUnits="userSpaceOnUse"
        >
          <FeFlood floodOpacity="0" result="BackgroundImageFix" />
          <FeBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <FeColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <FeOffset dx="0.24" dy="-0.24" />
          <FeGaussianBlur stdDeviation="0.6" />
          <FeComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <FeColorMatrix
            type="matrix"
            values="0 0 0 0 1 0 0 0 0 0.679808 0 0 0 0 0.288462 0 0 0 1 0"
          />
          <FeBlend mode="normal" in2="shape" result="effect1_innerShadow" />
        </Filter>
        <RadialGradient
          id="paint0_radial"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(12 11.9995) rotate(90) scale(9 10)"
        >
          <Stop stopColor="#FFDA9E" />
          <Stop offset="0.745192" stopColor="#FFF6D8" />
        </RadialGradient>
        <LinearGradient
          id="paint1_linear"
          x1="12"
          y1="2.99951"
          x2="12"
          y2="20.9995"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#D47C62" />
          <Stop offset="1" stopColor="#9C3A1D" />
        </LinearGradient>
        <LinearGradient
          id="paint2_linear"
          x1="10.3944"
          y1="10.3956"
          x2="13.6051"
          y2="13.6062"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#FFD545" />
          <Stop offset="1" stopColor="#FFAD4A" />
        </LinearGradient>
        <LinearGradient
          id="paint3_linear"
          x1="11.1541"
          y1="10.6001"
          x2="9.48749"
          y2="12.2667"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="white" stopOpacity="0.7" />
          <Stop offset="1" stopColor="white" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path
        d="M4.27734 11.1763L4.02441 10.9526C3.16466 10.1912 2.75015 9.36946 2.75 8.56201L2.75977 8.34717C2.85837 7.27352 3.69673 6.17209 5.29395 5.28369C6.97245 4.3502 9.34197 3.74951 12 3.74951C14.658 3.74954 17.0275 4.3502 18.7061 5.28369C20.4098 6.23136 21.2499 7.42181 21.25 8.56201C21.2498 9.36968 20.835 10.192 19.9746 10.9536L19.7217 11.1772V19.9194L19.7158 19.9653C19.6873 20.0811 19.5555 20.2495 19.2715 20.2495H4.72754C4.40277 20.2494 4.2774 20.029 4.27734 19.9194V11.1763Z"
        fill="url(#paint0_radial)"
        stroke="url(#paint1_linear)"
        strokeWidth="1.5"
      />
      <G filter="url(#filter0_i)">
        <Path
          d="M11.6404 9.14944C11.839 8.95084 12.161 8.95084 12.3596 9.14944L14.851 11.6409C15.0497 11.8395 15.0497 12.1615 14.851 12.3601L12.3596 14.8515C12.161 15.0501 11.839 15.0501 11.6404 14.8515L9.14896 12.3601C8.95035 12.1615 8.95035 11.8395 9.14895 11.6409L11.6404 9.14944Z"
          fill="url(#paint2_linear)"
        />
      </G>
      <Path
        d="M11.2861 10.1762C11.5204 9.94191 11.9004 9.94191 12.1347 10.1762C12.3689 10.4105 12.3689 10.7896 12.1347 11.0239L11.0234 12.1352C10.7891 12.3694 10.41 12.3694 10.1757 12.1352C9.94142 11.9009 9.94142 11.5209 10.1757 11.2866L11.2861 10.1762Z"
        fill="url(#paint3_linear)"
      />
    </Svg>
  );
}
