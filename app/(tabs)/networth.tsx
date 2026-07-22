import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '@/theme';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';
import { Card } from '@/shared/components/ui/Card';
import { CategoryIcon } from '@/shared/components/ui/CategoryIcon';
import { useBalance, useInvestmentTransactions } from '@/features/transactions/hooks/useTransactions';
import { useMonthlyAnalytics } from '@/features/analytics/hooks/useAnalytics';
import { formatCurrency, formatTransactionDate, getMonthName } from '@/shared/utils/format';
import { useSettingsStore } from '@/store/settingsStore';
import { CardSkeleton } from '@/shared/components/feedback/SkeletonLoader';
import type { Transaction } from '@/types/database.types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - spacing[5] * 2 - spacing[4] * 2;

export default function NetWorthScreen() {
  const { currencySymbol } = useSettingsStore();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());

  const { data: balance, isLoading: balanceLoading } = useBalance();
  const { data: monthly = [], isLoading: monthlyLoading } = useMonthlyAnalytics(year);
  const { data: investments = [], isLoading: investLoading } = useInvestmentTransactions(20);

  const cashBalance = balance?.balance ?? 0;
  const totalInvestment = balance?.totalInvestment ?? 0;
  const netWorth = cashBalance + totalInvestment;

  const barData: object[] = [];
  monthly.forEach((m, i) => {
    const label = getMonthName(i + 1).slice(0, 3);
    barData.push(
      { value: m.total_income, frontColor: colors.income, label, spacing: 2 },
      { value: m.total_expense, frontColor: colors.expense, spacing: 2 },
      { value: m.total_investment, frontColor: colors.investment, spacing: 14 },
    );
  });

  return (
    <Screen safeArea padding={false} scroll>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text variant="headingLg">Net Worth</Text>
        <View style={styles.yearPicker}>
          <Pressable onPress={() => setYear((y) => y - 1)} hitSlop={8}>
            <Ionicons name="chevron-back" size={20} color={colors.text.secondary} />
          </Pressable>
          <Text variant="bodyMd" style={{ fontWeight: '600', minWidth: 40, textAlign: 'center' }}>
            {year}
          </Text>
          <Pressable onPress={() => setYear((y) => y + 1)} hitSlop={8}>
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </Pressable>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Net Worth Hero */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          {balanceLoading ? (
            <CardSkeleton />
          ) : (
            <LinearGradient
              colors={['#1A1730', '#0F0D1E']}
              style={styles.heroCard}
            >
              <Text variant="labelMd" color="secondary" style={styles.heroLabel}>
                TOTAL NET WORTH
              </Text>
              <Text
                variant="displayMd"
                style={{ color: netWorth >= 0 ? colors.income : colors.expense, marginTop: spacing[1] }}
              >
                {formatCurrency(netWorth, currencySymbol)}
              </Text>
              <Text variant="bodySm" color="secondary" style={{ marginTop: spacing[1] }}>
                Cash balance + invested
              </Text>

              {/* Income vs Expense strip */}
              <View style={styles.heroStrip}>
                <View style={styles.heroStripItem}>
                  <View style={[styles.heroStripDot, { backgroundColor: colors.income }]} />
                  <Text variant="labelSm" color="secondary">Income</Text>
                  <Text variant="bodyMd" style={{ color: colors.income, fontWeight: '700' }}>
                    {formatCurrency(balance?.totalIncome ?? 0, currencySymbol)}
                  </Text>
                </View>
                <View style={styles.heroStripDivider} />
                <View style={styles.heroStripItem}>
                  <View style={[styles.heroStripDot, { backgroundColor: colors.expense }]} />
                  <Text variant="labelSm" color="secondary">Expenses</Text>
                  <Text variant="bodyMd" style={{ color: colors.expense, fontWeight: '700' }}>
                    {formatCurrency(balance?.totalExpense ?? 0, currencySymbol)}
                  </Text>
                </View>
                <View style={styles.heroStripDivider} />
                <View style={styles.heroStripItem}>
                  <View style={[styles.heroStripDot, { backgroundColor: colors.investment }]} />
                  <Text variant="labelSm" color="secondary">Invested</Text>
                  <Text variant="bodyMd" style={{ color: colors.investment, fontWeight: '700' }}>
                    {formatCurrency(totalInvestment, currencySymbol)}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          )}
        </Animated.View>

        {/* Cash / Investment breakdown */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.breakdownRow}>
          <View style={[styles.breakdownCard, { borderColor: colors.income + '33' }]}>
            <View style={[styles.breakdownIcon, { backgroundColor: colors.incomeLight }]}>
              <Ionicons name="wallet-outline" size={18} color={colors.income} />
            </View>
            <Text variant="labelSm" color="secondary">Cash Balance</Text>
            <Text variant="headingSm" style={{ color: cashBalance >= 0 ? colors.income : colors.expense }}>
              {formatCurrency(cashBalance, currencySymbol)}
            </Text>
            <Text variant="labelSm" color="secondary" style={styles.breakdownSub}>
              Income − Expenses − Invested
            </Text>
          </View>

          <View style={[styles.breakdownCard, { borderColor: colors.investment + '33' }]}>
            <View style={[styles.breakdownIcon, { backgroundColor: colors.investmentLight }]}>
              <Ionicons name="trending-up-outline" size={18} color={colors.investment} />
            </View>
            <Text variant="labelSm" color="secondary">Invested</Text>
            <Text variant="headingSm" style={{ color: colors.investment }}>
              {formatCurrency(totalInvestment, currencySymbol)}
            </Text>
            <Text variant="labelSm" color="secondary" style={styles.breakdownSub}>
              Total deployed
            </Text>
          </View>
        </Animated.View>

        {/* Monthly chart */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Text variant="labelMd" color="tertiary" style={styles.sectionTitle}>
            MONTHLY OVERVIEW — {year}
          </Text>
          <Card padding={spacing[4]}>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.income }]} />
                <Text variant="labelSm" color="secondary">Income</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.expense }]} />
                <Text variant="labelSm" color="secondary">Expense</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.investment }]} />
                <Text variant="labelSm" color="secondary">Invested</Text>
              </View>
            </View>

            {monthlyLoading ? (
              <View style={{ height: 160 }} />
            ) : (
              <BarChart
                data={barData}
                width={CHART_WIDTH}
                height={160}
                barWidth={7}
                noOfSections={4}
                barBorderRadius={3}
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: colors.text.disabled, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.text.disabled, fontSize: 9 }}
                hideRules={false}
                rulesColor={colors.surface.border}
                rulesType="solid"
                isAnimated
              />
            )}
          </Card>
        </Animated.View>

        {/* Investment transactions */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View style={styles.sectionHeader}>
            <Text variant="labelMd" color="tertiary" style={styles.sectionTitle}>
              INVESTMENT HISTORY
            </Text>
            {investments.length > 0 && (
              <Text variant="labelSm" style={{ color: colors.investment }}>
                {investments.length} entries
              </Text>
            )}
          </View>

          {investLoading ? (
            <CardSkeleton />
          ) : investments.length === 0 ? (
            <Card padding={spacing[5]}>
              <View style={styles.emptyState}>
                <Ionicons name="trending-up-outline" size={36} color={colors.text.disabled} />
                <Text variant="bodyMd" color="secondary" style={{ textAlign: 'center' }}>
                  No investments yet.{'\n'}Add one using the + button and select Investment.
                </Text>
              </View>
            </Card>
          ) : (
            <Card padding={0}>
              {investments.map((txn, i) => (
                <InvestmentRow
                  key={txn.id}
                  txn={txn}
                  currencySymbol={currencySymbol}
                  isLast={i === investments.length - 1}
                />
              ))}
            </Card>
          )}
        </Animated.View>

        <View style={{ height: spacing[10] }} />
      </ScrollView>
    </Screen>
  );
}

