import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Switch,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BottomSheet, { BottomSheetTextInput, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '@/theme';
import { Screen } from '@/shared/components/layout/Screen';
import { Header } from '@/shared/components/layout/Header';
import { Text } from '@/shared/components/ui/Text';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { CategoryIcon } from '@/shared/components/ui/CategoryIcon';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { useRules, useCreateRule, useDeleteRule, useToggleRule } from '@/features/rules/hooks/useRules';
import { useCategories } from '@/features/categories/hooks/useCategories';
import type { Rule, Category } from '@/types/database.types';
import * as Haptics from 'expo-haptics';

export default function RulesScreen() {
  const { data: rules = [], isLoading } = useRules();
  const { data: categories = [] } = useCategories();
  const createRule = useCreateRule();
  const deleteRule = useDeleteRule();
  const toggleRule = useToggleRule();

  const sheetRef = useRef<BottomSheet>(null);
  const [keyword, setKeyword] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

  const openCreate = () => {
    setKeyword('');
    setSelectedCatId(null);
    sheetRef.current?.expand();
  };

  const handleCreate = async () => {
    if (!keyword.trim()) {
      Alert.alert('Keyword required', 'Please enter a keyword');
      return;
    }
    if (!selectedCatId) {
      Alert.alert('Category required', 'Please select a category');
      return;
    }
    try {
      await createRule.mutateAsync({
        keyword: keyword.trim().toLowerCase(),
        category_id: selectedCatId,
        enabled: true,
        priority: keyword.trim().length,
      });
      sheetRef.current?.close();
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create rule');
    }
  };

  return (
    <Screen safeArea padding={false} scroll={false}>
      <Header
        title="Auto-categorization Rules"
        back
        right={
          <Pressable onPress={openCreate} style={styles.addBtn}>
            <Ionicons name="add" size={22} color={colors.brand.primary} />
          </Pressable>
        }
      />

      <View style={styles.info}>
        <Ionicons name="information-circle-outline" size={16} color={colors.text.tertiary} />
        <Text variant="labelSm" color="tertiary" style={styles.infoText}>
          When a transaction description contains a keyword, it gets automatically categorized.
          Longer keywords take priority.
        </Text>
      </View>

      <FlatList
        data={rules}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="flash-outline"
              title="No rules yet"
              description="Create rules to auto-categorize your transactions"
              action={{ label: 'Add Rule', onPress: openCreate }}
            />
          ) : null
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item: rule, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 30).duration(300)} style={styles.rowWrapper}>
            <View style={styles.ruleRow}>
              <View style={styles.keywordBadge}>
                <Text variant="labelMd" style={{ color: colors.brand.secondary, fontFamily: 'monospace' }}>
                  {rule.keyword}
                </Text>
              </View>

              <Ionicons name="arrow-forward" size={14} color={colors.text.tertiary} />

              {rule.category ? (
                <View style={styles.catChip}>
                  <CategoryIcon icon={rule.category.icon} color={rule.category.color} size="sm" />
                  <Text variant="labelSm" style={{ color: rule.category.color }}>
                    {rule.category.name}
                  </Text>
                </View>
              ) : (
                <Text variant="labelSm" color="tertiary">Deleted category</Text>
              )}

              <View style={styles.actions}>
                <Switch
                  value={rule.enabled}
                  onValueChange={(v) => toggleRule.mutate({ id: rule.id, enabled: v })}
                  trackColor={{ false: colors.surface.border, true: colors.brand.primary }}
                  thumbColor={colors.white}
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
                <Pressable
                  onPress={() => {
                    Alert.alert('Delete Rule', `Delete rule for "${rule.keyword}"?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteRule.mutate(rule.id) },
                    ]);
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                </Pressable>
              </View>
            </View>
          </Animated.View>
        )}
      />

      {/* Create Sheet */}
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={['70%']}
        enablePanDownToClose
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.handle}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
          <View style={styles.sheetHeader}>
            <Text variant="headingSm">New Rule</Text>
            <Pressable onPress={() => sheetRef.current?.close()}>
              <Ionicons name="close" size={22} color={colors.text.secondary} />
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text variant="labelLg" color="secondary">Keyword</Text>
            <BottomSheetTextInput
              style={styles.textInput}
              value={keyword}
              onChangeText={setKeyword}
              placeholder="e.g. swiggy, netflix, petrol..."
              placeholderTextColor={colors.text.tertiary}
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor={colors.brand.primary}
            />
            <Text variant="labelSm" color="tertiary">
              Case-insensitive. Longer keywords take priority when multiple rules match.
            </Text>
          </View>

          <View style={styles.field}>
            <Text variant="labelLg" color="secondary">Assign to Category</Text>
            <View style={styles.catGrid}>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.catOption,
                    selectedCatId === cat.id && {
                      borderColor: cat.color,
                      backgroundColor: `${cat.color}18`,
                    },
                  ]}
                  onPress={() => { setSelectedCatId(cat.id); Haptics.selectionAsync(); }}
                >
                  <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                  <Text
                    variant="labelSm"
                    style={{ color: selectedCatId === cat.id ? cat.color : colors.text.secondary }}
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Button
            label="Create Rule"
            onPress={handleCreate}
            loading={createRule.isPending}
            fullWidth
          />
        </BottomSheetScrollView>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    lineHeight: 18,
  },
  listContent: {
    gap: spacing[1],
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[10],
  },
  rowWrapper: {
    backgroundColor: colors.surface.primary,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.surface.border,
    overflow: 'hidden',
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  keywordBadge: {
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[1],
    borderRadius: radius.md,
    backgroundColor: colors.brand.light,
    maxWidth: 120,
  },
  catChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  sheetBg: {
    backgroundColor: colors.surface.primary,
  },
  handle: {
    backgroundColor: colors.surface.border,
    width: 40,
  },
  sheetContent: {
    paddingHorizontal: spacing[5],
    gap: spacing[4],
    paddingBottom: spacing[8],
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing[2],
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
    fontFamily: 'monospace',
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  catOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.secondary,
    maxWidth: 150,
  },
});
