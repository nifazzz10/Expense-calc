import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'glass';

interface CardProps extends ViewProps {
  variant?: CardVariant;
  padding?: number;
}

export function Card({ variant = 'default', padding = spacing[4], style, children, ...props }: CardProps) {
  return (
    <View style={[styles.base, variantStyles[variant], { padding }, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
  },
});

const variantStyles = StyleSheet.create({
  default: {
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  elevated: {
    backgroundColor: colors.surface.secondary,
    ...shadow.md,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  glass: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
});
