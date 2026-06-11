import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Share,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { colors, spacing, radius } from '@/theme';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { CURRENCIES, type CurrencyCode } from '@/theme';
import { transactionService } from '@/features/transactions/services/transactionService';
import { formatCurrency } from '@/shared/utils/format';

export default function SettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { currency, setCurrency, currencySymbol } = useSettingsStore();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            await supabase.auth.signOut();
            setSigningOut(false);
          },
        },
      ]
    );
  };

  const handleExportCSV = async () => {
    if (!user) return;
    try {
      const { data } = await transactionService.getList(user.id, {});
      const rows = data.map((t) => [
        t.transaction_date,
        `"${(t.description ?? '').replace(/"/g, '""')}"`,
        t.transaction_type,
        t.amount,
        `"${(t.category?.name ?? 'Uncategorized').replace(/"/g, '""')}"`,
        `"${(t.notes ?? '').replace(/"/g, '""')}"`,
      ]);
      const csv = [
        'Date,Description,Type,Amount,Category,Notes',
        ...rows.map((r) => r.join(',')),
      ].join('\n');

      await Share.share({ message: csv, title: 'Transactions Export' });
    } catch (err) {
      Alert.alert('Export Failed', 'Could not export transactions');
    }
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete ALL your transactions, categories, and rules. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            const { error } = await supabase
              .from('transactions')
              .delete()
              .eq('user_id', user.id);
            if (!error) {
              Alert.alert('Done', 'All data has been deleted.');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  return (
    <Screen safeArea padding={false} scroll>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text variant="headingLg">Settings</Text>
      </Animated.View>

      <View style={styles.content}>
        {/* Profile */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <Card padding={spacing[4]}>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text variant="headingMd" style={{ color: colors.brand.primary }}>
                  {user?.email?.[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text variant="headingXs" numberOfLines={1}>
                  {user?.email?.split('@')[0] ?? 'User'}
                </Text>
                <Text variant="bodySm" color="secondary" numberOfLines={1}>
                  {user?.email ?? ''}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Management */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text variant="labelMd" color="tertiary" style={styles.sectionTitle}>
            MANAGE
          </Text>
          <Card padding={0}>
            <SettingsItem
              icon="grid-outline"
              iconColor={colors.brand.primary}
              label="Categories"
              onPress={() => router.push('/categories')}
            />
            <Divider />
            <SettingsItem
              icon="flash-outline"
              iconColor={colors.transfer}
              label="Auto-categorization Rules"
              onPress={() => router.push('/rules')}
            />
            <Divider />
            <SettingsItem
              icon="document-text-outline"
              iconColor={colors.income}
              label="Import Bank Statement"
              onPress={() => router.push('/import')}
            />
          </Card>
        </Animated.View>

        {/* Currency */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Text variant="labelMd" color="tertiary" style={styles.sectionTitle}>
            PREFERENCES
          </Text>
          <Card padding={spacing[4]}>
            <Text variant="labelLg" color="secondary" style={{ marginBottom: spacing[3] }}>
              Currency
            </Text>
            <View style={styles.currencyGrid}>
              {CURRENCIES.map((c) => (
                <Pressable
                  key={c.code}
                  style={[
                    styles.currencyChip,
                    currency === c.code && styles.currencyChipActive,
                  ]}
                  onPress={() => {
                    setCurrency(c.code as CurrencyCode);
                    Haptics.selectionAsync();
                  }}
                >
                  <Text
                    variant="labelLg"
                    style={{
                      color: currency === c.code ? colors.brand.primary : colors.text.secondary,
                      fontWeight: currency === c.code ? '700' : '400',
                    }}
                  >
                    {c.symbol}
                  </Text>
                  <Text
                    variant="labelSm"
                    style={{
                      color: currency === c.code ? colors.brand.primary : colors.text.tertiary,
                    }}
                  >
                    {c.code}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>
        </Animated.View>

        {/* Data */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text variant="labelMd" color="tertiary" style={styles.sectionTitle}>
            DATA
          </Text>
          <Card padding={0}>
            <SettingsItem
              icon="download-outline"
              iconColor={colors.income}
              label="Export as CSV"
              onPress={handleExportCSV}
            />
          </Card>
        </Animated.View>

        {/* Danger Zone */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <Text variant="labelMd" color="tertiary" style={styles.sectionTitle}>
            DANGER ZONE
          </Text>
          <Card padding={spacing[4]} style={styles.dangerCard}>
            <Button
              label="Delete All Data"
              onPress={handleDeleteAllData}
              variant="danger"
              fullWidth
            />
            <Button
              label={signingOut ? 'Signing out...' : 'Sign Out'}
              onPress={handleSignOut}
              loading={signingOut}
              variant="secondary"
              fullWidth
            />
          </Card>
        </Animated.View>

        {/* Version */}
        <Text variant="labelSm" color="tertiary" style={styles.version}>
          Expense Tracker v1.0.0
        </Text>
      </View>
    </Screen>
  );
}

function SettingsItem({
  icon,
  iconColor,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={itemStyles.container} onPress={onPress}>
      <View style={[itemStyles.icon, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text variant="bodyMd" style={itemStyles.label}>
        {label}
      </Text>
      {value && <Text variant="bodyMd" color="secondary">{value}</Text>}
      <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
    </Pressable>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.surface.divider, marginLeft: spacing[4] + 44 }} />;
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  content: {
    paddingHorizontal: spacing[5],
    gap: spacing[4],
    paddingBottom: spacing[12],
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: spacing[0.5],
  },
  sectionTitle: {
    letterSpacing: 0.8,
    marginBottom: spacing[2],
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  currencyChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.secondary,
    alignItems: 'center',
    minWidth: 64,
  },
  currencyChipActive: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.light,
  },
  dangerCard: {
    gap: spacing[3],
  },
  version: {
    textAlign: 'center',
    marginTop: spacing[2],
  },
});

const itemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontWeight: '500',
  },
});
