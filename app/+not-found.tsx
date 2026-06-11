import { useRouter } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme';
import { Text } from '@/shared/components/ui/Text';
import { Button } from '@/shared/components/ui/Button';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text variant="displayMd">404</Text>
      <Text variant="headingMd" style={styles.title}>Page not found</Text>
      <Button label="Go Home" onPress={() => router.replace('/(tabs)')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    backgroundColor: colors.background.primary,
  },
  title: { color: colors.text.secondary },
});
