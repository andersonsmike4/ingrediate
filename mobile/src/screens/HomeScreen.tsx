import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Modal,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { generateRecipes, searchByMealName, analyzePhoto, saveRecipe } from '../api/recipes';
import { Recipe, RecipeFilters } from '../types';
import SavedRecipesScreen from './SavedRecipesScreen';
import { HomeTabNavigationProp } from '../types/navigation';

export default function HomeScreen() {
  const navigation = useNavigation<HomeTabNavigationProp>();
  const route = useRoute();
  const { colors, borderRadius, spacing } = useTheme();

  // Tab state
  const [activeTab, setActiveTab] = useState<'discover' | 'saved'>('discover');

  // Input states
  const [ingredients, setIngredients] = useState('');
  const [mealName, setMealName] = useState('');

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [dietary, setDietary] = useState<string>('');
  const [cuisine, setCuisine] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');

  // Results states
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [savingRecipeId, setSavingRecipeId] = useState<string | null>(null);

  useEffect(() => {
    const params = route.params as { scannedIngredients?: string[] } | undefined;
    if (params?.scannedIngredients) {
      setIngredients(params.scannedIngredients.join(', '));
      // Clear the params
      (navigation as any).setParams({ scannedIngredients: undefined });
    }
  }, [route.params]);

  const handleGenerateRecipes = async () => {
    if (!ingredients.trim()) {
      Alert.alert('Missing Ingredients', 'Please enter some ingredients first.');
      return;
    }

    setLoading(true);
    setRecipes([]);

    try {
      const ingredientsArray = ingredients.split(',').map(i => i.trim()).filter(i => i);

      const filters: RecipeFilters = {};
      if (dietary) filters.dietary = dietary;
      if (cuisine) filters.cuisine = cuisine;
      if (difficulty) filters.difficulty = difficulty;

      const results = await generateRecipes(ingredientsArray, filters);
      setRecipes(results);

      if (results.length === 0) {
        Alert.alert('No Results', 'No recipes found. Try different ingredients or filters.');
      }
    } catch (error: any) {
      console.error('Generate recipes error:', error);
      Alert.alert('Error', error.message || 'Failed to generate recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleScanIngredients = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setLoading(true);

        try {
          const fileName = asset.uri.split('/').pop() || 'photo.jpg';
          const mimeType = asset.type === 'image' ? 'image/jpeg' : 'image/jpeg';

          const extractedIngredients = await analyzePhoto(asset.uri, fileName, mimeType);

          if (extractedIngredients && extractedIngredients.length > 0) {
            setIngredients(extractedIngredients.join(', '));
            Alert.alert('Success', `Found ${extractedIngredients.length} ingredients!`);
          } else {
            Alert.alert('No Ingredients Found', 'Could not detect ingredients in this photo.');
          }
        } catch (error: any) {
          console.error('Photo analysis error:', error);
          Alert.alert('Error', error.message || 'Failed to analyze photo. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    } catch (error: any) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to open photo library.');
    }
  };

  const handleSearchByMeal = async () => {
    if (!mealName.trim()) {
      Alert.alert('Missing Meal Name', 'Please enter a meal name to search.');
      return;
    }

    setLoading(true);
    setRecipes([]);

    try {
      const results = await searchByMealName(mealName);
      setRecipes(results);

      if (results.length === 0) {
        Alert.alert('No Results', 'No recipes found for this meal name.');
      }
    } catch (error: any) {
      console.error('Search by meal error:', error);
      Alert.alert('Error', error.message || 'Failed to search recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    const recipeKey = recipe.id?.toString() || recipe.name;
    setSavingRecipeId(recipeKey);

    try {
      await saveRecipe(recipe);
      Alert.alert('Success', `"${recipe.name}" has been saved to your collection!`);
    } catch (error: any) {
      console.error('Save recipe error:', error);
      Alert.alert('Error', error.message || 'Failed to save recipe. Please try again.');
    } finally {
      setSavingRecipeId(null);
    }
  };

  const handleViewDetails = (recipe: Recipe) => {
    navigation.navigate('RecipeDetail', { recipe });
  };

  const renderPillButton = (
    label: string,
    value: string,
    currentValue: string,
    onPress: (val: string) => void
  ) => {
    const isSelected = currentValue === value;
    return (
      <TouchableOpacity
        key={value}
        style={[
          styles.pillButton,
          { backgroundColor: colors.surfaceSecondary },
          isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
        ]}
        onPress={() => onPress(isSelected ? '' : value)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: isSelected }}
      >
        <Text style={[
          styles.pillText,
          { color: colors.stone700 },
          isSelected && { color: '#FFFFFF', fontWeight: '600' }
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderRecipeCard = ({ item }: { item: Recipe }) => {
    const recipeKey = item.id?.toString() || item.name;
    const isSaving = savingRecipeId === recipeKey;

    return (
      <View style={[styles.recipeCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <Text style={[styles.recipeName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.recipeDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.recipeMetaRow}>
          <View style={[styles.metaPill, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.metaPillText, { color: colors.orange700 }]}>{item.cook_time}</Text>
          </View>
          <View style={[styles.metaPill, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.metaPillText, { color: colors.orange700 }]}>{item.difficulty}</Text>
          </View>
          <View style={[styles.metaPill, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.metaPillText, { color: colors.orange700 }]}>{item.servings} servings</Text>
          </View>
        </View>

        <Text style={[styles.ingredientsCount, { color: colors.textSecondary }]}>
          {item.ingredients.length} ingredients
        </Text>

        <View style={styles.recipeActions}>
          <TouchableOpacity
            style={[styles.viewDetailsButton, { backgroundColor: colors.surface, borderColor: colors.inputBorder }]}
            onPress={() => handleViewDetails(item)}
            accessibilityRole="button"
            accessibilityLabel={`View details for ${item.name}`}
          >
            <Text style={[styles.viewDetailsText, { color: colors.stone700 }]}>View Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }, isSaving && styles.saveButtonDisabled]}
            onPress={() => handleSaveRecipe(item)}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel={`Save ${item.name}`}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Fixed header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.primary }]}>Recipes</Text>
          <TouchableOpacity
            onPress={() => (navigation as any).navigate('Preferences')}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            accessibilityHint="Opens settings and preferences"
          >
            <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Find and save your favorite recipes
        </Text>
        {/* Segmented control */}
        <View style={[styles.segmentContainer, { backgroundColor: colors.surfaceSecondary }]}>
          <TouchableOpacity
            style={[styles.segment, activeTab === 'discover' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('discover')}
            accessibilityRole="tab"
            accessibilityLabel="Discover recipes"
            accessibilityState={{ selected: activeTab === 'discover' }}
          >
            <Text style={[styles.segmentText, { color: activeTab === 'discover' ? '#FFFFFF' : colors.text }]}>
              Discover
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segment, activeTab === 'saved' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('saved')}
            accessibilityRole="tab"
            accessibilityLabel="Saved recipes"
            accessibilityState={{ selected: activeTab === 'saved' }}
          >
            <Text style={[styles.segmentText, { color: activeTab === 'saved' ? '#FFFFFF' : colors.text }]}>
              Saved
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'discover' ? (
        <ScrollView
          style={[{ flex: 1 }]}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Ingredient Input Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Your Ingredients</Text>
        <TextInput
          style={[styles.ingredientsInput, { backgroundColor: colors.surface, borderColor: colors.inputBorder, color: colors.text }]}
          placeholder="e.g. chicken, rice, tomatoes, garlic"
          placeholderTextColor={colors.textMuted}
          value={ingredients}
          onChangeText={setIngredients}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          accessibilityLabel="Ingredients input"
          accessibilityHint="Enter ingredients separated by commas"
        />

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={handleGenerateRecipes}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Generate recipes"
          accessibilityHint="Find recipes using your ingredients"
        >
          <Text style={styles.primaryButtonText}>Generate Recipes</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.filterToggle, { backgroundColor: colors.surface, borderColor: colors.inputBorder }]}
          onPress={() => setShowFilters(!showFilters)}
          accessibilityRole="button"
          accessibilityLabel="Filters"
          accessibilityHint={showFilters ? "Collapse filter options" : "Expand filter options"}
          accessibilityState={{ expanded: showFilters }}
        >
          <Text style={[styles.filterToggleText, { color: colors.text }]}>
            Filters {showFilters ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {showFilters && (
          <View style={styles.filtersContainer}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>Dietary</Text>
            <View style={styles.pillRow}>
              {renderPillButton('None', '', dietary, setDietary)}
              {renderPillButton('Vegetarian', 'Vegetarian', dietary, setDietary)}
              {renderPillButton('Vegan', 'Vegan', dietary, setDietary)}
              {renderPillButton('Gluten-Free', 'Gluten-Free', dietary, setDietary)}
              {renderPillButton('Dairy-Free', 'Dairy-Free', dietary, setDietary)}
              {renderPillButton('Keto', 'Keto', dietary, setDietary)}
            </View>

            <Text style={[styles.filterLabel, { color: colors.text }]}>Cuisine</Text>
            <View style={styles.pillRow}>
              {renderPillButton('Any', '', cuisine, setCuisine)}
              {renderPillButton('Italian', 'Italian', cuisine, setCuisine)}
              {renderPillButton('Mexican', 'Mexican', cuisine, setCuisine)}
              {renderPillButton('Asian', 'Asian', cuisine, setCuisine)}
              {renderPillButton('Indian', 'Indian', cuisine, setCuisine)}
              {renderPillButton('Mediterranean', 'Mediterranean', cuisine, setCuisine)}
            </View>

            <Text style={[styles.filterLabel, { color: colors.text }]}>Difficulty</Text>
            <View style={styles.pillRow}>
              {renderPillButton('Any', '', difficulty, setDifficulty)}
              {renderPillButton('Easy', 'Easy', difficulty, setDifficulty)}
              {renderPillButton('Medium', 'Medium', difficulty, setDifficulty)}
              {renderPillButton('Hard', 'Hard', difficulty, setDifficulty)}
            </View>
          </View>
        )}
      </View>

      {/* OR Divider */}
      <View style={styles.dividerContainer}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      {/* Photo & Camera Buttons */}
      <View style={styles.section}>
        <View style={styles.scanButtonRow}>
          <TouchableOpacity
            style={[styles.cameraButton, { backgroundColor: colors.primary }]}
            onPress={() => (navigation as any).navigate('Camera')}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Camera"
            accessibilityHint="Open camera to scan ingredients"
          >
            <Ionicons name="camera" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.cameraButtonText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.inputBorder }]}
            onPress={handleScanIngredients}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Photo library"
            accessibilityHint="Choose photo from library to scan ingredients"
          >
            <Ionicons name="images-outline" size={18} color={colors.stone700} style={{ marginRight: 6 }} />
            <Text style={[styles.secondaryButtonText, { color: colors.stone700 }]}>Library</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.secondaryButton, { marginTop: 12, backgroundColor: colors.surface, borderColor: colors.inputBorder }]}
          onPress={() => (navigation as any).navigate('BarcodeScanner')}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Scan barcode to pantry"
          accessibilityHint="Open barcode scanner to add items to pantry"
        >
          <Ionicons name="barcode-outline" size={18} color={colors.stone700} style={{ marginRight: 6 }} />
          <Text style={[styles.secondaryButtonText, { color: colors.stone700 }]}>Scan Barcode to Pantry</Text>
        </TouchableOpacity>
      </View>

      {/* OR Divider */}
      <View style={styles.dividerContainer}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      {/* Search by Meal Name */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Search by Meal Name</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={[styles.mealNameInput, { backgroundColor: colors.surface, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="e.g. Pasta Carbonara"
            placeholderTextColor={colors.textMuted}
            value={mealName}
            onChangeText={setMealName}
            accessibilityLabel="Meal name search"
            accessibilityHint="Enter a recipe name to search"
          />
          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: colors.primary }]}
            onPress={handleSearchByMeal}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Search recipes by name"
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading Overlay */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingCard, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Generating recipes...</Text>
            <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>This may take a moment</Text>
          </View>
        </View>
      </Modal>

          {/* Recipe Results Section */}
          {!loading && recipes.length > 0 && (
            <View style={styles.resultsSection}>
              <Text style={[styles.resultsTitle, { color: colors.text }]}>
                {recipes.length} Recipe{recipes.length !== 1 ? 's' : ''} Found
              </Text>
              <FlatList
                data={recipes}
                renderItem={renderRecipeCard}
                keyExtractor={(item, index) => item.id?.toString() || `${item.name}-${index}`}
                scrollEnabled={false}
                contentContainerStyle={styles.resultsListContainer}
              />
            </View>
          )}
        </ScrollView>
      ) : (
        <SavedRecipesScreen />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 4,
    marginTop: 16,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  ingredientsInput: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
    marginBottom: 16,
  },
  primaryButton: {
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  filterToggle: {
    padding: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
  },
  filterToggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  filtersContainer: {
    marginTop: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillText: {
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scanButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cameraButton: {
    flex: 1,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cameraButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mealNameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchButton: {
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  loadingText: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: '600',
  },
  loadingSubtext: {
    marginTop: 6,
    fontSize: 14,
  },
  resultsSection: {
    padding: 20,
    paddingTop: 0,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  resultsListContainer: {
    gap: 16,
  },
  recipeCard: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  recipeName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  recipeMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metaPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  ingredientsCount: {
    fontSize: 14,
    marginBottom: 16,
  },
  recipeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  viewDetailsButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
