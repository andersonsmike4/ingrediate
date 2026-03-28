import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { theme } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { saveRecipe, deleteSavedRecipe, shareRecipe } from '../api/recipes';
import { Recipe } from '../types';
import { HomeStackParamList, PlanTrackStackParamList } from '../types/navigation';

export default function RecipeDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<HomeStackParamList, 'RecipeDetail'> | RouteProp<PlanTrackStackParamList, 'RecipeDetail'>>();
  const { colors } = useTheme();
  const { recipe, fromSaved = false } = route.params;
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: recipe.name });
  }, [navigation, recipe.name]);

  const isSaved = recipe.id && fromSaved;

  const handleSaveRecipe = async () => {
    setIsSaving(true);
    try {
      await saveRecipe(recipe);
      Alert.alert('Success', 'Recipe saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save recipe. Please try again.');
      console.error('Failed to save recipe:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareRecipe = async () => {
    try {
      if (!recipe.id) {
        Alert.alert('Error', 'Please save the recipe first to share it.');
        return;
      }

      // Get share URL from API
      const { share_url } = await shareRecipe(recipe.id);

      // Create deep link
      const deepLink = Linking.createURL(`shared/${recipe.id}`);
      const message = `Check out this recipe: ${recipe.name}\n\n${recipe.description}\n\n${share_url}`;

      // Use React Native's built-in Share API
      await Share.share({
        message,
        title: recipe.name,
      });
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Share error:', error);
        Alert.alert('Error', 'Failed to share recipe.');
      }
    }
  };

  const handleDeleteRecipe = () => {
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (recipe.id) {
                await deleteSavedRecipe(recipe.id);
                navigation.goBack();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete recipe. Please try again.');
              console.error('Failed to delete recipe:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{recipe.name}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{recipe.description}</Text>
        </View>

        {/* Info Pills */}
        <View style={styles.pillsRow}>
          <View style={[styles.pill, { backgroundColor: colors.orange100 }]}>
            <Text style={[styles.pillText, { color: colors.orange700 }]}>{recipe.cook_time}</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: colors.orange100 }]}>
            <Text style={[styles.pillText, { color: colors.orange700 }]}>{recipe.difficulty}</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: colors.orange100 }]}>
            <Text style={[styles.pillText, { color: colors.orange700 }]}>{recipe.servings} servings</Text>
          </View>
        </View>

        {/* Nutrition Card */}
        {recipe.nutrition && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.orange100 }]}>
            <Text style={[styles.sectionTitle, { color: colors.stone900 }]}>Nutrition</Text>
            <View style={styles.nutritionGrid}>
              {recipe.nutrition.calories !== undefined && (
                <View style={[styles.nutritionItem, { backgroundColor: colors.surface, borderColor: colors.stone200 }]}>
                  <Text style={[styles.nutritionValue, { color: colors.stone900 }]}>{recipe.nutrition.calories}</Text>
                  <Text style={[styles.nutritionLabel, { color: colors.stone500 }]}>Calories</Text>
                </View>
              )}
              {recipe.nutrition.protein && (
                <View style={[styles.nutritionItem, { backgroundColor: colors.surface, borderColor: colors.stone200 }]}>
                  <Text style={[styles.nutritionValue, { color: colors.stone900 }]}>{recipe.nutrition.protein}</Text>
                  <Text style={[styles.nutritionLabel, { color: colors.stone500 }]}>Protein</Text>
                </View>
              )}
              {recipe.nutrition.carbs && (
                <View style={[styles.nutritionItem, { backgroundColor: colors.surface, borderColor: colors.stone200 }]}>
                  <Text style={[styles.nutritionValue, { color: colors.stone900 }]}>{recipe.nutrition.carbs}</Text>
                  <Text style={[styles.nutritionLabel, { color: colors.stone500 }]}>Carbs</Text>
                </View>
              )}
              {recipe.nutrition.fat && (
                <View style={[styles.nutritionItem, { backgroundColor: colors.surface, borderColor: colors.stone200 }]}>
                  <Text style={[styles.nutritionValue, { color: colors.stone900 }]}>{recipe.nutrition.fat}</Text>
                  <Text style={[styles.nutritionLabel, { color: colors.stone500 }]}>Fat</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Ingredients Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.orange100 }]}>
          <Text style={[styles.sectionTitle, { color: colors.stone900 }]}>
            Ingredients ({recipe.ingredients.length})
          </Text>
          {recipe.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientRow}>
              <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
              <Text style={[styles.ingredientText, { color: colors.stone900 }]}>
                {ingredient.amount} {ingredient.name}
              </Text>
            </View>
          ))}
        </View>

        {/* Steps Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.orange100 }]}>
          <Text style={[styles.sectionTitle, { color: colors.stone900 }]}>Instructions</Text>
          {recipe.steps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={[styles.stepNumber, { backgroundColor: colors.orange600 }]}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.stone700 }]}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Substitutions Section */}
        {recipe.substitutions && recipe.substitutions.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.orange100 }]}>
            <Text style={[styles.sectionTitle, { color: colors.stone900 }]}>Substitutions</Text>
            {recipe.substitutions.map((substitution, index) => (
              <View key={index} style={[styles.substitutionCard, { backgroundColor: colors.orange50, borderColor: colors.orange100 }]}>
                <Text style={[styles.substitutionText, { color: colors.stone900 }]}>
                  {substitution.original} → {substitution.replacement}
                </Text>
                <Text style={[styles.substitutionReason, { color: colors.stone700 }]}>{substitution.reason}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!isSaved ? (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.orange600 }, isSaving && styles.buttonDisabled]}
              onPress={handleSaveRecipe}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel="Save recipe"
              accessibilityHint="Save recipe to your collection"
            >
              <Text style={styles.buttonText}>
                {isSaving ? 'Saving...' : 'Save Recipe'}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.blue500 }]}
                onPress={handleShareRecipe}
                accessibilityRole="button"
                accessibilityLabel="Share recipe"
                accessibilityHint="Share this recipe with others"
              >
                <Text style={styles.buttonText}>Share Recipe</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.red600 }]}
                onPress={handleDeleteRecipe}
                accessibilityRole="button"
                accessibilityLabel="Delete recipe"
                accessibilityHint="Remove this recipe from your collection"
              >
                <Text style={styles.buttonText}>Delete Recipe</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  pill: {
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
  },
  section: {
    marginBottom: 28,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  nutritionItem: {
    flex: 1,
    minWidth: '22%',
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    fontWeight: '400',
  },
  ingredientRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  ingredientText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 24,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
  },
  substitutionCard: {
    borderRadius: theme.borderRadius.md,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  substitutionText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  substitutionReason: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    marginTop: 8,
  },
  button: {
    borderRadius: theme.borderRadius.md,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
  },
  shareButton: {
  },
});
