export const colors = {
  // Backgrounds
  background: {
    primary: '#0A0A0F',
    secondary: '#111118',
    tertiary: '#1A1A26',
    elevated: '#20202E',
    overlay: 'rgba(0,0,0,0.7)',
  },

  // Surfaces / Cards
  surface: {
    primary: '#161622',
    secondary: '#1E1E2E',
    tertiary: '#252538',
    border: '#2A2A3E',
    divider: '#1E1E2E',
  },

  // Brand / Accent
  brand: {
    primary: '#7C6FF7',
    secondary: '#9D8FFF',
    light: 'rgba(124,111,247,0.15)',
    gradient: ['#7C6FF7', '#5B50D6'],
  },

  // Semantic
  income: '#00D4A8',
  incomeLight: 'rgba(0,212,168,0.15)',
  expense: '#FF4B6E',
  expenseLight: 'rgba(255,75,110,0.15)',
  transfer: '#FFB547',
  transferLight: 'rgba(255,181,71,0.15)',
  investment: '#AB47BC',
  investmentLight: 'rgba(171,71,188,0.15)',

  // Status
  success: '#00D4A8',
  successLight: 'rgba(0,212,168,0.15)',
  warning: '#FFB547',
  warningLight: 'rgba(255,181,71,0.15)',
  error: '#FF4B6E',
  errorLight: 'rgba(255,75,110,0.15)',
  info: '#4FC3F7',
  infoLight: 'rgba(79,195,247,0.15)',

  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#9B9BB5',
    tertiary: '#5C5C7A',
    disabled: '#3A3A54',
    inverse: '#0A0A0F',
  },

  // Category colors
  category: {
    food: '#FF7043',
    fuel: '#42A5F5',
    salary: '#66BB6A',
    investment: '#AB47BC',
    rent: '#EC407A',
    shopping: '#FF7043',
    travel: '#26C6DA',
    medical: '#EF5350',
    bills: '#FFA726',
    entertainment: '#7E57C2',
    subscriptions: '#26A69A',
    other: '#78909C',
  },

  // Chart colors
  chart: [
    '#7C6FF7',
    '#00D4A8',
    '#FF4B6E',
    '#FFB547',
    '#4FC3F7',
    '#FF7043',
    '#AB47BC',
    '#26C6DA',
    '#EF5350',
    '#66BB6A',
  ],

  // Utility
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type Colors = typeof colors;
