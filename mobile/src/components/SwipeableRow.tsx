import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated, Vibration } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';

interface SwipeableRowProps {
  onDelete: () => void;
  children: React.ReactNode;
  enabled?: boolean;
}

export default function SwipeableRow({ onDelete, children, enabled = true }: SwipeableRowProps) {
  const { colors } = useTheme();
  const swipeableRef = useRef<Swipeable>(null);

  if (!enabled) return <>{children}</>;

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.deleteContainer, { backgroundColor: colors.error }]}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
        </Animated.View>
      </View>
    );
  };

  const handleSwipeOpen = () => {
    Vibration.vibrate(10);
    swipeableRef.current?.close();
    onDelete();
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeOpen}
      rightThreshold={80}
      overshootRight={false}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  deleteContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 12,
    marginLeft: 8,
  },
});