function InvestmentRow({
  txn,
  currencySymbol,
  isLast,
}: {
  txn: Transaction;
  currencySymbol: string;
  isLast: boolean;
}) {
  const cat = txn.category;
  return (
    <View style={[styles.investRow, !isLast && styles.investRowDivider]}>
      <View style={styles.investIcon}>
        {cat ? (
          <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
        ) : (
          <View style={styles.investIconFallback}>
            <Ionicons name="trending-up-outline" size={16} color={colors.investment} />
          </View>
        )}
      </View>
      <View style={styles.investInfo}>
        <Text variant="bodySm" numberOfLines={1} style={{ fontWeight: '500' }}>
          {txn.description}
        </Text>
        <Text variant="labelSm" color="tertiary">
          {formatTransactionDate(txn.transaction_date)}
          {cat ? `  ·  ${cat.name}` : ''}
        </Text>
      </View>
      <Text variant="bodySm" style={{ color: colors.investment, fontWeight: '700' }}>
        {formatCurrency(txn.amount, currencySymbol)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },
  yearPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  content: {
    paddingHorizontal: spacing[5],
    gap: spacing[4],
    paddingBottom: spacing[6],
  },

  // Hero card
  heroCard: {
    borderRadius: radius['2xl'],
    padding: spacing[6],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.brand.primary + '22',
    gap: spacing[1],
  },
  heroLabel: {
    letterSpacing: 0.8,
  },
  heroStrip: {
    flexDirection: 'row',
    marginTop: spacing[5],
    width: '100%',
  },
  heroStripItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[1],
  },
  heroStripDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: spacing[0.5],
  },
  heroStripDivider: {
    width: 1,
    backgroundColor: colors.surface.border,
    marginVertical: spacing[1],
  },

  // Breakdown cards
  breakdownRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  breakdownCard: {
    flex: 1,
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.xl,
    padding: spacing[4],
    alignItems: 'flex-start',
    gap: spacing[1],
    borderWidth: 1,
  },
  breakdownIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[1],
  },
  breakdownSub: {
    marginTop: spacing[0.5],
  },

  // Chart
  sectionTitle: {
    letterSpacing: 0.8,
    marginBottom: spacing[2],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  legend: {
    flexDirection: 'row',
    gap: spacing[4],
    marginBottom: spacing[3],
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[4],
  },

  // Investment rows
  investRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  investRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  investIcon: {
    flexShrink: 0,
  },
  investIconFallback: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.investmentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  investInfo: {
    flex: 1,
    gap: spacing[0.5],
  },
});
