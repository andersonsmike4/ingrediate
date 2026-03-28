import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fetchAchievements } from '../api/achievements';
import { Achievement } from '../types';
import useAsyncData from '../hooks/useAsyncData';
import SkeletonLoader from '../components/SkeletonLoader';
import { sharedStyles } from '../styles/shared';
import { formatDate } from '../utils/formatters';

export default function AchievementsScreen() {
  const { colors } = useTheme();

  const fetchSorted = useCallback(async () => {
    const response: any = await fetchAchievements();
    const data = response.achievements || response;
    return [...data].sort((a: any, b: any) => {
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;
      return 0;
    });
  }, []);

  const { data: achievements, loading, refreshing, refresh } = useAsyncData<Achievement[]>({
    fetchFn: fetchSorted,
    errorMessage: 'Failed to load achievements',
  });

  const renderAchievement = ({ item }: { item: Achievement }) => (
    <View style={[sharedStyles.card, { backgroundColor: item.unlocked ? colors.surface : colors.surfaceSecondary, borderColor: colors.border }, !item.unlocked && styles.achievementLocked]}>
      <View style={styles.achievementHeader}>
        <Text style={styles.icon}>{item.icon}</Text>
        <View style={styles.achievementInfo}>
          <Text style={[styles.achievementName, { color: item.unlocked ? colors.text : colors.textSecondary }]}>
            {item.name}
          </Text>
          <Text style={[styles.achievementDescription, { color: colors.textSecondary }]}>
            {item.description}
          </Text>
        </View>
      </View>
      <View style={styles.achievementFooter}>
        <Text style={[styles.points, { color: item.unlocked ? colors.primary : colors.textSecondary }]}>
          {item.points} points
        </Text>
        {item.unlocked && item.unlocked_at && (
          <View style={[styles.unlockedBadge, { backgroundColor: colors.success }]}>
            <Text style={styles.unlockedText}>Unlocked {formatDate(item.unlocked_at)}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[sharedStyles.flex1, { backgroundColor: colors.background, padding: 16 }]}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonLoader key={i} lines={3} style={{ marginBottom: 12 }} />
        ))}
      </View>
    );
  }

  return (
    <View style={[sharedStyles.flex1, { backgroundColor: colors.background }]}>
      <FlatList
        data={achievements}
        renderItem={renderAchievement}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={sharedStyles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  achievementLocked: {
    opacity: 0.5,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  achievementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  points: {
    fontSize: 14,
    fontWeight: '600',
  },
  unlockedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  unlockedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
