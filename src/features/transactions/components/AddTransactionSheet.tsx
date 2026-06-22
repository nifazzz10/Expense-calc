import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import { colors, spacing, radius, typography } from '@/theme';
import { Text } from '@/shared/components/ui/Text';
import { Button } from '@/shared/components/ui/Button';
import { CategoryIcon } from '@/shared/components/ui/CategoryIcon';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { useCreateTransaction, useUpdateTransaction } from '../hooks/useTransactions';
import { ruleService } from '@/features/rules/hooks/useRuleService';
import { useRules } from '@/features/rules/hooks/useRules';
import type { Transaction, TransactionType, Category } from '@/types/database.types';
import { useSettingsStore } from '@/store/settingsStore';

interface AddTransactionSheetProps {
  sheetRef: React.RefObject<BottomSheet | null>;
  editingTransaction?: Transaction | null;
  onDismiss: () => void;
}

type TabType = 'expense' | 'income' | 'transfer' | 'investment';

const TAB_COLOR: Record<TabType, string> = {
  expense: colors.expense,
  income: colors.income,
  transfer: colors.transfer,
  investment: colors.investment,
};

// ─────────────────────────────────────────────────────────────────────────────
// Sheet
// ─────────────────────────────────────────────────────────────────────────────

export function AddTransactionSheet({
  sheetRef,
  editingTransaction,
  onDismiss,
}: AddTransactionSheetProps) {
  const { currencySymbol } = useSettingsStore();
  const snapPoints = useMemo(() => ['75%', '95%'], []);

  const [activeTab, setActiveTab] = useState<TabType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: categories = [] } = useCategories();
  const { data: rules = [] } = useRules();
  const createTxn = useCreateTransaction();
  const updateTxn = useUpdateTransaction();

  const isEditing = !!editingTransaction;

  useEffect(() => {
    if (editingTransaction) {
      setActiveTab(editingTransaction.transaction_type as TabType);
      setAmount(String(editingTransaction.amount));
      setDescription(editingTransaction.description);
      setNotes(editingTransaction.notes ?? '');
      setSelectedCategoryId(editingTransaction.category_id);
      setDate(editingTransaction.transaction_date);
    }
  }, [editingTransaction]);

  useEffect(() => {
    if (isEditing || description.length <= 2 || rules.length === 0) return;
    const matched = ruleService.applyRules(description, rules);
    if (!matched) return;
    // Only apply if the matched category belongs to the current tab type
    const matchedCat = categories.find((c) => c.id === matched);
    if (matchedCat && (matchedCat.type === activeTab || matchedCat.type === 'all')) {
      setSelectedCategoryId(matched);
    }
  }, [description, rules, isEditing, activeTab, categories]);

  const filteredCategories = categories.filter(
    (c) => c.type === activeTab || c.type === 'all',
  );

  const reset = useCallback(() => {
    setActiveTab('expense');
    setAmount('');
    setDescription('');
    setNotes('');
    setSelectedCategoryId(null);
    setDate(format(new Date(), 'yyyy-MM-dd'));
  }, []);

  const handleSave = async () => {
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
      return;
    }
    try {
      const payload = {
        amount: numAmount,
        description: description.trim() || 'No description',
        notes: notes.trim() || null,
        transaction_type: activeTab as TransactionType,
        transaction_date: date,
        category_id: selectedCategoryId,
        fingerprint: null,
        source: 'manual' as const,
      };
      if (isEditing && editingTransaction) {
        await updateTxn.mutateAsync({ id: editingTransaction.id, payload });
      } else {
        await createTxn.mutateAsync(payload);
      }
      reset();
      onDismiss();
      sheetRef.current?.close();
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save transaction');
    }
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={() => { reset(); onDismiss(); }}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headingSm">
            {isEditing ? 'Edit Transaction' : 'Add Transaction'}
          </Text>
          <Pressable onPress={() => sheetRef.current?.close()} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.text.secondary} />
          </Pressable>
        </View>

        {/* Type tabs */}
        <View style={styles.tabs}>
          {(['expense', 'income', 'transfer', 'investment'] as TabType[]).map((tab) => (
            <Pressable
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && {
                  backgroundColor: `${TAB_COLOR[tab]}22`,
                  borderColor: TAB_COLOR[tab],
                },
              ]}
              onPress={() => {
                setActiveTab(tab);
                setSelectedCategoryId(null);
                Haptics.selectionAsync();
              }}
            >
              <Text
                variant="labelMd"
                style={{
                  color: activeTab === tab ? TAB_COLOR[tab] : colors.text.tertiary,
                  fontWeight: activeTab === tab ? '700' : '500',
                  textTransform: 'capitalize',
                }}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Amount */}
        <View style={styles.amountContainer}>
          <Text variant="headingMd" style={{ color: TAB_COLOR[activeTab] }}>
            {currencySymbol}
          </Text>
          <BottomSheetTextInput
            style={[styles.amountInput, { color: TAB_COLOR[activeTab] }]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.text.tertiary}
            selectionColor={TAB_COLOR[activeTab]}
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text variant="labelLg" color="secondary">Description</Text>
          <BottomSheetTextInput
            style={styles.textInput}
            value={description}
            onChangeText={setDescription}
            placeholder="What was this for?"
            placeholderTextColor={colors.text.tertiary}
            selectionColor={colors.brand.primary}
            returnKeyType="next"
          />
        </View>

        {/* Date — inline calendar picker */}
        <View style={styles.field}>
          <Text variant="labelLg" color="secondary">Date</Text>
          <DatePickerField value={date} onChange={setDate} />
        </View>

        {/* Categories */}
        <View style={styles.field}>
          <Text variant="labelLg" color="secondary">Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            {filteredCategories.map((cat) => (
              <CategoryChip
                key={cat.id}
                category={cat}
                selected={selectedCategoryId === cat.id}
                onPress={() => {
                  setSelectedCategoryId(cat.id === selectedCategoryId ? null : cat.id);
                  Haptics.selectionAsync();
                }}
              />
            ))}
          </ScrollView>
        </View>

        {/* Notes */}
        <View style={styles.field}>
          <Text variant="labelLg" color="secondary">Notes (optional)</Text>
          <BottomSheetTextInput
            style={[styles.textInput, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes..."
            placeholderTextColor={colors.text.tertiary}
            selectionColor={colors.brand.primary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <Button
          label={isEditing ? 'Update Transaction' : 'Save Transaction'}
          onPress={handleSave}
          loading={createTxn.isPending || updateTxn.isPending}
          fullWidth
          size="lg"
        />
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline calendar date picker
// ─────────────────────────────────────────────────────────────────────────────

const WEEK_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

interface DatePickerFieldProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

function DatePickerField({ value, onChange }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);

  // Parse safely — force noon to avoid timezone day-shift
  const selected = useMemo(() => new Date(`${value}T12:00:00`), [value]);

  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  // Reopen to the right month when value changes externally
  useEffect(() => {
    setViewYear(selected.getFullYear());
    setViewMonth(selected.getMonth());
  }, [value]);

  const monthLabel = format(new Date(viewYear, viewMonth, 1), 'MMMM yyyy');

  const { startOffset, daysInMonth } = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    return {
      startOffset: (firstDay + 6) % 7, // shift so Mon=0
      daysInMonth: new Date(viewYear, viewMonth + 1, 0).getDate(),
    };
  }, [viewYear, viewMonth]);

  const today = useMemo(() => {
    const t = new Date();
    return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() };
  }, []);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const handleDay = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    onChange(format(d, 'yyyy-MM-dd'));
    setOpen(false);
    Haptics.selectionAsync();
  };

  return (
    <View>
      {/* Trigger */}
      <Pressable
        style={styles.dateTrigger}
        onPress={() => setOpen((o) => !o)}
      >
        <Ionicons name="calendar-outline" size={18} color={colors.brand.primary} />
        <Text variant="bodyLg" style={styles.dateTriggerText}>
          {format(selected, 'dd MMM yyyy')}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.text.tertiary}
        />
      </Pressable>

      {/* Calendar */}
      {open && (
        <View style={styles.calendar}>
          {/* Month nav */}
          <View style={styles.calNav}>
            <Pressable onPress={prevMonth} hitSlop={10} style={styles.calNavBtn}>
              <Ionicons name="chevron-back" size={20} color={colors.text.primary} />
            </Pressable>
            <Text variant="labelLg" style={{ fontWeight: '700' }}>{monthLabel}</Text>
            <Pressable onPress={nextMonth} hitSlop={10} style={styles.calNavBtn}>
              <Ionicons name="chevron-forward" size={20} color={colors.text.primary} />
            </Pressable>
          </View>

          {/* Weekday headers */}
          <View style={styles.calWeekRow}>
            {WEEK_DAYS.map((d) => (
              <Text key={d} variant="labelSm" color="tertiary" style={styles.calWeekDay}>
                {d}
              </Text>
            ))}
          </View>

          {/* Day cells */}
          <View style={styles.calGrid}>
            {/* Empty cells before first day */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <View key={`e${i}`} style={styles.calCell} />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const isSelected =
                day === selected.getDate() &&
                viewMonth === selected.getMonth() &&
                viewYear === selected.getFullYear();
              const isToday =
                day === today.d &&
                viewMonth === today.m &&
                viewYear === today.y;

              return (
                <Pressable
                  key={day}
                  style={[
                    styles.calCell,
                    isSelected && styles.calCellSelected,
                    !isSelected && isToday && styles.calCellToday,
                  ]}
                  onPress={() => handleDay(day)}
                >
                  <Text
                    variant="labelMd"
                    style={{
                      color: isSelected
                        ? colors.white
                        : isToday
                        ? colors.brand.primary
                        : colors.text.primary,
                      fontWeight: isSelected || isToday ? '700' : '400',
                    }}
                  >
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Category chip
// ─────────────────────────────────────────────────────────────────────────────

function CategoryChip({
  category,
  selected,
  onPress,
}: {
  category: Category;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        chipStyles.container,
        selected && { borderColor: category.color, backgroundColor: `${category.color}18` },
      ]}
    >
      <CategoryIcon icon={category.icon} color={category.color} size="sm" />
      <Text
        variant="labelSm"
        style={{ color: selected ? category.color : colors.text.secondary }}
      >
        {category.name}
      </Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
  },
  handle: {
    backgroundColor: colors.surface.border,
    width: 40,
  },
  content: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[10],
    gap: spacing[5],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing[2],
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.surface.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
  },
  amountInput: {
    ...typography.display.lg,
    fontWeight: '700',
    letterSpacing: -2,
    minWidth: 100,
    textAlign: 'center',
  },
  field: {
    gap: spacing[2],
  },
  textInput: {
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    ...typography.body.lg,
    color: colors.text.primary,
  },
  notesInput: {
    height: 80,
    paddingTop: spacing[3],
  },
  categoryList: {
    gap: spacing[2],
    paddingVertical: spacing[0.5],
  },
  // Date picker
  dateTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  dateTriggerText: {
    flex: 1,
    color: colors.text.primary,
  },
  calendar: {
    marginTop: spacing[2],
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.surface.border,
    padding: spacing[3],
    gap: spacing[2],
  },
  calNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[1],
    marginBottom: spacing[1],
  },
  calNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calWeekRow: {
    flexDirection: 'row',
  },
  calWeekDay: {
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  calCellSelected: {
    backgroundColor: colors.brand.primary,
  },
  calCellToday: {
    borderWidth: 1.5,
    borderColor: colors.brand.primary,
  },
});

const chipStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.secondary,
  },
});
