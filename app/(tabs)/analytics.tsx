import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '@/theme';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';
import { Card } from '@/shared/components/ui/Card';
import { CategoryIcon } from '@/shared/components/ui/CategoryIcon';
import { useMonthlyAnalytics, useCategoryAnalytics } from '@/features/analytics/hooks/useAnalytics';
import { formatCurrency, getMonthName } from '@/shared/utils/format';
import { useSettingsStore } from '@/store/settingsStore';
import { CardSkeleton } from '@/shared/components/feedback/SkeletonLoader';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - spacing[5] * 2 - spacing[4] * 2;

export default function AnalyticsScreen() {
  const { currencySymbol } = useSettingsStore();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: monthly = [], isLoading: monthlyLoading } = useMonthlyAnalytics(year);
  const { data: categories = [], isLoading: catLoading } = useCategoryAnalytics(year, month);

  const barData = monthly.map((m, i) => ({
    value: m.total_expense,
    label: getMonthName(i + 1),
    frontColor: i + 1 === month ? colors.brand.primary : colors.surface.tertiary,
    topLabelComponent: () => null,
  }));

  const expenseCategories = categories.filter((c) => c.transaction_type === 'expense');
  const pieData = expenseCategories.slice(0, 6).map((c, i) => ({
    value: c.total_amount,
    color: colors.chart[i % colors.chart.length],
    label: c.category_name,
    focused: i === 0,
  }));

  const totalExpense = expenseCategories.reduce((s, c) => s + c.total_amount, 0);
  const totalIncome = categories
    .filter((c) => c.transaction_type === 'income')
    .reduce((s, c) => s + c.total_amount, 0);

  return (
    <Screen safeArea padding={false} scroll>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text variant="headingLg">Analytics</Text>
        <View style={styles.yearPicker}>
          <Pressable onPress={() => setYear((y) => y - 1)}>
            <Ionicons name="chevron-back" size={20} color={colors.text.secondary} />
          </Pressable>
          <Text variant="headingXs">{year}</Text>
          <Pressable onPress={() => setYear((y) => Math.min(now.getFullYear(), y + 1))}>
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </Pressable>
        </View>
      </Animated.View>

      {/* Month selector */}
      <Animated.View entering={FadeInDown.delay(50).duration(400)}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthPicker}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <Pressable
              key={m}
              style={[
                styles.monthChip,
                month === m && styles.monthChipActive,
              ]}
              onPress={() => setMonth(m)}
            >
              <Text
                variant="labelSm"
                style={{ color: month === m ? colors.brand.primary : colors.text.secondary }}
              >
                {getMonthName(m)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>

      <View style={styles.content}>
        {/* Summary cards */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.summaryRow}>
          <SummaryCard
            label="Income"
            value={formatCurrency(totalIncome, currencySymbol, true)}
            color={colors.income}
            icon="arrow-down-circle-outline"
          />
          <SummaryCard
            label="Expense"
            value={formatCurrency(totalExpense, currencySymbol, true)}
            color={colors.expense}
            icon="arrow-up-circle-outline"
          />
          <SummaryCard
            label="Savings"
            value={formatCurrency(totalIncome - totalExpense, currencySymbol, true)}
            color={totalIncome - totalExpense >= 0 ? colors.income : colors.expense}
            icon="trending-up-outline"
          />
        </Animated.View>

        {/* Monthly Bar Chart */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Card padding={spacing[4]}>
            <Text variant="headingXs" style={styles.chartTitle}>
              Monthly Spending
            </Text>
            {monthlyLoading ? (
              <CardSkeleton />
            ) : (
              <BarChart
                data={barData}
                width={CHART_WIDTH}
                height={160}
                barWidth={18}
                spacing={8}
                barBorderRadius={4}
                noOfSections={4}
                yAxisTextStyle={chartStyles.axisText}
                xAxisLabelTextStyle={chartStyles.axisText}
                yAxisColor={colors.surface.border}
                xAxisColor={colors.surface.border}
                rulesColor={colors.surface.border}
                hideRules={false}
                isAnimated
                animationDuration={600}
                formatYLabel={(v) => formatCurrency(Number(v), currencySymbol, true)}
              />
            )}
          </Card>
        </Animated.View>

        {/* Category Pie Chart */}
        {pieData.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Card padding={spacing[4]}>
              <Text variant="headingXs" style={styles.chartTitle}>
                Expense Breakdown
              </Text>
              {catLoading ? (
                <CardSkeleton />
              ) : (
                <View style={styles.pieWrapper}>
                  <PieChart
                    data={pieData}
                    donut
                    innerRadius={60}
                    radius={90}
                    centerLabelComponent={() => (
                      <View style={styles.pieCenterLabel}>
                        <Text variant="labelSm" color="secondary">
                          Total
                        </Text>
                        <Text variant="headingXs">
                          {formatCurrency(totalExpense, currencySymbol, true)}
                        </Text>
                      </View>
                    )}
                    isAnimated
                    animationDuration={800}
                  />

                  <View style={styles.legend}>
                    {expenseCategories.slice(0, 6).map((c, i) => (
                      <View key={c.category_id} style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendDot,
                            { backgroundColor: colors.chart[i % colors.chart.length] },
                          ]}
                        />
                        <Text variant="labelSm" color="secondary" numberOfLines={1} style={styles.legendLabel}>
                          {c.category_name}
                        </Text>
                        <Text variant="labelSm" style={{ color: colors.text.primary }}>
                          {formatCurrency(c.total_amount, currencySymbol, true)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </Card>
          </Animated.View>
        )}

        {/* Top categories list */}
        {expenseCategories.length > 0 && (
          <Animated.View entering={FadeInDown.delay(250).duration(400)}>
            <Card padding={spacing[4]}>
              <Text variant="headingXs" style={styles.chartTitle}>
                Top Categories
              </Text>
              <View style={styles.categoryList}>
                {expenseCategories.slice(0, 5).map((cat, i) => {
                  const pct = totalExpense > 0 ? (cat.total_amount / totalExpense) * 100 : 0;
                  return (
                    <View key={cat.category_id} style={styles.catRow}>
                      <CategoryIcon icon={cat.category_icon} color={cat.category_color} size="sm" />
                      <View style={styles.catInfo}>
                        <View style={styles.catHeader}>
                          <Text variant="bodySm" style={{ fontWeight: '500' }}>
                            {cat.category_name}
                          </Text>
                          <Text variant="bodySm" style={{ fontWeight: '700' }}>
                            {formatCurrency(cat.total_amount, currencySymbol)}
                          </Text>
                        </View>
                        <View style={styles.catBar}>
                          <View
                            style={[
                              styles.catBarFill,
                              {
                                width: `${pct}%`,
                                backgroundColor: cat.category_color,
                              },
                            ]}
                          />
                        </View>
                        <Text variant="labelSm" color="tertiary">
                          {pct.toFixed(1)}% of total
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </Card>
          </Animated.View>
        )}
      </View>
    </Screen>
  );
}

function SummaryCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={[summaryStyles.card, { borderColor: `${color}40` }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text variant="labelSm" color="secondary">{label}</Text>
      <Text variant="headingXs" style={{ color }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  yearPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  monthPicker: {
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
  },
  monthChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.secondary,
  },
  monthChipActive: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.light,
  },
  content: {
    paddingHorizontal: spacing[5],
    gap: spacing[4],
    paddingBottom: spacing[10],
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  chartTitle: {
    marginBottom: spacing[4],
  },
  pieWrapper: {
    alignItems: 'center',
    gap: spacing[5],
  },
  pieCenterLabel: {
    alignItems: 'center',
    gap: spacing[0.5],
  },
  legend: {
    width: '100%',
    gap: spacing[2],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
  },
  categoryList: {
    gap: spacing[4],
  },
  catRow: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'flex-start',
  },
  catInfo: {
    flex: 1,
    gap: spacing[1],
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catBar: {
    height: 4,
    backgroundColor: colors.surface.tertiary,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  catBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },
});

const summaryStyles = StyleSheet.create({
  card: {
    flex: 1,
    padding: spacing[3],
    borderRadius: radius.xl,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    gap: spacing[1],
    alignItems: 'center',
  },
});

const chartStyles = {
  axisText: {
    color: colors.text.tertiary,
    fontSize: 10,
  },
};
