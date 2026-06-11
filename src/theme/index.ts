export { colors } from './colors';
export { typography, fontWeights } from './typography';
export { spacing, radius, shadow } from './spacing';

export const CATEGORY_ICONS = [
  'fast-food', 'restaurant', 'cafe', 'pizza', 'beer',
  'car', 'bus', 'train', 'airplane', 'bicycle',
  'cash', 'card', 'wallet', 'briefcase', 'trending-up',
  'home', 'business', 'school', 'medical', 'fitness',
  'cart', 'bag', 'gift', 'pricetag', 'storefront',
  'film', 'game-controller', 'musical-notes', 'headset', 'tv',
  'phone-portrait', 'laptop', 'desktop', 'wifi', 'flash',
  'water', 'leaf', 'heart', 'star', 'ribbon',
  'people', 'person', 'child', 'body', 'happy',
  'apps', 'grid', 'layers', 'settings', 'options',
] as const;

export type CategoryIcon = typeof CATEGORY_ICONS[number];

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
] as const;

export type CurrencyCode = typeof CURRENCIES[number]['code'];
