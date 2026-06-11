import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius } from '@/theme';

interface CategoryIconProps {
  icon: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { container: 32, icon: 16 },
  md: { container: 44, icon: 22 },
  lg: { container: 56, icon: 28 },
};

export function CategoryIcon({ icon, color, size = 'md' }: CategoryIconProps) {
  const { container, icon: iconSize } = sizeMap[size];

  return (
    <View
      style={[
        styles.container,
        {
          width: container,
          height: container,
          borderRadius: container / 3,
          backgroundColor: `${color}22`,
        },
      ]}
    >
      <Ionicons
        name={icon as keyof typeof Ionicons.glyphMap}
        size={iconSize}
        color={color}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
