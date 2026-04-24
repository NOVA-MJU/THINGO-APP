import { DefaultTheme, type Theme } from '@react-navigation/native';

export const THEME = {
  background: 'hsl(0 0% 100%)',
  foreground: 'hsl(0 0% 3.9%)',
  card: 'hsl(0 0% 100%)',
  cardForeground: 'hsl(0 0% 3.9%)',
  popover: 'hsl(0 0% 100%)',
  popoverForeground: 'hsl(0 0% 3.9%)',
  primary: 'hsl(0 0% 9%)',
  primaryForeground: 'hsl(0 0% 98%)',
  secondary: 'hsl(0 0% 96.1%)',
  secondaryForeground: 'hsl(0 0% 9%)',
  muted: 'hsl(0 0% 96.1%)',
  mutedForeground: 'hsl(0 0% 45.1%)',
  accent: 'hsl(0 0% 96.1%)',
  accentForeground: 'hsl(0 0% 9%)',
  destructive: 'hsl(0 84.2% 60.2%)',
  border: 'hsl(0 0% 89.8%)',
  input: 'hsl(0 0% 89.8%)',
  ring: 'hsl(0 0% 63%)',
  radius: '0.625rem',
  chart1: 'hsl(12 76% 61%)',
  chart2: 'hsl(173 58% 39%)',
  chart3: 'hsl(197 37% 24%)',
  chart4: 'hsl(43 74% 66%)',
  chart5: 'hsl(27 87% 67%)',
};

export const NAV_THEME: Theme = {
  ...DefaultTheme,
  colors: {
    background: THEME.background,
    border: THEME.border,
    card: THEME.card,
    notification: THEME.destructive,
    primary: THEME.primary,
    text: THEME.foreground,
  },
};