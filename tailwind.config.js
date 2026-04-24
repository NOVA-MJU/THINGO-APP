const { hairlineWidth } = require('nativewind/theme');

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
      },
      error: '#f45353',
      grey: {
        80: '#4b4d4f',
        60: '#6d7073',
        40: '#909499',
        30: '#aeb2b6',
        20: '#cdd0d4',
        10: '#e3e6e6',
        '02': '#f0f2f5',
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
      fontSize: {
        heading01: ['40px', { lineHeight: '1.5', fontWeight: '700' }],
        heading02: ['28px', { lineHeight: '1.5', fontWeight: '700' }],
        title01: ['20px', { lineHeight: '1.5', fontWeight: '700' }],
        title02: ['20px', { lineHeight: '1.5', fontWeight: '600' }],
        title03: ['18px', { lineHeight: '1.5', fontWeight: '700' }],
        body01: ['20px', { lineHeight: '1.5', fontWeight: '400' }],
        body02: ['16px', { lineHeight: '1.5', fontWeight: '600' }],
        body03: ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        body04: ['14px', { lineHeight: '1.5', fontWeight: '600' }],
        body05: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        body06: ['14px', { lineHeight: '1.5', fontWeight: '500' }],
        caption01: ['12px', { lineHeight: '1.5', fontWeight: '600' }],
        caption02: ['12px', { lineHeight: '1.5', fontWeight: '400' }],
        caption03: ['11px', { lineHeight: '1.5', fontWeight: '600' }],
        caption04: ['11px', { lineHeight: '1.5', fontWeight: '400' }],
        caption05: ['10px', { lineHeight: '1.5', fontWeight: '600' }],
        caption06: ['10px', { lineHeight: '1.5', fontWeight: '200' }],
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
  plugins: [require('tailwindcss-animate')],
};
