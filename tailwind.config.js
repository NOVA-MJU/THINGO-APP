const { hairlineWidth, platformSelect } = require('nativewind/theme');
const plugin = require('tailwindcss/plugin');

/**
 * 웹은 global.css의 @font-face가 font-weight 값만 보고 알맞은 두께의 파일을 스스로 매칭한다.
 * 반면 네이티브(iOS/Android)는 app/_layout.tsx에서 두께별 otf를 서로 다른 family 이름으로
 * 각각 등록해뒀기 때문에, font-weight 숫자만으로는 두께가 바뀌지 않고 항상 기본 family(Regular)로
 * 보인다. 그래서 text-* 유틸리티마다 두께에 맞는 네이티브 family 이름을 fontFamily로 함께 지정한다.
 * (platformSelect는 nativewind가 런타임에 실제 Platform.select로 치환해주는 마커라
 * ios/android 빌드에서 각각 안전하게 동작한다 - hairlineWidth()와 동일한 원리)
 */
const NATIVE_FONT_FAMILY_BY_WEIGHT = {
  200: 'Pretendard-ExtraLight',
  400: 'Pretendard',
  500: 'Pretendard-Medium',
  600: 'Pretendard-SemiBold',
  700: 'Pretendard-Bold',
  800: 'Pretendard-ExtraBold',
};

function pretendardFontFamily(fontWeight) {
  return platformSelect({
    web: 'Pretendard',
    default: NATIVE_FONT_FAMILY_BY_WEIGHT[fontWeight],
  });
}

// heading01~caption09: 디자인 시스템에서 정의한 고정 텍스트 스타일 세트.
// fontFamily까지 함께 지정해야 해서 fontSize 코어 플러그인(lineHeight/letterSpacing/fontWeight만 허용) 대신
// 커스텀 플러그인(textStylesPlugin)에서 text-* 유틸리티를 직접 생성한다.
const TEXT_STYLES = {
  heading01: { fontSize: '40px', fontWeight: '700', lineHeight: '1.5' },
  heading02: { fontSize: '28px', fontWeight: '700', lineHeight: '1.5' },
  title01: { fontSize: '20px', fontWeight: '700', lineHeight: '1.5' },
  title02: { fontSize: '20px', fontWeight: '600', lineHeight: '1.5' },
  title03: { fontSize: '18px', fontWeight: '700', lineHeight: '1.5' },
  body01: { fontSize: '20px', fontWeight: '400', lineHeight: '1.5' },
  body02: { fontSize: '16px', fontWeight: '600', lineHeight: '1.5' },
  body03: { fontSize: '16px', fontWeight: '400', lineHeight: '1.5' },
  body04: { fontSize: '14px', fontWeight: '600', lineHeight: '1.5' },
  body05: { fontSize: '14px', fontWeight: '400', lineHeight: '1.5' },
  body06: { fontSize: '14px', fontWeight: '500', lineHeight: '1.5' },
  caption01: { fontSize: '12px', fontWeight: '600', lineHeight: '1.5' },
  caption02: { fontSize: '12px', fontWeight: '400', lineHeight: '1.5' },
  caption03: { fontSize: '11px', fontWeight: '600', lineHeight: '1.5' },
  caption04: { fontSize: '11px', fontWeight: '400', lineHeight: '1.5' },
  caption05: { fontSize: '10px', fontWeight: '600', lineHeight: '1.5' },
  caption06: { fontSize: '10px', fontWeight: '200', lineHeight: '1.5' },
  caption07: { fontSize: '8px', fontWeight: '400', lineHeight: '1.25' },
  caption08: { fontSize: '7px', fontWeight: '400', lineHeight: '1.25' },
  caption09: { fontSize: '6px', fontWeight: '400', lineHeight: '1.25' },
};

const textStylesPlugin = plugin(({ addUtilities }) => {
  addUtilities(
    Object.fromEntries(
      Object.entries(TEXT_STYLES).map(([name, { fontSize, fontWeight, lineHeight }]) => [
        `.text-${name}`,
        {
          fontSize,
          lineHeight,
          fontWeight,
          fontFamily: pretendardFontFamily(fontWeight),
        },
      ])
    )
  );
});

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    colors: {
      black: '#17171b',
      white: '#ffffff',
      bg: 'rgba(23, 23, 27, 0.6)',
      mju: {
        primary: '#1778ff',
        secondary: '#23aeff',
      },
      blue: {
        35: '#2587ff',
        20: '#4593ff',
        15: '#5dabff',
        10: '#8bc7ff',
        '05': '#e8f1ff',
        '02': '#edf6ff',
      },
      error: '#f45353',
      grey: {
        80: '#4b4d4f',
        60: '#6d7073',
        40: '#909499',
        30: '#aeb2b6',
        20: '#cdd0d4',
        10: '#e3e6e6',
        '02': '#f5f7f9',
      },
      border: 'hsl(var(--border))',
      input: 'hsl(var(--input))',
      ring: 'hsl(var(--ring))',
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      primary: {
        DEFAULT: 'hsl(var(--primary))',
        foreground: 'hsl(var(--primary-foreground))',
      },
      secondary: {
        DEFAULT: 'hsl(var(--secondary))',
        foreground: 'hsl(var(--secondary-foreground))',
      },
      destructive: {
        DEFAULT: 'hsl(var(--destructive))',
        foreground: 'hsl(var(--destructive-foreground))',
      },
      muted: {
        DEFAULT: 'hsl(var(--muted))',
        foreground: 'hsl(var(--muted-foreground))',
      },
      accent: {
        DEFAULT: 'hsl(var(--accent))',
        foreground: 'hsl(var(--accent-foreground))',
      },
      popover: {
        DEFAULT: 'hsl(var(--popover))',
        foreground: 'hsl(var(--popover-foreground))',
      },
      card: {
        DEFAULT: 'hsl(var(--card))',
        foreground: 'hsl(var(--card-foreground))',
      },
      transparent: 'transparent',
    },
    extend: {
      fontFamily: {
        pretendard: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'Apple SD Gothic Neo',
          'Noto Sans KR',
          'Malgun Gothic',
          'sans-serif',
        ],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [require('tailwindcss-animate'), textStylesPlugin],
};
