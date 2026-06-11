import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  type ViewStyle,
  type ScrollViewProps,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from '@/theme';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  safeArea?: boolean;
  padding?: boolean;
  style?: ViewStyle;
  scrollProps?: ScrollViewProps;
  keyboardAware?: boolean;
}

export function Screen({
  children,
  scroll = false,
  safeArea = true,
  padding = true,
  style,
  scrollProps,
  keyboardAware = false,
}: ScreenProps) {
  const Container = safeArea ? SafeAreaView : View;
  const containerStyle = [styles.container, style];

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[padding && styles.padding, styles.scrollContent]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      {...scrollProps}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[padding && styles.padding, styles.flex]}>
      {children}
    </View>
  );

  const inner = keyboardAware ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      {content}
    </KeyboardAvoidingView>
  ) : content;

  return (
    <Container style={containerStyle} edges={safeArea ? ['top', 'left', 'right'] : undefined}>
      <StatusBar style="light" />
      {inner}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  flex: {
    flex: 1,
  },
  padding: {
    paddingHorizontal: spacing[5],
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing[10],
  },
});
