import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { format } from 'date-fns';
import { colors, spacing } from '@/theme';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';
import { BalanceCard } from '@/features/dashboard/components/BalanceCard';
import { QuickAddBar } from '@/features/dashboard/components/QuickAddBar';
import { TransactionRow } from '@/features/transactions/components/TransactionRow';
import { AddTransactionSheet } from '@/features/transactions/components/AddTransactionSheet';
import { TransactionSkeleton, CardSkeleton } from '@/shared/components/feedback/SkeletonLoader';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { useRecentTransactions, useMonthSummary, useBalance, useDeleteTransaction } from '@/features/transactions/hooks/useTransactions';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { useAuthStore } from '@/store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import type { Transaction } from '@/types/database.types';

export default function DashboardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const sheetRef = useRef<BottomSheet>(null);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);

  const now = new Date();
  const { data: summary, isLoading: summaryLoading } = useMonthSummary(now.getFullYear(), now.getMonth() + 1);
  const { data: balance, isLoading: balanceLoading } = useBalance();
  const { data: recentTxns = [], isLoading: txnsLoading, refetch } = useRecentTransactions(8);
  const { data: categories = [] } = useCategories();
  const deleteTxn = useDeleteTransaction();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    setRefreshing(false);
  };

  const handleEdit = (txn: Transaction) => {
    setEditingTxn(txn);
    sheetRef.current?.expand();
  };

  // Recent-use categories: expense type first, sorted by sort_order
  const quickCategories = categories
    .filter((c) => c.type === 'expense' || c.type === 'all')
    .slice(0, 8);

  const greeting = () => {
    const h = now.getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.email?.split('@')[0] ?? 'there';

  return (
    <Screen safeArea padding={false} scroll={false}>
      <FlatList
        data={recentTxns}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Greeting */}
            <Animated.View entering={FadeInDown.duration(500)} style={styles.greeting}>
              <View>
                <Text variant="labelMd" color="secondary">
                  {greeting()},
                </Text>
                <Text variant="headingLg" style={styles.name}>
                  {firstName} 👋
                </Text>
              </View>
              <View style={styles.headerActions}>
                <Pressable
                  style={styles.iconBtn}
                  onPress={() => router.push('/(tabs)/networth')}
                >
                  <Ionicons name="trending-up-outline" size={20} color={colors.investment} />
                </Pressable>
                <Pressable
                  style={styles.iconBtn}
                  onPress={() => router.push('/import')}
                >
                  <Ionicons name="document-text-outline" size={20} color={colors.text.secondary} />
                </Pressable>
                <Pressable
                  style={styles.iconBtn}
                  onPress={() => router.push('/categories')}
                >
                  <Ionicons name="grid-outline" size={20} color={colors.text.secondary} />
                </Pressable>
              </View>
            </Animated.View>

            {/* Month label */}
            <Animated.View entering={FadeInDown.delay(50).duration(500)}>
              <Text variant="labelMd" color="tertiary" style={styles.monthLabel}>
                {format(now, 'MMMM yyyy')}
              </Text>
            </Animated.View>

            {/* Balance Card */}
            {summaryLoading || balanceLoading ? (
              <CardSkeleton />
            ) : (
              <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.cardWrapper}>
                <BalanceCard
                  income={summary?.income ?? 0}
                  expense={summary?.expense ?? 0}
                  savings={summary?.savings ?? 0}
                  balance={balance?.balance ?? 0}
                />
              </Animated.View>
            )}

            {/* Quick Add */}
            <Animated.View entering={FadeInDown.delay(200).duration(500)}>
              <QuickAddBar
                recentCategories={quickCategories}
                onQuickAdd={(catId) => {
                  setEditingTxn(null);
                  sheetRef.current?.expand();
                }}
                onAddCustom={() => {
                  setEditingTxn(null);
                  sheetRef.current?.expand();
                }}
              />
            </Animated.View>

            {/* Recent Transactions Header */}
            <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.sectionHeader}>
              <Text variant="headingXs">Recent Transactions</Text>
              <Pressable onPress={() => router.push('/transactions')}>
                <Text variant="labelMd" color="brand">
                  See all
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        }
        ListEmptyComponent={
          txnsLoading ? (
            <View style={styles.skeletons}>
              {[0, 1, 2, 3].map((i) => <TransactionSkeleton key={i} />)}
            </View>
          ) : (
            <EmptyState
              icon="receipt-outline"
              title="No transactions yet"
              description="Add your first transaction using the + button below"
              action={{
                label: 'Add Transaction',
                onPress: () => sheetRef.current?.expand(),
              }}
            />
          )
        }
        renderItem={({ item, index }) => (
          <TransactionRow
            transaction={item}
            index={index}
            onDelete={(id) => deleteTxn.mutate(id)}
            onEdit={handleEdit}
          />
        )}
        contentContainerStyle={styles.listContent}
      />

      <AddTransactionSheet
        sheetRef={sheetRef}
        editingTransaction={editingTxn}
        onDismiss={() => setEditingTxn(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing[5],
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
  },
  greeting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[5],
  },
  name: {
    marginTop: spacing[0.5],
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface.secondary,
    borderWidth: 1,
    borderColor: colors.surface.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    paddingHorizontal: spacing[5],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardWrapper: {
    paddingHorizontal: spacing[5],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
  },
  skeletons: { gap: spacing[1] },
  listContent: {
    paddingBottom: spacing[20],
    gap: spacing[0.5],
  },
});
