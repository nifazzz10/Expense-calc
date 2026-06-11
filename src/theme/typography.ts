import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: {
    thin: 'System',
    light: 'System',
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
    heavy: 'System',
  },
  android: {
    thin: 'sans-serif-thin',
    light: 'sans-serif-light',
    regular: 'sans-serif',
    medium: 'sans-serif-medium',
    semibold: 'sans-serif-medium',
    bold: 'sans-serif',
    heavy: 'sans-serif',
  },
  default: {
    thin: 'System',
    light: 'System',
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
    heavy: 'System',
  },
});

const fontWeight = {
  thin: '100' as const,
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const typography = {
  // Display — hero numbers, balance
  display: {
    xl: { fontSize: 48, fontWeight: fontWeight.bold, letterSpacing: -2, lineHeight: 56 },
    lg: { fontSize: 40, fontWeight: fontWeight.bold, letterSpacing: -1.5, lineHeight: 48 },
    md: { fontSize: 32, fontWeight: fontWeight.bold, letterSpacing: -1, lineHeight: 40 },
  },

  // Headings
  heading: {
    xl: { fontSize: 28, fontWeight: fontWeight.bold, letterSpacing: -0.5, lineHeight: 34 },
    lg: { fontSize: 24, fontWeight: fontWeight.bold, letterSpacing: -0.3, lineHeight: 30 },
    md: { fontSize: 20, fontWeight: fontWeight.semibold, letterSpacing: -0.2, lineHeight: 26 },
    sm: { fontSize: 18, fontWeight: fontWeight.semibold, letterSpacing: -0.1, lineHeight: 24 },
    xs: { fontSize: 16, fontWeight: fontWeight.semibold, letterSpacing: 0, lineHeight: 22 },
  },

  // Body text
  body: {
    xl: { fontSize: 18, fontWeight: fontWeight.regular, letterSpacing: 0, lineHeight: 26 },
    lg: { fontSize: 16, fontWeight: fontWeight.regular, letterSpacing: 0, lineHeight: 24 },
    md: { fontSize: 14, fontWeight: fontWeight.regular, letterSpacing: 0, lineHeight: 22 },
    sm: { fontSize: 13, fontWeight: fontWeight.regular, letterSpacing: 0, lineHeight: 20 },
    xs: { fontSize: 12, fontWeight: fontWeight.regular, letterSpacing: 0, lineHeight: 18 },
  },

  // Labels / UI text
  label: {
    lg: { fontSize: 14, fontWeight: fontWeight.medium, letterSpacing: 0.1, lineHeight: 20 },
    md: { fontSize: 12, fontWeight: fontWeight.medium, letterSpacing: 0.2, lineHeight: 18 },
    sm: { fontSize: 11, fontWeight: fontWeight.medium, letterSpacing: 0.3, lineHeight: 16 },
  },

  // Monospace for amounts
  mono: {
    lg: { fontSize: 24, fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontWeight: fontWeight.semibold },
    md: { fontSize: 18, fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontWeight: fontWeight.medium },
    sm: { fontSize: 14, fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontWeight: fontWeight.regular },
  },
} as const;

export const fontWeights = fontWeight;
export type Typography = typeof typography;
