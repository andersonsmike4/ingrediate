import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { subscribeToNetworkChanges } from '../services/offlineCache';
import { theme } from '../theme';
import { useTheme } from '../contexts/ThemeContext';

export default function OfflineBanner() {
  const { colors } = useTheme();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToNetworkChanges((isConnected) => {
      setIsOffline(!isConnected);
    });

    return unsubscribe;
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <View style={[styles.banner, { backgroundColor: colors.error }]}>
      <Text style={styles.text}>
        You're offline - changes will sync when reconnected
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#F59E0B', // amber-500
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
