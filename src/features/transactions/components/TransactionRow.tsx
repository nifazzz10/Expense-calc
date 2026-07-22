import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  FadeInDown,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius } from '@/theme';
import { Text } from '@/shared/components/ui/Text';
import { CategoryIcon } from '@/shared/components/ui/CategoryIcon';
import { formatCurrency, formatTransactionDate } from '@/shared/utils/format';
import { parseDescription } from '@/shared/utils/parseDescription';
import type { Transaction } from '@/types/database.types';
import { useSettingsStore } from '@/store/settingsStore';

interface TransactionRowProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  index?: number;
  // Selection mode
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onLongPress?: (id: string) => void;
}

const SWIPE_THRESHOLD = 60;
const ACTION_WIDTH = 80;

export function TransactionRow({
  transaction,
  onDelete,
  onEdit,
  index = 0,
  selectionMode = false,
  isSelected = false,
  onSelect,
  onLongPress,
}: TransactionRowProps) {
  const { currencySymbol } = useSettingsStore();
  const translateX = useSharedValue(0);
  const isDeleting = useSharedValue(false);

  const { category, amount, description, transaction_type, transaction_date } = transaction;
  const parsed = parseDescription(description ?? '');

  const amountColor =
    transaction_type === 'income' ? colors.income :
    transaction_type === 'expense' ? colors.expense : colors.transfer;

  const amountPrefix =
    transaction_type === 'income' ? '+' :
    transaction_type === 'expense' ? '-' : '';

  const panGesture = Gesture.Pan()
    .enabled(!selectionMode)
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      if (isDeleting.value) return;
      translateX.value = Math.max(-ACTION_WIDTH * 2, Math.min(ACTION_WIDTH, e.translationX));
    })
    .onEnd((e) => {
      if (isDeleting.value) return;
      if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-ACTION_WIDTH);
      } else if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withSpring(0);
        runOnJS(onEdit)(transaction);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: selectionMode ? 0 : translateX.value }],
  }));

  const deleteActionStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.abs(translateX.value) / ACTION_WIDTH),
    transform: [{ scale: Math.min(1, Math.abs(translateX.value) / ACTION_WIDTH) }],
  }));

  const handleDeleteConfirm = useCallback(() => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => { translateX.value = withSpring(0); } },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            isDeleting.value = true;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onDelete(transaction.id);
          },
        },
      ]
    );
  }, [transaction.id, onDelete]);

  const handlePress = useCallback(() => {
    if (selectionMode) {
      onSelect?.(transaction.id);
    } else {
      onEdit(transaction);
    }
  }, [selectionMode, onSelect, onEdit, transaction]);

  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (selectionMode) {
      translateX.value = withSpring(-ACTION_WIDTH);
    } else {
      onLongPress?.(transaction.id);
    }
  }, [selectionMode, onLongPress, transaction.id]);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 30).duration(300)}
      style={styles.container}
    >
      {/* Delete action background (hidden in selection mode) */}
      {!selectionMode && (
        <View style={styles.actions}>
          <Animated.View style={[styles.deleteAction, deleteActionStyle]}>
            <Pressable style={styles.deleteBtn} onPress={handleDeleteConfirm}>
              <Ionicons name="trash-outline" size={20} color={colors.white} />
            </Pressable>
          </Animated.View>
        </View>
      )}

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.row, isSelected && styles.rowSelected, rowStyle]}>
          <Pressable
            style={styles.rowInner}
            onPress={handlePress}
            onLongPress={handleLongPress}
          >
            {/* Checkbox in selection mode, category icon otherwise */}
            {selectionMode ? (
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Ionicons name="checkmark" size={14} color={colors.white} />}
              </View>
            ) : (
              <CategoryIcon
                icon={category?.icon ?? 'apps'}
                color={category?.color ?? colors.text.tertiary}
                size="md"
              />
            )}

            <View style={styles.info}>
              <Text variant="bodySm" numberOfLines={1} style={styles.title}>
                {parsed.title}
              </Text>
              <View style={styles.meta}>
                {parsed.tag && <TagBadge tag={parsed.tag} />}
                <Text variant="labelSm" color="tertiary">
                  {formatTransactionDate(transaction_date)}
                </Text>
                {category && (
                  <>
                    <View style={styles.dot} />
                    <Text variant="labelSm" color="tertiary" numberOfLines={1}>
                      {category.name}
                    </Text>
                  </>
                )}
              </View>
            </View>

            <Text
              variant="bodySm"
              style={[styles.amount, { color: amountColor, fontWeight: '700' }]}
            >
              {amountPrefix}{formatCurrency(Number(amount), currencySymbol)}
            </Text>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const TAG_LABEL: Record<string, string> = {
  'UPI Credit':  'UPI',
  'UPI Debit':   'UPI',
  'UPI':         'UPI',
  'NEFT':        'NEFT',
  'IMPS':        'IMPS',
  'RTGS':        'RTGS',
  'ATM':         'ATM',
  'Debit Card':  'Card',
  'Credit Card': 'CC',
  'Cheque':      'CHQ',
  'Auto Debit':  'ECS',
  'NACH Debit':  'NACH',
  'EMI':         'EMI',
  'Salary':      'SAL',
  'Interest':    'INT',
  'Transfer':    'TFR',
  'Dividend':    'DIV',
};

function TagBadge({ tag }: { tag: string }) {
  const label = TAG_LABEL[tag] ?? tag.slice(0, 4).toUpperCase();
  return (
    <View style={tagStyle.badge}>
      <Text style={tagStyle.text}>{label}</Text>
    </View>
  );
}

const tagStyle = StyleSheet.create({
  badge: {
    backgroundColor: colors.brand.primary + '14',
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.brand.primary + '28',
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  text: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.brand.primary,
    letterSpacing: 0.5,
  },
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginHorizontal: spacing[5],
    marginVertical: spacing[1],
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  actions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteAction: {
    width: ACTION_WIDTH,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.expense,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    backgroundColor: colors.surface.primary,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  rowSelected: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.light,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.surface.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.secondary,
  },
  checkboxSelected: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  info: {
    flex: 1,
    gap: spacing[1],
  },
  title: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    flexWrap: 'nowrap',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.text.tertiary,
  },
  amount: {
    textAlign: 'right',
    letterSpacing: -0.3,
  },
});
