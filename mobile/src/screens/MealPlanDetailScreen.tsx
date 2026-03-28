import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { apiClient } from '../api/client';
import {
  addMealPlanEntry,
  removeMealPlanEntry,
  fetchMealPlanShoppingList,
} from '../api/mealPlans';
import { fetchSavedRecipes } from '../api/recipes';
import { MealPlan, Recipe } from '../types';
import { parseRecipeJson } from '../utils/parseRecipe';
import { scheduleMealPlanReminders } from '../services/notifications';
import { PlanTrackStackParamList, PlanTrackStackNavigationProp } from '../types/navigation';
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];

export default function MealPlanDetailScreen() {
  const route = useRoute<RouteProp<PlanTrackStackParamList, 'MealPlanDetail'>>();
  const navigation = useNavigation<PlanTrackStackNavigationProp>();
  const { colors } = useTheme();
  const { planId } = route.params;

  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingList, setGeneratingList] = useState(false);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMealType, setSelectedMealType] = useState('');
  const [addingEntry, setAddingEntry] = useState(false);

  // Recipe picker state
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  const loadPlan = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ meal_plan: any }>(
        `/api/meal_plans/${planId}`
      );
      const parsed = parseMealPlan(response.meal_plan);
      setPlan(parsed);
      scheduleMealPlanReminders(parsed).catch(() => {});
    } catch (error) {
      Alert.alert('Error', 'Failed to load meal plan');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const parseMealPlan = (planData: any): MealPlan => {
    return {
      ...planData,
      meal_plan_entries: (planData.meal_plan_entries || []).map((entry: any) => ({
        ...entry,
        saved_recipe: entry.saved_recipe ? parseRecipeJson(entry.saved_recipe) : undefined,
      })),
    };
  };

  useEffect(() => {
    loadPlan();
  }, [planId]);

  const getDatesArray = () => {
    if (!plan) return [];
    const dates: Date[] = [];
    const startDate = new Date(plan.start_date);

    for (let i = 0; i < plan.num_days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }

    return dates;
  };

  const getEntriesForDate = (date: Date) => {
    if (!plan) return {};

    const dateStr = date.toISOString().split('T')[0];
    const entries: Record<string, any> = {};

    plan.meal_plan_entries.forEach((entry) => {
      if (entry.date === dateStr) {
        entries[entry.meal_type] = entry;
      }
    });

    return entries;
  };

  const handleAddMeal = (date: Date, mealType: string) => {
    setSelectedDate(date.toISOString().split('T')[0]);
    setSelectedMealType(mealType);
    setShowAddModal(true);
  };

  const handleAddEatingOut = async () => {
    try {
      setAddingEntry(true);
      await addMealPlanEntry(planId, {
        date: selectedDate,
        mealType: selectedMealType,
        eatingOut: true,
        note: 'Eating out',
      });
      setShowAddModal(false);
      await loadPlan();
    } catch (error) {
      Alert.alert('Error', 'Failed to add entry');
      console.error(error);
    } finally {
      setAddingEntry(false);
    }
  };

  const handlePickRecipe = async () => {
    try {
      setLoadingRecipes(true);
      const recipes = await fetchSavedRecipes();
      setSavedRecipes(recipes);
      setShowRecipePicker(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load recipes');
      console.error(error);
    } finally {
      setLoadingRecipes(false);
    }
  };

  const handleSelectRecipe = async (recipe: Recipe) => {
    try {
      setAddingEntry(true);
      setShowRecipePicker(false);
      await addMealPlanEntry(planId, {
        date: selectedDate,
        mealType: selectedMealType,
        savedRecipeId: recipe.id,
      });
      setShowAddModal(false);
      await loadPlan();
    } catch (error) {
      Alert.alert('Error', 'Failed to add recipe');
      console.error(error);
    } finally {
      setAddingEntry(false);
    }
  };

  const handleRemoveEntry = (entryId: number) => {
    Alert.alert('Remove Meal', 'Remove this meal from your plan?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeMealPlanEntry(planId, entryId);
            await loadPlan();
          } catch (error) {
            Alert.alert('Error', 'Failed to remove entry');
            console.error(error);
          }
        },
      },
    ]);
  };

  const handleRecipePress = (recipe: Recipe) => {
    navigation.navigate('RecipeDetail', { recipe, fromSaved: true });
  };

  const handleGenerateShoppingList = async () => {
    try {
      setGeneratingList(true);
      const response = await fetchMealPlanShoppingList(planId);
      const itemsList = response.items
        .map((item) => `• ${item.name}${item.amount ? ': ' + item.amount : ''}`)
        .join('\n');

      Alert.alert(
        'Shopping List',
        itemsList || 'No items needed',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to generate shopping list');
      console.error(error);
    } finally {
      setGeneratingList(false);
    }
  };

  const formatDateHeader = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Meal plan not found</Text>
      </View>
    );
  }

  const dates = getDatesArray();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.planTitle, { color: colors.text }]}>{plan.name}</Text>
          <Text style={[styles.planSubtitle, { color: colors.textSecondary }]}>
            {plan.num_days} days • {plan.meal_plan_entries.length} meals planned
          </Text>
        </View>

        {dates.map((date, index) => {
          const entries = getEntriesForDate(date);

          return (
            <View key={index} style={styles.dateSection}>
              <Text style={[styles.dateHeader, { color: colors.text, borderBottomColor: colors.border }]}>{formatDateHeader(date)}</Text>

              {MEAL_TYPES.map((mealType) => {
                const entry = entries[mealType];

                return (
                  <View key={mealType} style={styles.mealSlot}>
                    <Text style={[styles.mealTypeLabel, { color: colors.textSecondary }]}>
                      {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                    </Text>

                    {entry ? (
                      <View style={[styles.mealEntryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        {entry.saved_recipe ? (
                          <TouchableOpacity
                            style={styles.mealEntryContent}
                            onPress={() => handleRecipePress(entry.saved_recipe)}
                          >
                            <Text style={[styles.mealEntryName, { color: colors.text }]}>
                              {entry.saved_recipe.name}
                            </Text>
                            <Text style={[styles.mealEntryHint, { color: colors.textSecondary }]}>
                              Tap to view recipe
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.mealEntryContent}>
                            <Text style={[styles.mealEntryName, { color: colors.text }]}>
                              {entry.note || 'Eating out'}
                            </Text>
                          </View>
                        )}

                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => handleRemoveEntry(entry.id)}
                        >
                          <Text style={[styles.removeButtonText, { color: colors.textSecondary }]}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.addMealButton, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                        onPress={() => handleAddMeal(date, mealType)}
                      >
                        <Text style={[styles.addMealButtonText, { color: colors.textSecondary }]}>+ Add meal</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}

        <TouchableOpacity
          style={[styles.shoppingListButton, { backgroundColor: colors.primary }, generatingList && styles.buttonDisabled]}
          onPress={handleGenerateShoppingList}
          disabled={generatingList}
        >
          {generatingList ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.shoppingListButtonText}>Generate Shopping List</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Add Meal Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Meal</Text>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.surface, borderColor: colors.primary }, loadingRecipes && styles.buttonDisabled]}
              onPress={handlePickRecipe}
              disabled={loadingRecipes || addingEntry}
            >
              {loadingRecipes ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={[styles.modalButtonText, { color: colors.primary }]}>Pick from Saved Recipes</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.surface, borderColor: colors.primary }, addingEntry && styles.buttonDisabled]}
              onPress={handleAddEatingOut}
              disabled={addingEntry || loadingRecipes}
            >
              {addingEntry && !showRecipePicker ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={[styles.modalButtonText, { color: colors.primary }]}>Eating Out</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={[styles.modalCancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Recipe Picker Modal */}
      <Modal
        visible={showRecipePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRecipePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.recipePickerContent, { backgroundColor: colors.surface }]}>
            <View style={styles.recipePickerHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Recipe</Text>
              <TouchableOpacity onPress={() => setShowRecipePicker(false)}>
                <Text style={[styles.closeButton, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={savedRecipes}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.recipePickerItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleSelectRecipe(item)}
                >
                  <Text style={[styles.recipePickerItemName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.recipePickerItemDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.description}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyRecipes}>
                  <Text style={[styles.emptyRecipesText, { color: colors.textSecondary }]}>No saved recipes</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  planSubtitle: {
    fontSize: 14,
  },
  dateSection: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  mealSlot: {
    marginBottom: 12,
  },
  mealTypeLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  mealEntryCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealEntryContent: {
    flex: 1,
  },
  mealEntryName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  mealEntryHint: {
    fontSize: 12,
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
  removeButtonText: {
    fontSize: 18,
  },
  addMealButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 12,
    alignItems: 'center',
  },
  addMealButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  shoppingListButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  shoppingListButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalCancelButton: {
    padding: 14,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  recipePickerContent: {
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  recipePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    fontSize: 24,
    padding: 4,
  },
  recipePickerItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  recipePickerItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  recipePickerItemDesc: {
    fontSize: 14,
  },
  emptyRecipes: {
    padding: 32,
    alignItems: 'center',
  },
  emptyRecipesText: {
    fontSize: 16,
  },
});
