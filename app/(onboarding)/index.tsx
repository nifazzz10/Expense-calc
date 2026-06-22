import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  Pressable,
  ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { colors, spacing, radius } from '@/theme';
import { Text } from '@/shared/components/ui/Text';
import { Button } from '@/shared/components/ui/Button';
import { ONBOARDING_KEY } from '@/shared/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';

const { width: W, height: H } = Dimensions.get('window');

type Slide = {
  id: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  gradientColors: [string, string];
  glowColor: string;
  title: string;
  subtitle: string;
  isHero?: boolean;
};

const SLIDES: Slide[] = [
  {
    id: 'welcome',
    icon: 'wallet',
    gradientColors: ['#7C6FF7', '#5B50D6'],
    glowColor: 'rgba(124,111,247,0.2)',
    title: 'Expense Tracker',
    subtitle: 'Take control of your finances.\nTrack smarter. Spend wiser.',
    isHero: true,
  },
  {
    id: 'autocategorize',
    icon: 'pricetag',
    gradientColors: ['#7C6FF7', '#5B50D6'],
    glowColor: 'rgba(124,111,247,0.2)',
    title: 'Auto-Categorize',
    subtitle:
      'Set up smart rules once. Every transaction gets tagged automatically — no manual sorting ever.',
  },
  {
    id: 'analytics',
    icon: 'bar-chart',
    gradientColors: ['#00D4A8', '#00A882'],
    glowColor: 'rgba(0,212,168,0.2)',
    title: 'Spending Insights',
    subtitle:
      'Monthly charts, category breakdowns, and trends — understand exactly where your money goes.',
  },
  {
    id: 'import',
    icon: 'document-text',
    gradientColors: ['#FFB547', '#E89500'],
    glowColor: 'rgba(255,181,71,0.2)',
    title: 'Import Statements',
    subtitle:
      'Upload your bank PDF and all transactions land instantly — deduplicated and ready to review.',
  },
];

function SlideItem({ slide }: { slide: Slide }) {
  return (
    <View style={styles.slide}>
      <View style={styles.illustrationArea}>
        {/* Glow ring behind icon */}
        <View style={[styles.glow, { backgroundColor: slide.glowColor }]} />

        <LinearGradient
          colors={slide.gradientColors}
          style={[styles.iconWrap, slide.isHero && styles.iconWrapHero]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons
            name={slide.icon}
            size={slide.isHero ? 44 : 38}
            color={colors.white}
          />
        </LinearGradient>
      </View>

      <View style={styles.textArea}>
        <Text
          variant={slide.isHero ? 'headingXl' : 'headingLg'}
          style={styles.title}
        >
          {slide.title}
        </Text>
        <Text variant="bodyLg" color="secondary" style={styles.subtitle}>
          {slide.subtitle}
        </Text>
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { setOnboardingSeen } = useAuthStore();
  const listRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isLast = activeIndex === SLIDES.length - 1;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const handleNext = () => {
    if (isLast) {
      handleGetStarted();
    } else {
      listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    }
  };

  const markSeen = async () => {
    // Update store first so AuthGuard routing sees it immediately
    setOnboardingSeen(true);
    SecureStore.setItemAsync(ONBOARDING_KEY, '1');
  };

  const handleGetStarted = async () => {
    await markSeen();
    router.replace('/(auth)/login');
  };

  const handleSignIn = async () => {
    await markSeen();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => <SlideItem slide={item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        getItemLayout={(_, index) => ({
          length: W,
          offset: W * index,
          index,
        })}
        bounces={false}
      />

      <Animated.View entering={FadeIn.duration(400)} style={styles.bottomBar}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.btnWrap}>
          <Button
            label={isLast ? 'Get Started' : 'Next'}
            onPress={handleNext}
            fullWidth
            size="lg"
          />
        </Animated.View>

        {/* Sign in link */}
        <Pressable onPress={handleSignIn} style={styles.signInRow} hitSlop={12}>
          <Text variant="bodyMd" color="tertiary">
            Already have an account?{' '}
          </Text>
          <Text variant="bodyMd" style={styles.signInLink}>
            Sign in
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  // Slide
  slide: {
    width: W,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
    paddingTop: spacing[20],
    paddingBottom: spacing[4],
  },
  illustrationArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[10],
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapHero: {
    width: 112,
    height: 112,
    borderRadius: 28,
  },
  textArea: {
    alignItems: 'center',
    gap: spacing[3],
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 300,
  },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[12],
    paddingTop: spacing[4],
    alignItems: 'center',
    gap: spacing[5],
  },
  dots: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surface.border,
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.brand.primary,
  },
  btnWrap: {
    width: '100%',
  },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signInLink: {
    color: colors.brand.primary,
  },
});
