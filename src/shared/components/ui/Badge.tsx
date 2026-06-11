import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { Text } from './Text';
import type { TransactionType } from '@/types/database.types';

interface BadgeProps {
  label: string;
  variant?: 'income' | 'expense' | 'transfer' | 'investment' | 'default' | 'brand';
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  return (
    <View style={[styles.base, variantStyles[variant]]}>
      <Text variant="labelSm" style={[styles.text, textStyles[variant]]}>
        {label}
      </Text>
    </View>
  );
}

export function TypeBadge({ type }: { type: TransactionType }) {
  const config: Record<TransactionType, { label: string; variant: BadgeProps['variant'] }> = {
    income:     { label: 'Income',     variant: 'income' },
    expense:    { label: 'Expense',    variant: 'expense' },
    transfer:   { label: 'Transfer',   variant: 'transfer' },
    investment: { label: 'Investment', variant: 'investment' },
  };
  const { label, variant } = config[type];
  return <Badge label={label} variant={variant} />;
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[0.5],
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

const variantStyles = StyleSheet.create({
  income:     { backgroundColor: colors.incomeLight },
  expense:    { backgroundColor: colors.expenseLight },
  transfer:   { backgroundColor: colors.transferLight },
  investment: { backgroundColor: colors.investmentLight },
  default:    { backgroundColor: colors.surface.secondary },
  brand:      { backgroundColor: colors.brand.light },
});

const textStyles = StyleSheet.create({
  income:     { color: colors.income },
  expense:    { color: colors.expense },
  transfer:   { color: colors.transfer },
  investment: { color: colors.investment },
  default:    { color: colors.text.secondary },
  brand:      { color: colors.brand.primary },
});
