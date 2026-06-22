import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  ScrollView,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Animated, {
  FadeInDown,
  ZoomIn,
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius } from '@/theme';
import { Screen } from '@/shared/components/layout/Screen';
import { Header } from '@/shared/components/layout/Header';
import { Text } from '@/shared/components/ui/Text';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { CategoryIcon } from '@/shared/components/ui/CategoryIcon';
import { useAuthStore } from '@/store/authStore';
import { useRules, useCreateRule } from '@/features/rules/hooks/useRules';
import { ruleService } from '@/features/rules/hooks/useRuleService';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { usePdfImport } from '@/features/pdf-import/hooks/usePdfImport';
import { useSettingsStore } from '@/store/settingsStore';
import { formatCurrency, formatTransactionDate } from '@/shared/utils/format';
import type { Category, ParsedTransaction } from '@/types/database.types';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';

export default function ImportScreen() {
  const user = useAuthStore((s) => s.user);
  const { currencySymbol } = useSettingsStore();
  const { data: rules = [] } = useRules();
  const { data: categoriesArr = [] } = useCategories();
  const queryClient = useQueryClient();
  const { mutateAsync: createRule } = useCreateRule();

  const { state, pickAndParse, confirmImport, reset } = usePdfImport(user!.id, rules);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [categoryOverrides, setCategoryOverrides] = useState<Map<number, string | null>>(new Map());
  const [pickerOpen, setPickerOpen] = useState<number | null>(null);
  const [ruleSaved, setRuleSaved] = useState<string | null>(null);
  const [batchSuggest, setBatchSuggest] = useState<{
    keyword: string;
    categoryId: string;
    indices: number[];
  } | null>(null);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const cat of categoriesArr) map.set(cat.id, cat);
    return map;
  }, [categoriesArr]);

  const getCategory = useCallback((index: number, item: ParsedTransaction): Category | null => {
    if (categoryOverrides.has(index)) {
      const id = categoryOverrides.get(index);
      return id ? (categoryMap.get(id) ?? null) : null;
    }
    return item.suggested_category_id ? (categoryMap.get(item.suggested_category_id) ?? null) : null;
  }, [categoryOverrides, categoryMap]);

  const handleConfirm = async () => {
    if (!state.preview) return;
    const transactions = state.preview.toImport
      .filter((_, i) => selected.has(i))
      .map((t) => {
        const realIndex = state.preview!.toImport.indexOf(t);
        if (categoryOverrides.has(realIndex)) {
          return { ...t, suggested_category_id: categoryOverrides.get(realIndex) ?? null };
        }
        return t;
      });
    await confirmImport(transactions);
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
  };

  useEffect(() => {
    if (state.preview) {
      setSelected(new Set(state.preview.toImport.map((_, i) => i)));
      setCategoryOverrides(new Map());
    }
  }, [state.preview]);

  const toggleSelect = (i: number) => {
    const s = new Set(selected);
    s.has(i) ? s.delete(i) : s.add(i);
    setSelected(s);
  };

  const setCategory = useCallback((index: number, categoryId: string | null, currentOverrides: Map<number, string | null>) => {
    setCategoryOverrides((prev) => new Map(prev).set(index, categoryId));
    setPickerOpen(null);

    if (categoryId && state.preview) {
      const txn = state.preview.toImport[index];
      const keyword = ruleService.suggestKeyword(txn.description);

      // Scan current batch for similar uncategorized transactions
      const otherItems = state.preview.toImport
        .map((t, i) => ({ desc: t.description, origIndex: i }))
        .filter(({ origIndex }) => origIndex !== index && !currentOverrides.has(origIndex));

      if (otherItems.length > 0) {
        const matchPositions = ruleService.findSimilarInBatch(
          txn.description,
          otherItems.map(({ desc }) => desc),
        );
        const similarIndices = matchPositions.map((pos) => otherItems[pos].origIndex);
        if (similarIndices.length > 0) {
          // Delay so the category picker modal finishes its slide-out animation first
          setTimeout(() => setBatchSuggest({ keyword, categoryId, indices: similarIndices }), 350);
        }
      }

      // Auto-save rule for future imports
      if (keyword && keyword.length >= 2) {
        const alreadyExists = rules.some(
          (r) => r.keyword.toLowerCase() === keyword.toLowerCase(),
        );
        if (!alreadyExists) {
          createRule({ keyword, category_id: categoryId, enabled: true, priority: 5 })
            .then(() => {
              const cat = categoryMap.get(categoryId);
              const msg = cat
                ? `Rule saved: "${keyword}" → ${cat.name}`
                : `Rule saved for "${keyword}"`;
              setRuleSaved(msg);
              setTimeout(() => setRuleSaved(null), 2500);
            })
            .catch(() => {/* silent */});
        }
      }
    }
  }, [state.preview, rules, categoryMap, createRule]);

  const applyCategoryToSimilar = useCallback(() => {
    if (!batchSuggest) return;
    setCategoryOverrides((prev) => {
      const next = new Map(prev);
      for (const i of batchSuggest.indices) next.set(i, batchSuggest.categoryId);
      return next;
    });
    const cat = categoryMap.get(batchSuggest.categoryId);
    const count = batchSuggest.indices.length;
    setBatchSuggest(null);
    setRuleSaved(`Applied ${cat?.name ?? 'category'} to ${count} transaction${count !== 1 ? 's' : ''}`);
    setTimeout(() => setRuleSaved(null), 2500);
  }, [batchSuggest, categoryMap]);

  // ── Done ──────────────────────────────────────────────────────────────────

  if (state.step === 'done' && state.result) {
    return (
      <Screen safeArea scroll>
        <Header title="Import Complete" back />
        <Animated.View entering={ZoomIn.duration(400)} style={styles.resultContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={72} color={colors.success} />
          </View>
          <Text variant="headingMd">Import Successful!</Text>
          <View style={styles.resultStats}>
            <View style={styles.resultStat}>
              <Text variant="displayMd" style={{ color: colors.income }}>
                {state.result.imported}
              </Text>
              <Text variant="bodyMd" color="secondary">Imported</Text>
            </View>
            <View style={styles.resultDivider} />
            <View style={styles.resultStat}>
              <Text variant="displayMd" style={{ color: colors.expense }}>
                {state.result.skipped}
              </Text>
              <Text variant="bodyMd" color="secondary">Skipped (duplicates)</Text>
            </View>
          </View>

          <Button label="Done" onPress={reset} fullWidth size="lg" />
        </Animated.View>
      </Screen>
    );
  }

  // ── Preview ───────────────────────────────────────────────────────────────

  if (state.step === 'preview' && state.preview) {
    const { toImport, duplicates, bankName, openingBalance, closingBalance, parsed } = state.preview;
    const selectedCount = selected.size;

    return (
      <Screen safeArea padding={false} scroll={false}>
        <Header title="Review Transactions" back />

        <View style={styles.previewHeader}>
          {bankName && bankName !== 'Generic' && (
            <View style={styles.bankBadge}>
              <Ionicons name="business-outline" size={14} color={colors.brand.primary} />
              <Text variant="labelSm" color="brand">{bankName}</Text>
            </View>
          )}
          <View style={styles.previewStats}>
            <Text variant="labelMd" color="secondary">
              Found{' '}
              <Text variant="labelMd" style={{ color: colors.text.primary }}>
                {toImport.length}
              </Text>{' '}
              new transactions
            </Text>
            {duplicates.length > 0 && (
              <Text variant="labelMd" color="secondary">
                {' · '}
                <Text variant="labelMd" style={{ color: colors.expense }}>
                  {duplicates.length}
                </Text>{' '}
                duplicates skipped
              </Text>
            )}
          </View>
          <View style={styles.selectActions}>
            <Pressable onPress={() => setSelected(new Set(toImport.map((_, i) => i)))}>
              <Text variant="labelMd" color="brand">Select all</Text>
            </Pressable>
            <Text variant="labelMd" color="tertiary"> / </Text>
            <Pressable onPress={() => setSelected(new Set())}>
              <Text variant="labelMd" color="secondary">Deselect all</Text>
            </Pressable>
          </View>
          <View style={styles.swipeHint}>
            <Ionicons name="swap-horizontal-outline" size={13} color={colors.text.disabled} />
            <Text variant="labelSm" color="disabled"> Swipe right to change category</Text>
          </View>
        </View>

        <FlatList
          data={toImport}
          keyExtractor={(_, i) => String(i)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.previewList}
          renderItem={({ item, index }) => (
            <PreviewRow
              item={item}
              index={index}
              selected={selected.has(index)}
              onToggle={toggleSelect}
              category={getCategory(index, item)}
              isOverridden={categoryOverrides.has(index)}
              onCategoryPress={() => setPickerOpen(index)}
              currencySymbol={currencySymbol}
            />
          )}
          ListHeaderComponent={
            openingBalance != null ? (
              <BalanceReconciliationCard
                openingBalance={openingBalance}
                closingBalance={closingBalance}
                parsed={parsed}
                currencySymbol={currencySymbol}
              />
            ) : null
          }
          ListFooterComponent={<View style={{ height: 120 }} />}
        />

        {/* Rule-saved toast */}
        {ruleSaved && (
          <Animated.View
            entering={FadeIn.duration(250)}
            exiting={FadeOut.duration(300)}
            style={styles.ruleSavedToast}
          >
            <Ionicons name="color-wand" size={14} color={colors.brand.primary} />
            <Text variant="labelSm" style={{ color: colors.text.primary }}>{ruleSaved}</Text>
          </Animated.View>
        )}

        <View style={styles.previewFooter}>
          <Button
            label={`Import ${selectedCount} Transaction${selectedCount !== 1 ? 's' : ''}`}
            onPress={handleConfirm}
            loading={state.step === ('importing' as ImportStep)}
            fullWidth
            size="lg"
            disabled={selectedCount === 0}
          />
        </View>

        {/* Batch-suggest modal — slides up after category picker closes */}
        <Modal
          visible={batchSuggest !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setBatchSuggest(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setBatchSuggest(null)}>
            <Pressable style={styles.pickerSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.pickerHandle} />

              {/* Header */}
              <View style={styles.batchModalHeader}>
                <View style={styles.batchModalIconWrap}>
                  <Ionicons name="sparkles" size={22} color={colors.brand.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="headingXs">Same merchant detected</Text>
                  <Text variant="labelSm" color="secondary">
                    Found {batchSuggest?.indices.length} more "{batchSuggest?.keyword}"
                  </Text>
                </View>
              </View>

              {/* Apply-to-all question */}
              <View style={styles.batchCategoryRow}>
                <Text variant="bodyMd" color="secondary">Make them all </Text>
                {batchSuggest && categoryMap.get(batchSuggest.categoryId) && (
                  <>
                    <CategoryIcon
                      icon={categoryMap.get(batchSuggest.categoryId)!.icon}
                      color={categoryMap.get(batchSuggest.categoryId)!.color}
                      size="sm"
                    />
                    <Text variant="bodyMd" style={{ fontWeight: '700', marginLeft: spacing[1] }}>
                      {categoryMap.get(batchSuggest.categoryId)!.name}
                    </Text>
                  </>
                )}
                <Text variant="bodyMd" color="secondary">?</Text>
              </View>

              {/* Sample rows */}
              <View style={styles.batchSampleList}>
                {batchSuggest?.indices.slice(0, 4).map((i) => (
                  <View key={i} style={styles.batchSampleRow}>
                    <View style={styles.batchSampleDot} />
                    <Text variant="labelSm" color="secondary" numberOfLines={1} style={{ flex: 1 }}>
                      {toImport[i]?.description}
                    </Text>
                    <Text
                      variant="labelSm"
                      style={{
                        color: toImport[i]?.transaction_type === 'income' ? colors.income : colors.expense,
                        fontWeight: '600',
                        marginLeft: spacing[2],
                      }}
                    >
                      {toImport[i]?.transaction_type === 'income' ? '+' : '-'}
                      {formatCurrency(toImport[i]?.amount ?? 0, currencySymbol)}
                    </Text>
                  </View>
                ))}
                {(batchSuggest?.indices.length ?? 0) > 4 && (
                  <Text variant="labelSm" color="disabled">
                    +{batchSuggest!.indices.length - 4} more
                  </Text>
                )}
              </View>

              {/* Actions */}
              <View style={styles.batchModalActions}>
                <Pressable style={styles.batchApplyBtn} onPress={applyCategoryToSimilar}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.white} />
                  <Text variant="labelMd" style={{ color: colors.white, fontWeight: '700' }}>
                    Yes, apply to all {batchSuggest?.indices.length}
                  </Text>
                </Pressable>
                <Pressable style={styles.batchSkipBtn} onPress={() => setBatchSuggest(null)}>
                  <Text variant="labelMd" color="secondary">No, skip</Text>
                </Pressable>
              </View>
              <View style={{ height: spacing[4] }} />
            </Pressable>
          </Pressable>
        </Modal>

        {/* Category picker modal */}
        <Modal
          visible={pickerOpen !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setPickerOpen(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setPickerOpen(null)}>
            <Pressable style={styles.pickerSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.pickerHandle} />

              {/* Transaction info header */}
              {pickerOpen !== null && (
                <View style={styles.pickerTxnHeader}>
                  <View style={styles.pickerTxnMeta}>
                    <Text
                      variant="bodySm"
                      numberOfLines={2}
                      style={{ fontWeight: '600', flex: 1, marginRight: spacing[3] }}
                    >
                      {toImport[pickerOpen]?.description}
                    </Text>
                    <Text
                      variant="headingXs"
                      style={{
                        color:
                          toImport[pickerOpen]?.transaction_type === 'income'
                            ? colors.income
                            : colors.expense,
                        flexShrink: 0,
                      }}
                    >
                      {toImport[pickerOpen]?.transaction_type === 'income' ? '+' : '-'}
                      {formatCurrency(toImport[pickerOpen]?.amount ?? 0, currencySymbol)}
                    </Text>
                  </View>
                  {getCategory(pickerOpen, toImport[pickerOpen]) && (
                    <View style={styles.pickerCurrentCat}>
                      <CategoryIcon
                        icon={getCategory(pickerOpen, toImport[pickerOpen])!.icon}
                        color={getCategory(pickerOpen, toImport[pickerOpen])!.color}
                        size="sm"
                      />
                      <Text variant="labelSm" color="secondary">
                        {getCategory(pickerOpen, toImport[pickerOpen])!.name}
                      </Text>
                      <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                    </View>
                  )}
                  <View style={styles.pickerDivider} />
                </View>
              )}

              <Text variant="headingXs" style={{ marginBottom: spacing[3] }}>Choose Category</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Uncategorized */}
                <Pressable
                  style={styles.pickerRow}
                  onPress={() => setCategory(pickerOpen!, null, categoryOverrides)}
                >
                  <View style={[styles.pickerIconWrap, { backgroundColor: colors.surface.tertiary }]}>
                    <Ionicons name="help-circle-outline" size={20} color={colors.text.tertiary} />
                  </View>
                  <Text variant="bodyMd" color="secondary">Uncategorized</Text>
                  {pickerOpen !== null && !getCategory(pickerOpen, toImport[pickerOpen]) && (
                    <Ionicons name="checkmark" size={18} color={colors.brand.primary} style={{ marginLeft: 'auto' }} />
                  )}
                </Pressable>

                {/* All categories */}
                {categoriesArr.map((cat) => (
                  <Pressable
                    key={cat.id}
                    style={[
                      styles.pickerRow,
                      pickerOpen !== null &&
                        getCategory(pickerOpen, toImport[pickerOpen])?.id === cat.id &&
                        styles.pickerRowActive,
                    ]}
                    onPress={() => setCategory(pickerOpen!, cat.id, categoryOverrides)}
                  >
                    <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                    <Text variant="bodyMd">{cat.name}</Text>
                    {pickerOpen !== null &&
                      getCategory(pickerOpen, toImport[pickerOpen])?.id === cat.id && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={colors.brand.primary}
                          style={{ marginLeft: 'auto' }}
                        />
                      )}
                  </Pressable>
                ))}
                <View style={{ height: 32 }} />
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </Screen>
    );
  }

  // ── Upload screen ─────────────────────────────────────────────────────────

  return (
    <Screen safeArea scroll>
      <Header title="Import Bank Statement" back />

      <View style={styles.content}>
        {state.step === 'error' && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Card padding={spacing[4]} style={styles.errorCard}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text variant="bodyMd" style={{ color: colors.error, flex: 1 }}>
                {state.error}
              </Text>
            </Card>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(50).duration(500)}>
          <Pressable
            style={styles.uploadArea}
            onPress={pickAndParse}
            disabled={['picking', 'parsing'].includes(state.step)}
          >
            <LinearGradient
              colors={['rgba(124,111,247,0.12)', 'rgba(124,111,247,0.04)']}
              style={styles.uploadGradient}
            >
              {['picking', 'parsing'].includes(state.step) ? (
                <ParseLoader step={state.step as 'picking' | 'parsing'} />
              ) : (
                <>
                  <View style={styles.uploadIcon}>
                    <Ionicons name="cloud-upload-outline" size={40} color={colors.brand.primary} />
                  </View>
                  <Text variant="headingXs" style={{ textAlign: 'center' }}>
                    Upload Bank Statement
                  </Text>
                  <Text variant="bodyMd" color="secondary" style={{ textAlign: 'center' }}>
                    Select a PDF bank statement to import transactions
                  </Text>
                  <View style={styles.uploadBtn}>
                    <Text variant="labelMd" color="brand">Choose PDF file</Text>
                  </View>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <Text variant="labelMd" color="tertiary" style={styles.sectionTitle}>
            SUPPORTED BANKS
          </Text>
          <View style={styles.banksList}>
            {['Kotak Mahindra Bank', 'HDFC Bank', 'SBI', 'ICICI Bank', 'Axis Bank', 'Other (Generic)'].map(
              (b) => (
                <View key={b} style={styles.bankChip}>
                  <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
                  <Text variant="labelSm" color="secondary">{b}</Text>
                </View>
              ),
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Text variant="labelMd" color="tertiary" style={styles.sectionTitle}>
            HOW IT WORKS
          </Text>
          <Card padding={spacing[4]}>
            {[
              { step: '1', label: 'Upload PDF', desc: 'Select your bank statement PDF' },
              { step: '2', label: 'Auto-parse', desc: 'We extract all transactions' },
              { step: '3', label: 'Apply Rules', desc: 'Auto-categorization via your rules' },
              { step: '4', label: 'Review & Confirm', desc: "Uncheck anything you don't want, then import" },
            ].map((item) => (
              <View key={item.step} style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text variant="labelSm" style={{ color: colors.brand.primary, fontWeight: '700' }}>
                    {item.step}
                  </Text>
                </View>
                <View style={styles.stepInfo}>
                  <Text variant="bodyMd" style={{ fontWeight: '500' }}>{item.label}</Text>
                  <Text variant="labelSm" color="secondary">{item.desc}</Text>
                </View>
              </View>
            ))}
          </Card>
        </Animated.View>
      </View>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BalanceReconciliationCard — shows opening → closing balance summary
// ─────────────────────────────────────────────────────────────────────────────

interface BalanceReconciliationCardProps {
  openingBalance: number;
  closingBalance: number | null;
  parsed: ParsedTransaction[];
  currencySymbol: string;
}

function BalanceReconciliationCard({
  openingBalance,
  closingBalance,
  parsed,
  currencySymbol,
}: BalanceReconciliationCardProps) {
  const credits = parsed
    .filter((t) => t.transaction_type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const debits = parsed
    .filter((t) => t.transaction_type !== 'income')
    .reduce((s, t) => s + t.amount, 0);
  const computed = openingBalance + credits - debits;
  const bankClosing = closingBalance ?? computed;
  const matched = Math.abs(computed - bankClosing) < 1;

  return (
    <View style={styles.reconCard}>
      <View style={styles.reconHeader}>
        <Ionicons name="bar-chart-outline" size={14} color={colors.brand.primary} />
        <Text variant="labelSm" color="brand">Statement Reconciliation</Text>
        {closingBalance != null && (
          <View style={[styles.reconBadge, { backgroundColor: matched ? colors.success + '22' : colors.warning + '22' }]}>
            <Ionicons
              name={matched ? 'checkmark-circle' : 'warning'}
              size={12}
              color={matched ? colors.success : colors.warning}
            />
            <Text variant="labelSm" style={{ color: matched ? colors.success : colors.warning }}>
              {matched ? 'Balanced' : 'Mismatch'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.reconRow}>
        <View style={styles.reconStat}>
          <Text variant="labelSm" color="secondary">Opening</Text>
          <Text variant="bodySm" style={{ fontWeight: '700' }}>
            {formatCurrency(openingBalance, currencySymbol)}
          </Text>
        </View>
        <Ionicons name="add" size={14} color={colors.text.disabled} />
        <View style={styles.reconStat}>
          <Text variant="labelSm" color="secondary">Credits</Text>
          <Text variant="bodySm" style={{ color: colors.income, fontWeight: '700' }}>
            +{formatCurrency(credits, currencySymbol)}
          </Text>
        </View>
        <Ionicons name="remove" size={14} color={colors.text.disabled} />
        <View style={styles.reconStat}>
          <Text variant="labelSm" color="secondary">Debits</Text>
          <Text variant="bodySm" style={{ color: colors.expense, fontWeight: '700' }}>
            -{formatCurrency(debits, currencySymbol)}
          </Text>
        </View>
        <View style={styles.reconEquals}>
          <Text variant="labelSm" color="disabled">=</Text>
        </View>
        <View style={styles.reconStat}>
          <Text variant="labelSm" color="secondary">Closing</Text>
          <Text variant="bodySm" style={{ fontWeight: '700' }}>
            {formatCurrency(bankClosing, currencySymbol)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PreviewRow — swipe right to categorize, checkbox to select
// ─────────────────────────────────────────────────────────────────────────────

type ImportStep = 'idle' | 'picking' | 'parsing' | 'preview' | 'importing' | 'done' | 'error';

interface PreviewRowProps {
  item: ParsedTransaction;
  index: number;
  selected: boolean;
  onToggle: (i: number) => void;
  onCategoryPress: () => void;
  category: Category | null;
  isOverridden: boolean;
  currencySymbol: string;
}

function PreviewRow({
  item,
  index,
  selected,
  onToggle,
  onCategoryPress,
  category,
  isOverridden,
  currencySymbol,
}: PreviewRowProps) {
  const swipeRef = useRef<Swipeable>(null);

  const handleCategoryPress = useCallback(() => {
    swipeRef.current?.close();
    onCategoryPress();
  }, [onCategoryPress]);

  const renderLeftActions = useCallback(() => (
    <Pressable style={styles.swipeAction} onPress={handleCategoryPress}>
      {category ? (
        <CategoryIcon icon={category.icon} color={category.color} size="sm" />
      ) : (
        <View style={styles.swipeActionIcon}>
          <Ionicons name="pricetag-outline" size={18} color={colors.white} />
        </View>
      )}
      <Text variant="labelSm" style={{ color: colors.white, marginTop: 4 }} numberOfLines={1}>
        {category ? category.name : 'Categorize'}
      </Text>
    </Pressable>
  ), [category, handleCategoryPress]);

  return (
    <Swipeable
      ref={swipeRef}
      renderLeftActions={renderLeftActions}
      overshootLeft={false}
      friction={2}
      leftThreshold={40}
    >
      <View style={[styles.previewRow, !selected && styles.previewRowDeselected]}>
        {/* Checkbox — toggles selection */}
        <Pressable onPress={() => onToggle(index)} hitSlop={8}>
          <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
            {selected && <Ionicons name="checkmark" size={14} color={colors.white} />}
          </View>
        </Pressable>

        {/* Category icon — also opens picker on tap */}
        <Pressable onPress={handleCategoryPress} style={styles.categoryTap} hitSlop={8}>
          {category ? (
            <CategoryIcon icon={category.icon} color={category.color} size="sm" />
          ) : (
            <View style={styles.noCategory}>
              <Ionicons name="help-circle-outline" size={18} color={colors.text.tertiary} />
            </View>
          )}
          <View style={[styles.editBadge, isOverridden && styles.editBadgeActive]}>
            <Ionicons name="pencil" size={8} color={isOverridden ? colors.white : colors.text.disabled} />
          </View>
        </Pressable>

        {/* Description + date + category name */}
        <View style={styles.previewInfo}>
          <Text variant="bodySm" numberOfLines={1} style={{ fontWeight: '500' }}>
            {item.description}
          </Text>
          <View style={styles.metaRow}>
            <Text variant="labelSm" color="tertiary">
              {formatTransactionDate(item.date)}
            </Text>
            <Text variant="labelSm" color="tertiary"> · </Text>
            <Text
              variant="labelSm"
              numberOfLines={1}
              style={{
                color: isOverridden
                  ? colors.brand.secondary
                  : category
                  ? colors.text.tertiary
                  : colors.text.disabled,
              }}
            >
              {category ? category.name : '← swipe'}
            </Text>
          </View>
        </View>

        {/* Amount */}
        <Text
          variant="bodySm"
          style={{
            fontWeight: '700',
            color: item.transaction_type === 'income' ? colors.income : colors.expense,
          }}
        >
          {item.transaction_type === 'income' ? '+' : '-'}
          {formatCurrency(item.amount, currencySymbol)}
        </Text>
      </View>
    </Swipeable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ParseLoader
// ─────────────────────────────────────────────────────────────────────────────

const PARSE_STEPS: { label: string; icon: string }[] = [
  { label: 'Reading PDF file',      icon: 'document-text-outline' },
  { label: 'Decompressing streams', icon: 'layers-outline' },
  { label: 'Extracting text',       icon: 'text-outline' },
  { label: 'Detecting bank format', icon: 'business-outline' },
  { label: 'Parsing transactions',  icon: 'swap-horizontal-outline' },
  { label: 'Applying your rules',   icon: 'color-wand-outline' },
];

function ParseLoader({ step }: { step: 'picking' | 'parsing' }) {
  const [activeStep, setActiveStep] = useState(0);
  const rotation = useSharedValue(0);
  const glowPulse = useSharedValue(0.5);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1400, easing: Easing.linear }),
      -1, false,
    );
    glowPulse.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1, true,
    );
  }, []);

  useEffect(() => {
    if (step !== 'parsing') {
      progressWidth.value = withTiming(0);
      setActiveStep(0);
      return;
    }
    let current = 0;
    const advance = () => {
      current = Math.min(current + 1, PARSE_STEPS.length - 1);
      setActiveStep(current);
      progressWidth.value = withTiming((current + 1) / PARSE_STEPS.length, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      });
    };
    const id = setInterval(advance, 800);
    return () => clearInterval(id);
  }, [step]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0.5, 1], [0.3, 0.8]),
    transform: [{ scale: interpolate(glowPulse.value, [0.5, 1], [0.9, 1.1]) }],
  }));
  const barStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%` as any,
  }));

  const currentIcon = step === 'picking' ? 'document-outline' : PARSE_STEPS[activeStep].icon;

  return (
    <View style={styles.loaderWrap}>
      <View style={styles.loaderIconWrap}>
        <Animated.View style={[styles.loaderGlow, glowStyle]} />
        <Animated.View style={[styles.loaderRing, spinStyle]} />
        <View style={styles.loaderIconInner}>
          <Ionicons name={currentIcon as any} size={32} color={colors.brand.primary} />
        </View>
      </View>

      <Text variant="headingXs" style={{ color: colors.brand.secondary, textAlign: 'center' }}>
        {step === 'picking' ? 'Opening file picker...' : PARSE_STEPS[activeStep].label}
      </Text>

      {step === 'parsing' && (
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, barStyle]} />
        </View>
      )}

      {step === 'parsing' && (
        <View style={styles.stepList}>
          {PARSE_STEPS.map((s, i) => {
            const done = i < activeStep;
            const active = i === activeStep;
            return (
              <Animated.View
                key={s.label}
                style={[styles.stepItem, active && styles.stepItemActive]}
                entering={FadeInDown.delay(i * 60).duration(300)}
              >
                <View style={[
                  styles.stepDot,
                  done && styles.stepDotDone,
                  active && styles.stepDotActive,
                ]}>
                  {done
                    ? <Ionicons name="checkmark" size={10} color={colors.background.primary} />
                    : <Ionicons name={s.icon as any} size={10} color={
                        active ? colors.brand.primary : colors.text.disabled
                      } />
                  }
                </View>
                <Text
                  variant="labelSm"
                  style={{
                    color: done ? colors.success : active ? colors.text.primary : colors.text.disabled,
                    fontWeight: active ? '600' : '400',
                  }}
                >
                  {s.label}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing[5],
    gap: spacing[5],
    paddingBottom: spacing[10],
  },
  errorCard: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'flex-start',
    borderColor: colors.expenseLight,
    backgroundColor: colors.expenseLight,
  },
  uploadArea: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.brand.primary,
  },
  uploadGradient: {
    padding: spacing[8],
    gap: spacing[3],
    alignItems: 'center',
  },
  uploadLoading: {
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[4],
  },
  loaderWrap: {
    width: '100%',
    alignItems: 'center',
    gap: spacing[4],
    paddingVertical: spacing[2],
  },
  loaderIconWrap: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderGlow: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.brand.primary,
  },
  loaderRing: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2.5,
    borderColor: 'transparent',
    borderTopColor: colors.brand.primary,
    borderRightColor: colors.brand.secondary,
  },
  loaderIconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface.secondary,
    borderWidth: 1.5,
    borderColor: colors.brand.primary + '55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface.tertiary,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.brand.primary,
  },
  stepList: {
    width: '100%',
    gap: spacing[2],
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2.5],
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
    borderRadius: radius.lg,
  },
  stepItemActive: {
    backgroundColor: colors.brand.light,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface.tertiary,
    borderWidth: 1,
    borderColor: colors.surface.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepDotActive: {
    backgroundColor: colors.brand.light,
    borderColor: colors.brand.primary,
  },
  uploadIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtn: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2.5],
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.light,
  },
  sectionTitle: {
    letterSpacing: 0.8,
    marginBottom: spacing[2],
  },
  banksList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  bankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.full,
    backgroundColor: colors.surface.secondary,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  stepRow: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInfo: {
    flex: 1,
    gap: spacing[0.5],
  },
  // Preview
  previewHeader: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
    gap: spacing[2],
  },
  bankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
    backgroundColor: colors.brand.light,
  },
  previewStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewList: {
    paddingHorizontal: spacing[5],
    gap: spacing[1],
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.surface.primary,
    borderRadius: radius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  previewRowDeselected: {
    opacity: 0.4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.surface.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  noCategory: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surface.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTap: {
    position: 'relative',
  },
  editBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.surface.tertiary,
    borderWidth: 1,
    borderColor: colors.surface.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadgeActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  swipeAction: {
    width: 90,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.xl,
    marginRight: spacing[1],
    paddingHorizontal: spacing[2],
  },
  swipeActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInfo: {
    flex: 1,
    gap: spacing[0.5],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  previewFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing[5],
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
  },
  batchModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  batchModalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.brand.primary + '44',
  },
  batchCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[4],
    gap: spacing[1.5],
    flexWrap: 'wrap',
  },
  batchSampleList: {
    gap: spacing[2],
    marginBottom: spacing[5],
  },
  batchSampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[1],
  },
  batchSampleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.primary,
    flexShrink: 0,
  },
  batchModalActions: {
    gap: spacing[2],
  },
  batchApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.brand.primary,
    borderRadius: radius.xl,
    paddingVertical: spacing[4],
  },
  batchSkipBtn: {
    paddingVertical: spacing[3],
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleSavedToast: {
    position: 'absolute',
    bottom: 100,
    left: spacing[5],
    right: spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.surface.secondary,
    borderWidth: 1,
    borderColor: colors.brand.primary + '55',
    borderRadius: radius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  // Category picker
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing[5],
    paddingTop: spacing[4],
    maxHeight: '80%',
  },
  pickerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface.border,
    alignSelf: 'center',
    marginBottom: spacing[4],
  },
  pickerTxnHeader: {
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  pickerTxnMeta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  pickerCurrentCat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[1],
  },
  pickerDivider: {
    height: 1,
    backgroundColor: colors.surface.border,
    marginTop: spacing[1],
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: radius.lg,
  },
  pickerRowActive: {
    backgroundColor: colors.brand.light,
  },
  pickerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Reconciliation card
  reconCard: {
    marginHorizontal: spacing[5],
    marginBottom: spacing[3],
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.brand.primary + '33',
    gap: spacing[3],
  },
  reconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  reconBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: radius.full,
    marginLeft: 'auto',
  },
  reconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[1],
  },
  reconStat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[0.5],
  },
  reconEquals: {
    paddingHorizontal: spacing[1],
  },
  // Balance sync prompt (done screen)
  balancePromptCard: {
    width: '100%',
    backgroundColor: colors.surface.secondary,
    borderRadius: radius['2xl'],
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.brand.primary + '44',
    gap: spacing[3],
    alignItems: 'center',
  },
  balancePromptIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Done
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[5],
    paddingHorizontal: spacing[6],
  },
  successIcon: {
    marginBottom: spacing[2],
  },
  resultStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[6],
    backgroundColor: colors.surface.primary,
    borderRadius: radius['2xl'],
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.surface.border,
    width: '100%',
    justifyContent: 'center',
  },
  resultStat: {
    alignItems: 'center',
    gap: spacing[1],
  },
  resultDivider: {
    width: 1,
    height: 48,
    backgroundColor: colors.surface.border,
  },
});
