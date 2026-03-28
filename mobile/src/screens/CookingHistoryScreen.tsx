import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fetchCookingLogs } from '../api/cookingLogs';
import { CookingLog } from '../types';
import useAsyncData from '../hooks/useAsyncData';
import SkeletonLoader from '../components/SkeletonLoader';
import { sharedStyles } from '../styles/shared';
import { formatDate } from '../utils/formatters';
import { PlanTrackStackNavigationProp } from '../types/navigation';

interface CookingHistoryScreenProps {
  navigation: PlanTrackStackNavigationProp;
}

export default function CookingHistoryScreen({ navigation }: CookingHistoryScreenProps) {
  const { colors } = useTheme();

  const fetchSorted = useCallback(async () => {
    const data = await fetchCookingLogs();
    return [...data].sort((a, b) =>
      new Date(b.cooked_at).getTime() - new Date(a.cooked_at).getTime()
    );
  }, []);

  const { data: logs, loading, refreshing, refresh } = useAsyncData<CookingLog[]>({
    fetchFn: fetchSorted,
    errorMessage: 'Failed to load cooking history',
  });

  const handleLogPress = (log: CookingLog) => {
    if (log.saved_recipe) {
      navigation.navigate('RecipeDetail', { recipe: log.saved_recipe });
    }
  };

  const renderLog = ({ item }: { item: CookingLog }) => (
    <TouchableOpacity
      style={[sharedStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleLogPress(item)}
    >
      <View style={styles.logContent}>
        <Text style={[styles.recipeName, { color: colors.text }]}>
          {item.saved_recipe?.name || 'Unknown Recipe'}
        </Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>{formatDate(item.cooked_at)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[sharedStyles.flex1, { backgroundColor: colors.background, padding: 16 }]}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonLoader key={i} lines={2} style={{ marginBottom: 12 }} />
        ))}
      </View>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <View style={[sharedStyles.centerContainer, { backgroundColor: colors.background, padding: 32 }]}>
        <Text style={[sharedStyles.emptyStateTitle, { color: colors.text }]}>No cooking history yet</Text>
        <Text style={[sharedStyles.emptyStateSubtitle, { color: colors.textSecondary }]}>
          Start cooking recipes to build your history
        </Text>
      </View>
    );
  }

  return (
    <View style={[sharedStyles.flex1, { backgroundColor: colors.background }]}>
      <FlatList
        data={logs}
        renderItem={renderLog}
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
  logContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  date: {
    fontSize: 14,
  },
});
