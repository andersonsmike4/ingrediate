import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';

interface SkeletonLoaderProps {
  lines?: number;
  showAvatar?: boolean;
  showImage?: boolean;
  style?: ViewStyle;
}

export default function SkeletonLoader({
  lines = 3,
  showAvatar = false,
  showImage = false,
  style,
}: SkeletonLoaderProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const bgColor = colors.surfaceSecondary;
  const LINE_WIDTHS = ['100%', '85%', '60%', '90%', '70%'];

  return (
    <View style={[styles.container, style]}>
      {showAvatar && (
        <View style={styles.avatarRow}>
          <Animated.View
            style={[styles.avatar, { backgroundColor: bgColor }, animatedStyle]}
          />
          <View style={styles.avatarLines}>
            <Animated.View
              style={[styles.line, { backgroundColor: bgColor, width: '60%' }, animatedStyle]}
            />
            <Animated.View
              style={[styles.line, { backgroundColor: bgColor, width: '40%', height: 12 }, animatedStyle]}
            />
          </View>
        </View>
      )}
      {showImage && (
        <Animated.View
          style={[styles.image, { backgroundColor: bgColor }, animatedStyle]}
        />
      )}
      {Array.from({ length: lines }).map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.line,
            {
              backgroundColor: bgColor,
              width: LINE_WIDTHS[i % LINE_WIDTHS.length] as any,
            },
            animatedStyle,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarLines: {
    flex: 1,
    gap: 8,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: 12,
  },
  line: {
    height: 16,
    borderRadius: 8,
  },
});
