import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '@/theme';
import { Text } from '@/shared/components/ui/Text';
import { formatCurrency } from '@/shared/utils/format';
import { useSettingsStore } from '@/store/settingsStore';

interface BalanceCardProps {
  income: number;
  expense: number;
  savings: number;
  balance: number;
  isLoading?: boolean;
}

export function BalanceCard({ income, expense, savings, balance, isLoading }: BalanceCardProps) {
  const { currencySymbol } = useSettingsStore();
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 20, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 400 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const savingsPercent = income > 0 ? Math.max(0, Math.min(100, (savings / income) * 100)) : 0;

  return (
    <Animated.View style={animStyle} entering={FadeInDown.duration(500)}>
      <LinearGradient
        colors={['#1C1A3E', '#12112A']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative circles */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        {/* Total Balance */}
        <View style={styles.balanceSection}>
          <Text variant="labelMd" color="secondary">
            Total Balance
          </Text>
          <Text
            variant="displayMd"
            style={{ color: balance >= 0 ? colors.white : colors.expense, letterSpacing: -1.5 }}
          >
            {formatCurrency(Math.abs(balance), currencySymbol)}
          </Text>
        </View>

        {/* Month stats */}
        <View style={styles.stats}>
          <StatItem
            icon="arrow-down-circle"
            iconColor={colors.income}
            label="Income"
            value={formatCurrency(income, currencySymbol, true)}
            valueColor={colors.income}
          />
          <View style={styles.divider} />
          <StatItem
            icon="arrow-up-circle"
            iconColor={colors.expense}
            label="Expense"
            value={formatCurrency(expense, currencySymbol, true)}
            valueColor={colors.expense}
          />
          <View style={styles.divider} />
          <StatItem
            icon="trending-up"
            iconColor={colors.transfer}
            label="Savings"
            value={formatCurrency(savings, currencySymbol, true)}
            valueColor={savings >= 0 ? colors.income : colors.expense}
          />
        </View>

        {/* Savings progress bar */}
        {income > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text variant="labelSm" color="secondary">
                Savings rate
              </Text>
              <Text variant="labelSm" style={{ color: colors.brand.secondary }}>
                {savingsPercent.toFixed(0)}%
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: `${savingsPercent}%`, backgroundColor: savingsPercent >= 20 ? colors.income : colors.expense },
                ]}
              />
            </View>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

function StatItem({
  icon,
  iconColor,
  label,
  value,
  valueColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <View style={statStyles.container}>
      <View style={[statStyles.icon, { backgroundColor: `${iconColor}22` }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text variant="labelSm" color="secondary">{label}</Text>
      <Text variant="labelLg" style={{ color: valueColor, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius['3xl'],
    padding: spacing[5],
    gap: spacing[5],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(124,111,247,0.2)',
  },
  circle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(124,111,247,0.06)',
    top: -60,
    right: -40,
  },
  circle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0,212,168,0.05)',
    bottom: -20,
    left: -20,
  },
  balanceSection: {
    gap: spacing[1],
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.xl,
    padding: spacing[4],
    gap: spacing[2],
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressSection: {
    gap: spacing[2],
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
});

const statStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[1],
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
