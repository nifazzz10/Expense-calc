import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { colors, spacing, radius } from '@/theme';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { TransactionRow } from '@/features/transactions/components/TransactionRow';
import { AddTransactionSheet } from '@/features/transactions/components/AddTransactionSheet';
import { TransactionSkeleton } from '@/shared/components/feedback/SkeletonLoader';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import {
  useTransactionList,
  useDeleteTransaction,
  useDeleteTransactions,
} from '@/features/transactions/hooks/useTransactions';
import { useCategories } from '@/features/categories/hooks/useCategories';
import type { Transaction, TransactionType, Category } from '@/types/database.types';
import * as Haptics from 'expo-haptics';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type FilterType = TransactionType | 'all';

type DatePreset = 'all' | 'today' | 'this_month' | 'last_month' | 'last_3_months';

interface ActiveFilters {
  type: FilterType;
  categoryId: string | undefined;
  datePreset: DatePreset;
  sortBy: 'date' | 'amount';
  sortOrder: 'asc' | 'desc';
}

const DEFAULT_FILTERS: ActiveFilters = {
  type: 'all',
  categoryId: undefined,
  datePreset: 'all',
  sortBy: 'date',
  sortOrder: 'desc',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function dateRangeForPreset(preset: DatePreset): { date_from?: string; date_to?: string } {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  if (preset === 'today') {
    return { date_from: fmt(today), date_to: fmt(today) };
  }
  if (preset === 'this_month') {
    return { date_from: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), date_to: fmt(today) };
  }
  if (preset === 'last_month') {
    const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const last = new Date(today.getFullYear(), today.getMonth(), 0);
    return { date_from: fmt(first), date_to: fmt(last) };
  }
  if (preset === 'last_3_months') {
    const from = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
    return { date_from: fmt(from), date_to: fmt(today) };
  }
  return {};
}

