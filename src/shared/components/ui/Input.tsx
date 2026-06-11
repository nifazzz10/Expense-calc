import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  type TextInputProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '@/theme';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  containerStyle?: object;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function Input({
  label,
  error,
  hint,
  prefix,
  suffix,
  containerStyle,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const progress = useSharedValue(0);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [error ? colors.error : colors.surface.border, error ? colors.error : colors.brand.primary]
    ),
  }));

  const handleFocus = (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
    setFocused(true);
    progress.value = withTiming(1, { duration: 200 });
    onFocus?.(e);
  };

  const handleBlur = (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
    setFocused(false);
    progress.value = withTiming(0, { duration: 200 });
    onBlur?.(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text variant="labelLg" color="secondary" style={styles.label}>
          {label}
        </Text>
      )}
      <AnimatedView style={[styles.inputWrapper, borderStyle]}>
        {prefix && <View style={styles.prefix}>{prefix}</View>}
        <TextInput
          style={[styles.input, !!prefix && styles.inputWithPrefix, !!suffix && styles.inputWithSuffix]}
          placeholderTextColor={colors.text.tertiary}
          selectionColor={colors.brand.primary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {suffix && <View style={styles.suffix}>{suffix}</View>}
      </AnimatedView>
      {error ? (
        <Text variant="labelSm" color="expense" style={styles.hint}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="labelSm" color="tertiary" style={styles.hint}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[1.5],
  },
  label: {
    marginBottom: spacing[0.5],
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
    minHeight: 52,
    paddingHorizontal: spacing[4],
  },
  input: {
    flex: 1,
    ...typography.body.lg,
    color: colors.text.primary,
    paddingVertical: spacing[3],
  },
  inputWithPrefix: {
    paddingLeft: spacing[2],
  },
  inputWithSuffix: {
    paddingRight: spacing[2],
  },
  prefix: {
    marginRight: spacing[2],
  },
  suffix: {
    marginLeft: spacing[2],
  },
  hint: {
    marginTop: spacing[1],
    paddingHorizontal: spacing[1],
  },
});
