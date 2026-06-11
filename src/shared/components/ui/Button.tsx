import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  ActivityIndicator,
  type PressableProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography } from '@/theme';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  variant = 'primary',
  size = 'md',
  label,
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  disabled,
  onPress,
  ...props
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 20, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 400 });
  };

  const handlePress = (e: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
    if (variant !== 'ghost') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(e);
  };

  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      style={[
        animStyle,
        fullWidth && styles.fullWidth,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={isDisabled}
      {...props}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={isDisabled ? ['#3A3A54', '#3A3A54'] : colors.brand.gradient as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, sizes[size], isDisabled && styles.disabled]}
        >
          <Content label={label} loading={loading} icon={icon} iconRight={iconRight} size={size} variant={variant} />
        </LinearGradient>
      ) : (
        <View style={[styles.base, sizes[size], variantStyles[variant], isDisabled && styles.disabled]}>
          <Content label={label} loading={loading} icon={icon} iconRight={iconRight} size={size} variant={variant} />
        </View>
      )}
    </AnimatedPressable>
  );
}

function Content({
  label,
  loading,
  icon,
  iconRight,
  size,
  variant,
}: {
  label: string;
  loading: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  size: ButtonSize;
  variant: ButtonVariant;
}) {
  const textColor = variant === 'ghost' ? colors.brand.primary : colors.white;

  if (loading) {
    return <ActivityIndicator color={textColor} size="small" />;
  }

  return (
    <>
      {icon && <View style={styles.iconLeft}>{icon}</View>}
      <Text
        style={[
          labelSizes[size],
          { color: textColor, fontWeight: '600' },
        ]}
      >
        {label}
      </Text>
      {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
    </>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  iconLeft: { marginRight: spacing[2] },
  iconRight: { marginLeft: spacing[2] },
});

const sizes = StyleSheet.create({
  sm: { height: 36, paddingHorizontal: spacing[4] },
  md: { height: 48, paddingHorizontal: spacing[6] },
  lg: { height: 56, paddingHorizontal: spacing[8] },
});

const labelSizes: Record<ButtonSize, object> = {
  sm: typography.label.md,
  md: typography.label.lg,
  lg: typography.body.lg,
};

const variantStyles = StyleSheet.create({
  primary: {}, // handled by gradient
  secondary: {
    backgroundColor: colors.surface.secondary,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.expenseLight,
    borderWidth: 1,
    borderColor: colors.expense,
  },
  success: {
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.success,
  },
});