function countActiveFilters(f: ActiveFilters): number {
  return [
    f.type !== 'all',
    !!f.categoryId,
    f.datePreset !== 'all',
    f.sortBy !== 'date' || f.sortOrder !== 'desc',
  ].filter(Boolean).length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function TransactionsScreen() {
  const addSheetRef = useRef<BottomSheet | null>(null);
  const filterSheetRef = useRef<BottomSheet | null>(null);

  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<ActiveFilters>(DEFAULT_FILTERS);
  const [pendingFilters, setPendingFilters] = useState<ActiveFilters>(DEFAULT_FILTERS);

  // Selection mode
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set<string>());

  const { data: categoriesData } = useCategories();
  const categories = categoriesData ?? [];

  const queryFilters = useMemo(() => ({
    search: search.length > 1 ? search : undefined,
    transaction_type: appliedFilters.type !== 'all' ? appliedFilters.type : undefined,
    category_id: appliedFilters.categoryId,
    sort_by: appliedFilters.sortBy,
    sort_order: appliedFilters.sortOrder,
    ...dateRangeForPreset(appliedFilters.datePreset),
  }), [search, appliedFilters]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useTransactionList(queryFilters);

  const deleteTxn = useDeleteTransaction();
  const deleteTxns = useDeleteTransactions();

  const transactions = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  );

  const activeFilterCount = countActiveFilters(appliedFilters);

  // ── Selection helpers ──────────────────────────────────────────────────────

  const enterSelectionMode = useCallback((id: string) => {
    setSelectionMode(true);
    setSelectedIds(new Set([id]));
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(transactions.map((t) => t.id)));
  }, [transactions]);

  const handleBulkDelete = useCallback(() => {
    const count = selectedIds.size;
    Alert.alert(
      `Delete ${count} Transaction${count !== 1 ? 's' : ''}`,
      `Are you sure you want to delete ${count} transaction${count !== 1 ? 's' : ''}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTxns.mutate([...selectedIds], { onSuccess: exitSelectionMode });
          },
        },
      ],
    );
  }, [selectedIds, deleteTxns, exitSelectionMode]);

  // ── Edit / delete single ──────────────────────────────────────────────────

  const handleEdit = useCallback((txn: Transaction) => {
    setEditingTxn(txn);
    addSheetRef.current?.expand();
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── Filter sheet ──────────────────────────────────────────────────────────

  const openFilter = useCallback(() => {
    setPendingFilters(appliedFilters);
    filterSheetRef.current?.expand();
  }, [appliedFilters]);

  const applyFilters = useCallback(() => {
    setAppliedFilters(pendingFilters);
    filterSheetRef.current?.close();
  }, [pendingFilters]);

  const resetFilters = useCallback(() => {
    setPendingFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    filterSheetRef.current?.close();
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Screen safeArea padding={false} scroll={false}>

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        {selectionMode ? (
          <>
            <Pressable onPress={exitSelectionMode} style={styles.headerBtn}>
              <Ionicons name="close" size={22} color={colors.text.primary} />
            </Pressable>
            <Text variant="headingMd">
              {selectedIds.size} selected
            </Text>
            <View style={styles.headerActions}>
              <Pressable onPress={selectAll} style={styles.headerBtn}>
                <Text variant="labelMd" color="brand">All</Text>
              </Pressable>
              <Pressable
                onPress={handleBulkDelete}
                style={[styles.headerBtn, styles.deleteBtn]}
                disabled={selectedIds.size === 0}
              >
                <Ionicons name="trash-outline" size={18} color={colors.white} />
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Text variant="headingLg">Transactions</Text>
            <Pressable style={styles.filterIconBtn} onPress={openFilter}>
              <Ionicons name="options-outline" size={20} color={colors.text.secondary} />
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text variant="labelSm" style={{ color: colors.white, fontSize: 10 }}>
                    {activeFilterCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </>
        )}
      </Animated.View>

      {/* Search */}
      {!selectionMode && (
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.searchWrapper}>
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Search transactions..."
            prefix={<Ionicons name="search-outline" size={18} color={colors.text.tertiary} />}
            suffix={
              search.length > 0 ? (
                <Pressable onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color={colors.text.tertiary} />
                </Pressable>
              ) : null
            }
          />
        </Animated.View>
      )}

      {/* Type filter chips */}
      {!selectionMode && (
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <FlatList
            data={TYPE_FILTERS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(i) => i.value}
            contentContainerStyle={styles.chips}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.chip, appliedFilters.type === item.value && styles.chipActive]}
                onPress={() => {
                  setAppliedFilters((f) => ({ ...f, type: item.value }));
                  Haptics.selectionAsync();
                }}
              >
                <Text
                  variant="labelMd"
                  style={{
                    color: appliedFilters.type === item.value
                      ? colors.brand.primary : colors.text.secondary,
                    fontWeight: appliedFilters.type === item.value ? '700' : '400',
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            )}
          />
        </Animated.View>
      )}

      {/* Transactions list */}
      <FlatList
        data={isLoading ? [] : transactions}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.brand.primary} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.skeletons}>
              {[0, 1, 2, 3, 4].map((i) => <TransactionSkeleton key={i} />)}
            </View>
          ) : (
            <EmptyState
              icon="receipt-outline"
              title={search ? 'No results' : 'No transactions'}
              description={
                search
                  ? `No transactions matching "${search}"`
                  : 'Your transactions will appear here once you add them.'
              }
            />
          )
        }
        renderItem={({ item, index }) => (
          <TransactionRow
            transaction={item}
            index={index}
            onDelete={(id) => deleteTxn.mutate(id)}
            onEdit={handleEdit}
            selectionMode={selectionMode}
            isSelected={selectedIds.has(item.id)}
            onSelect={toggleSelect}
            onLongPress={enterSelectionMode}
          />
        )}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.skeletons}>
              {[0, 1].map((i) => <TransactionSkeleton key={i} />)}
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Add / Edit transaction sheet */}
      <AddTransactionSheet
        sheetRef={addSheetRef}
        editingTransaction={editingTxn}
        onDismiss={() => setEditingTxn(null)}
      />

      {/* Filter sheet */}
      <BottomSheet
        ref={filterSheetRef}
        index={-1}
        snapPoints={['75%']}
        enablePanDownToClose
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.sheetHandle}
      >
        <FilterSheetContent
          filters={pendingFilters}
          categories={categories}
          onChange={setPendingFilters}
          onApply={applyFilters}
          onReset={resetFilters}
        />
      </BottomSheet>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter sheet content
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_FILTERS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
  { label: 'Transfer', value: 'transfer' },
];

const DATE_PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'All time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'This month', value: 'this_month' },
  { label: 'Last month', value: 'last_month' },
  { label: 'Last 3 months', value: 'last_3_months' },
];

const SORT_OPTIONS: { label: string; sortBy: 'date' | 'amount'; sortOrder: 'asc' | 'desc' }[] = [
  { label: 'Date (newest)', sortBy: 'date', sortOrder: 'desc' },
  { label: 'Date (oldest)', sortBy: 'date', sortOrder: 'asc' },
  { label: 'Amount (high)', sortBy: 'amount', sortOrder: 'desc' },
  { label: 'Amount (low)', sortBy: 'amount', sortOrder: 'asc' },
];

interface FilterSheetContentProps {
  filters: ActiveFilters;
  categories: Category[];
  onChange: (f: ActiveFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

function FilterSheetContent({ filters, categories, onChange, onApply, onReset }: FilterSheetContentProps) {
  return (
    <BottomSheetScrollView contentContainerStyle={styles.filterContent} showsVerticalScrollIndicator={false}>
      <View style={styles.filterHeader}>
        <Text variant="headingMd">Filters</Text>
        <Pressable onPress={onReset}>
          <Text variant="labelMd" color="brand">Reset all</Text>
        </Pressable>
      </View>

      {/* Type */}
      <Text variant="labelMd" color="tertiary" style={styles.filterSectionTitle}>TYPE</Text>
      <View style={styles.filterRow}>
        {TYPE_FILTERS.map((item) => (
          <Pressable
            key={item.value}
            style={[styles.filterChip, filters.type === item.value && styles.filterChipActive]}
            onPress={() => onChange({ ...filters, type: item.value })}
          >
            <Text
              variant="labelMd"
              style={{ color: filters.type === item.value ? colors.brand.primary : colors.text.secondary, fontWeight: filters.type === item.value ? '700' : '400' }}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Date range */}
      <Text variant="labelMd" color="tertiary" style={styles.filterSectionTitle}>DATE RANGE</Text>
      <View style={styles.filterRow}>
        {DATE_PRESETS.map((item) => (
          <Pressable
            key={item.value}
            style={[styles.filterChip, filters.datePreset === item.value && styles.filterChipActive]}
            onPress={() => onChange({ ...filters, datePreset: item.value })}
          >
            <Text
              variant="labelMd"
              style={{ color: filters.datePreset === item.value ? colors.brand.primary : colors.text.secondary, fontWeight: filters.datePreset === item.value ? '700' : '400' }}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Category */}
      <Text variant="labelMd" color="tertiary" style={styles.filterSectionTitle}>CATEGORY</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        <Pressable
          style={[styles.filterChip, !filters.categoryId && styles.filterChipActive]}
          onPress={() => onChange({ ...filters, categoryId: undefined })}
        >
          <Text variant="labelMd" style={{ color: !filters.categoryId ? colors.brand.primary : colors.text.secondary, fontWeight: !filters.categoryId ? '700' : '400' }}>
            All
          </Text>
        </Pressable>
        {categories.map((cat) => (
          <Pressable
            key={cat.id}
            style={[styles.filterChip, filters.categoryId === cat.id && styles.filterChipActive]}
            onPress={() => onChange({ ...filters, categoryId: cat.id })}
          >
            <Text variant="labelMd" style={{ color: filters.categoryId === cat.id ? colors.brand.primary : colors.text.secondary, fontWeight: filters.categoryId === cat.id ? '700' : '400' }}>
              {cat.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Sort */}
      <Text variant="labelMd" color="tertiary" style={styles.filterSectionTitle}>SORT BY</Text>
      <View style={styles.filterRow}>
        {SORT_OPTIONS.map((item) => {
          const active = filters.sortBy === item.sortBy && filters.sortOrder === item.sortOrder;
          return (
            <Pressable
              key={item.label}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => onChange({ ...filters, sortBy: item.sortBy, sortOrder: item.sortOrder })}
            >
              <Text
                variant="labelMd"
                style={{ color: active ? colors.brand.primary : colors.text.secondary, fontWeight: active ? '700' : '400' }}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ height: spacing[4] }} />
      <Button label="Apply Filters" onPress={onApply} fullWidth size="lg" />
      <View style={{ height: spacing[8] }} />
    </BottomSheetScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface.secondary,
    borderWidth: 1,
    borderColor: colors.surface.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  deleteBtn: {
    backgroundColor: colors.expense,
    borderColor: colors.expense,
  },
  filterIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface.secondary,
    borderWidth: 1,
    borderColor: colors.surface.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrapper: {
    paddingHorizontal: spacing[5],
    marginBottom: spacing[3],
  },
  chips: {
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
  },
  chip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.secondary,
  },
  chipActive: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.light,
  },
  skeletons: {
    gap: spacing[1],
    marginTop: spacing[2],
  },
  listContent: {
    paddingBottom: spacing[20],
    gap: spacing[0.5],
  },
  // Sheet
  sheetBg: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
  },
  sheetHandle: {
    backgroundColor: colors.surface.border,
  },
  filterContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    gap: spacing[2],
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  filterSectionTitle: {
    letterSpacing: 0.8,
    marginTop: spacing[2],
    marginBottom: spacing[1],
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  filterChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.secondary,
  },
  filterChipActive: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.light,
  },
});
