import React, { useEffect } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { colors, radius } from '@/theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = radius.md, style }: SkeletonProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.4, 0.8, 0.4]),
  }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: colors.surface.tertiary },
        animStyle,
        style,
      ]}
    />
  );
}

export function TransactionSkeleton() {
  return (
    <View style={skeletonStyles.row}>
      <Skeleton width={44} height={44} borderRadius={14} />
      <View style={skeletonStyles.content}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
      </View>
      <View style={skeletonStyles.amount}>
        <Skeleton width={70} height={14} />
        <Skeleton width={50} height={10} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export function CardSkeleton() {
  return (
    <View style={skeletonStyles.card}>
      <Skeleton width="50%" height={12} />
      <Skeleton width="70%" height={28} style={{ marginTop: 8 }} />
      <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  amount: {
    alignItems: 'flex-end',
    gap: 4,
  },
  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
});
