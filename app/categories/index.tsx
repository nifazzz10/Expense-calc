import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BottomSheet, { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius, typography } from '@/theme';
import { Screen } from '@/shared/components/layout/Screen';
import { Header } from '@/shared/components/layout/Header';
import { Text } from '@/shared/components/ui/Text';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { CategoryIcon } from '@/shared/components/ui/CategoryIcon';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/features/categories/hooks/useCategories';
import { categoryService } from '@/features/categories/hooks/useCategoryService';
import { CATEGORY_ICONS, type CategoryIcon as CatIcon } from '@/theme';
import type { Category, CategoryType } from '@/types/database.types';

const PRESET_COLORS = [
  '#FF7043', '#FF5252', '#E91E63', '#9C27B0', '#673AB7',
  '#3F51B5', '#2196F3', '#00BCD4', '#009688', '#4CAF50',
  '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#FF5722',
  '#78909C', '#7C6FF7', '#00D4A8', '#FFB547',
];

export default function CategoriesScreen() {
  const { data: categories = [], isLoading } = useCategories();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();

  const sheetRef = useRef<BottomSheet | null>(null);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('apps');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [catType, setCatType] = useState<CategoryType>('expense');

  const openCreate = () => {
    setEditingCat(null);
    setName('');
    setSelectedIcon('apps');
    setSelectedColor(PRESET_COLORS[0]);
    setCatType('expense');
    sheetRef.current?.expand();
  };

  const openEdit = (cat: Category) => {
    setEditingCat(cat);
    setName(cat.name);
    setSelectedIcon(cat.icon);
    setSelectedColor(cat.color);
    setCatType(cat.type);
    sheetRef.current?.expand();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a category name');
      return;
    }
    try {
      if (editingCat) {
        await updateCat.mutateAsync({
          id: editingCat.id,
          payload: { name: name.trim(), icon: selectedIcon, color: selectedColor, type: catType },
        });
      } else {
        await createCat.mutateAsync({ name: name.trim(), icon: selectedIcon, color: selectedColor, type: catType, is_system: false, sort_order: 99 });
      }
      sheetRef.current?.close();
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleDelete = async (cat: Category) => {
    const count = await categoryService.getTransactionCount(cat.id);
    const message = count > 0
      ? `This category has ${count} transaction(s). They will become uncategorized.`
      : 'Are you sure you want to delete this category?';

    Alert.alert('Delete Category', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteCat.mutate(cat.id),
      },
    ]);
  };

  const grouped = {
    expense: categories.filter((c) => c.type === 'expense'),
    income: categories.filter((c) => c.type === 'income'),
    transfer: categories.filter((c) => c.type === 'transfer'),
    investment: categories.filter((c) => c.type === 'investment'),
    all: categories.filter((c) => c.type === 'all'),
  };

  return (
    <Screen safeArea padding={false} scroll={false}>
      <Header
        title="Categories"
        back
        right={
          <Pressable onPress={openCreate} style={styles.addBtn}>
            <Ionicons name="add" size={22} color={colors.brand.primary} />
          </Pressable>
        }
      />

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="grid-outline"
              title="No categories"
              description="Create your first category"
              action={{ label: 'Create Category', onPress: openCreate }}
            />
          ) : null
        }
        ListHeaderComponent={
          <View style={styles.groups}>
            {(['expense', 'income', 'transfer', 'investment', 'all'] as CategoryType[]).map((type) => {
              const cats = grouped[type];
              if (cats.length === 0) return null;
              return (
                <Animated.View key={type} entering={FadeInDown.duration(400)} style={styles.group}>
                  <Text
                    variant="labelMd"
                    color="tertiary"
                    style={styles.groupLabel}
                  >
                    {type.toUpperCase()}
                  </Text>
                  <Card padding={0}>
                    {cats.map((cat, i) => (
                      <View key={cat.id}>
                        {i > 0 && <View style={styles.divider} />}
                        <Pressable
                          style={styles.catRow}
                          onPress={() => openEdit(cat)}
                        >
                          <CategoryIcon icon={cat.icon} color={cat.color} size="md" />
                          <View style={styles.catInfo}>
                            <Text variant="bodyMd" style={{ fontWeight: '500' }}>
                              {cat.name}
                            </Text>
                            {cat.is_system && (
                              <Text variant="labelSm" color="tertiary">
                                Default
                              </Text>
                            )}
                          </View>
                          <Pressable
                            onPress={() => handleDelete(cat)}
                            hitSlop={8}
                            style={styles.deleteBtn}
                          >
                            <Ionicons name="trash-outline" size={16} color={colors.error} />
                          </Pressable>
                          <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
                        </Pressable>
                      </View>
                    ))}
                  </Card>
                </Animated.View>
              );
            })}
          </View>
        }
        contentContainerStyle={styles.listContent}
        renderItem={() => null}
      />

      {/* Create/Edit Sheet */}
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={['80%']}
        enablePanDownToClose
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.handle}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          <View style={styles.sheetHeader}>
            <Text variant="headingSm">
              {editingCat ? 'Edit Category' : 'New Category'}
            </Text>
            <Pressable onPress={() => sheetRef.current?.close()}>
              <Ionicons name="close" size={22} color={colors.text.secondary} />
            </Pressable>
          </View>

          {/* Preview */}
          <View style={styles.preview}>
            <CategoryIcon icon={selectedIcon} color={selectedColor} size="lg" />
            <Text variant="headingXs">{name || 'Category Name'}</Text>
          </View>

          {/* Name */}
          <View style={styles.field}>
            <Text variant="labelLg" color="secondary">Name</Text>
            <BottomSheetTextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Category name..."
              placeholderTextColor={colors.text.tertiary}
              selectionColor={colors.brand.primary}
              maxLength={30}
            />
          </View>

          {/* Type */}
          <View style={styles.field}>
            <Text variant="labelLg" color="secondary">Type</Text>
            <View style={styles.typeTabs}>
              {(['expense', 'income', 'transfer', 'investment', 'all'] as CategoryType[]).map((t) => (
                <Pressable
                  key={t}
                  style={[styles.typeTab, catType === t && styles.typeTabActive]}
                  onPress={() => { setCatType(t); Haptics.selectionAsync(); }}
                >
                  <Text
                    variant="labelSm"
                    style={{
                      color: catType === t ? colors.brand.primary : colors.text.secondary,
                      textTransform: 'capitalize',
                    }}
                  >
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Color */}
          <View style={styles.field}>
            <Text variant="labelLg" color="secondary">Color</Text>
            <View style={styles.colorGrid}>
              {PRESET_COLORS.map((c) => (
                <Pressable
                  key={c}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    selectedColor === c && styles.colorDotSelected,
                  ]}
                  onPress={() => { setSelectedColor(c); Haptics.selectionAsync(); }}
                />
              ))}
            </View>
          </View>

          {/* Icon */}
          <View style={styles.field}>
            <Text variant="labelLg" color="secondary">Icon</Text>
            <FlatList
              data={CATEGORY_ICONS.slice(0, 20) as unknown as string[]}
              numColumns={8}
              keyExtractor={(i) => i}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.iconBtn,
                    selectedIcon === item && { backgroundColor: `${selectedColor}33`, borderColor: selectedColor },
                  ]}
                  onPress={() => { setSelectedIcon(item); Haptics.selectionAsync(); }}
                >
                  <Ionicons
                    name={item as keyof typeof Ionicons.glyphMap}
                    size={18}
                    color={selectedIcon === item ? selectedColor : colors.text.tertiary}
                  />
                </Pressable>
              )}
            />
          </View>

          <Button
            label={editingCat ? 'Update' : 'Create Category'}
            onPress={handleSave}
            loading={createCat.isPending || updateCat.isPending}
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
  groups: {
    gap: spacing[5],
    padding: spacing[5],
  },
  group: {
    gap: spacing[2],
  },
  groupLabel: {
    letterSpacing: 0.8,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  catInfo: {
    flex: 1,
    gap: spacing[0.5],
  },
  deleteBtn: {
    padding: spacing[1],
  },
  divider: {
    height: 1,
    backgroundColor: colors.surface.divider,
    marginLeft: spacing[4] + 44 + spacing[3],
  },
  listContent: {
    paddingBottom: spacing[10],
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
  preview: {
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
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
  typeTabs: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  typeTab: {
    flex: 1,
    height: 36,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.surface.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeTabActive: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.light,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: colors.white,
  },
  iconBtn: {
    width: 40,
    height: 40,
    margin: 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
