import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { colors, typography } from '@/theme';

type Variant =
  | 'displayXl' | 'displayLg' | 'displayMd'
  | 'headingXl' | 'headingLg' | 'headingMd' | 'headingSm' | 'headingXs'
  | 'bodyXl' | 'bodyLg' | 'bodyMd' | 'bodySm' | 'bodyXs'
  | 'labelLg' | 'labelMd' | 'labelSm';

type ColorKey = 'primary' | 'secondary' | 'tertiary' | 'disabled' | 'income' | 'expense' | 'transfer' | 'brand';

interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: ColorKey;
}

const variantStyles: Record<Variant, object> = {
  displayXl:  typography.display.xl,
  displayLg:  typography.display.lg,
  displayMd:  typography.display.md,
  headingXl:  typography.heading.xl,
  headingLg:  typography.heading.lg,
  headingMd:  typography.heading.md,
  headingSm:  typography.heading.sm,
  headingXs:  typography.heading.xs,
  bodyXl:     typography.body.xl,
  bodyLg:     typography.body.lg,
  bodyMd:     typography.body.md,
  bodySm:     typography.body.sm,
  bodyXs:     typography.body.xs,
  labelLg:    typography.label.lg,
  labelMd:    typography.label.md,
  labelSm:    typography.label.sm,
};

const colorMap: Record<ColorKey, string> = {
  primary:   colors.text.primary,
  secondary: colors.text.secondary,
  tertiary:  colors.text.tertiary,
  disabled:  colors.text.disabled,
  income:    colors.income,
  expense:   colors.expense,
  transfer:  colors.transfer,
  brand:     colors.brand.primary,
};

export function Text({ variant = 'bodyMd', color = 'primary', style, ...props }: TextProps) {
  return (
    <RNText
      style={[variantStyles[variant], { color: colorMap[color] }, style]}
      {...props}
    />
  );
}
