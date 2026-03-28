import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import {
  fetchMealPlans,
  createMealPlan,
  deleteMealPlan,
  autoGenerateMealPlan,
} from '../api/mealPlans';
import { MealPlan } from '../types';
import useAsyncData from '../hooks/useAsyncData';
import SkeletonLoader from '../components/SkeletonLoader';
import { sharedStyles } from '../styles/shared';
import { PlanTrackStackNavigationProp } from '../types/navigation';

export default function MealPlannerScreen() {
  const navigation = useNavigation<PlanTrackStackNavigationProp>();
  const { colors } = useTheme();
  const [creating, setCreating] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [planName, setPlanName] = useState('');
  const [numDays, setNumDays] = useState('7');

  const fetchPlans = useCallback(() => fetchMealPlans(), []);

  const { data: plans, loading, refreshing, refresh, reload } = useAsyncData<MealPlan[]>({
    fetchFn: fetchPlans,
    errorMessage: 'Failed to load meal plans',
  });

  const handleCreatePlan = async () => {
    if (!planName.trim()) {
      Alert.alert('Error', 'Please enter a plan name');
      return;
    }

    const days = parseInt(numDays, 10);
    if (isNaN(days) || days < 1 || days > 365) {
      Alert.alert('Error', 'Please enter a valid number of days (1-365)');
      return;
    }

    try {
      setCreating(true);
      const today = new Date().toISOString().split('T')[0];
      await createMealPlan(planName.trim(), today, days);
      setPlanName('');
      setNumDays('7');
      await reload();
    } catch (error) {
      Alert.alert('Error', 'Failed to create meal plan');
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const handleAutoGenerate = async () => {
    try {
      setAutoGenerating(true);
      await autoGenerateMealPlan();
      await reload();
      Alert.alert('Success', 'AI-generated meal plan created!');
    } catch (error) {
      Alert.alert('Error', 'Failed to auto-generate meal plan');
      console.error(error);
    } finally {
      setAutoGenerating(false);
    }
  };

  const handleDeletePlan = (id: number, name: string) => {
    Alert.alert('Delete Plan', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMealPlan(id);
            await reload();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete meal plan');
            console.error(error);
          }
        },
      },
    ]);
  };

  const handlePlanPress = (plan: MealPlan) => {
    navigation.navigate('MealPlanDetail', { planId: plan.id });
  };

  const formatDateRange = (plan: MealPlan) => {
    const startDate = new Date(plan.start_date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.num_days - 1);

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  const renderPlanCard = ({ item }: { item: MealPlan }) => (
    <TouchableOpacity style={[sharedStyles.card, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} onPress={() => handlePlanPress(item)}>
      <View style={styles.planContent}>
        <Text style={[styles.planName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.planDateRange, { color: colors.textSecondary }]}>{formatDateRange(item)}</Text>
        <Text style={[styles.planEntries, { color: colors.textSecondary }]}>
          {item.meal_plan_entries?.length || 0} meals planned
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeletePlan(item.id, item.name)}
      >
        <Text style={[styles.deleteButtonText, { color: colors.textSecondary }]}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (loading) return null;
    return (
      <View style={sharedStyles.emptyState}>
        <Text style={[sharedStyles.emptyStateTitle, { color: colors.text }]}>No meal plans yet</Text>
        <Text style={[sharedStyles.emptyStateSubtitle, { color: colors.textSecondary }]}>
          Create a plan to organize your weekly meals
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[sharedStyles.flex1, { backgroundColor: colors.background, padding: 16 }]}>
        <SkeletonLoader lines={4} style={{ marginBottom: 16 }} />
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonLoader key={i} lines={3} style={{ marginBottom: 12 }} />
        ))}
      </View>
    );
  }

  return (
    <View style={[sharedStyles.flex1, { backgroundColor: colors.background }]}>
      <FlatList
        data={plans}
        renderItem={renderPlanCard}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View style={[styles.createSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[sharedStyles.sectionTitle, { color: colors.text, fontSize: 18, fontWeight: '600' }]}>Create Meal Plan</Text>

            <TextInput
              style={[sharedStyles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface, marginBottom: 16 }]}
              placeholder="Plan name (e.g., Week of March 27)"
              value={planName}
              onChangeText={setPlanName}
              placeholderTextColor={colors.textSecondary}
            />

            <View style={styles.planOptionsRow}>
              <View style={[styles.dateDisplay, { borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Start Date</Text>
                <Text style={[styles.dateValue, { color: colors.text }]}>
                  {new Date().toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              <View style={[styles.daysInput, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Days</Text>
                <TextInput
                  style={[styles.daysTextInput, { color: colors.text }]}
                  value={numDays}
                  onChangeText={setNumDays}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[sharedStyles.primaryButton, { backgroundColor: colors.primary, marginBottom: 12 }, creating && sharedStyles.buttonDisabled]}
              onPress={handleCreatePlan}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={sharedStyles.primaryButtonText}>Create Plan</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.autoButton, { backgroundColor: colors.surface, borderColor: colors.primary }, autoGenerating && sharedStyles.buttonDisabled]}
              onPress={handleAutoGenerate}
              disabled={autoGenerating}
            >
              {autoGenerating ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={[styles.autoButtonText, { color: colors.primary }]}>Auto-Generate from Saved Recipes</Text>
              )}
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={sharedStyles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  createSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  planOptionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateDisplay: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  dateLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 16,
  },
  daysInput: {
    width: 100,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  daysTextInput: {
    fontSize: 16,
    padding: 0,
    margin: 0,
  },
  autoButton: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderWidth: 1,
  },
  autoButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  planContent: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  planDateRange: {
    fontSize: 14,
    marginBottom: 4,
  },
  planEntries: {
    fontSize: 13,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteButtonText: {
    fontSize: 20,
  },
});
