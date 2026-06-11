import React from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '@/theme';
import { Text } from '@/shared/components/ui/Text';
import { CategoryIcon } from '@/shared/components/ui/CategoryIcon';
import type { Category } from '@/types/database.types';

interface QuickItem {
  label: string;
  amount: number;
  categoryId: string;
  icon: string;
  color: string;
}

interface QuickAddBarProps {
  recentCategories: Category[];
  onQuickAdd: (categoryId: string) => void;
  onAddCustom: () => void;
}

export function QuickAddBar({ recentCategories, onQuickAdd, onAddCustom }: QuickAddBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="labelLg" color="secondary">
          Quick Add
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {recentCategories.slice(0, 6).map((cat, i) => (
          <Animated.View
            key={cat.id}
            entering={FadeInRight.delay(i * 50).duration(300)}
          >
            <Pressable
              style={styles.chip}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onQuickAdd(cat.id);
              }}
            >
              <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
              <Text variant="labelSm" style={{ color: cat.color }}>
                {cat.name}
              </Text>
            </Pressable>
          </Animated.View>
        ))}
        <Pressable style={[styles.chip, styles.customChip]} onPress={onAddCustom}>
          <Ionicons name="add" size={16} color={colors.brand.primary} />
          <Text variant="labelSm" color="brand">
            Custom
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
  },
  header: {
    paddingHorizontal: spacing[5],
  },
  list: {
    gap: spacing[2],
    paddingHorizontal: spacing[5],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    backgroundColor: colors.surface.secondary,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  customChip: {
    borderColor: colors.brand.light,
    backgroundColor: colors.brand.light,
  },
});
