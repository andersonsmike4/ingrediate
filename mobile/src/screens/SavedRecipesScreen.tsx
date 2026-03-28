import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { theme } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { fetchSavedRecipes } from '../api/recipes';
import { Recipe } from '../types';
import { cacheSavedRecipes, getCachedSavedRecipes, isOnline } from '../services/offlineCache';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import AnimatedListItem from '../components/AnimatedListItem';
import { HomeStackNavigationProp } from '../types/navigation';

export default function SavedRecipesScreen() {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { colors } = useTheme();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadRecipes = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await fetchSavedRecipes();
      setRecipes(data);
      filterRecipes(data, searchText);
      // Cache for offline use
      cacheSavedRecipes(data);
    } catch (error) {
      // Fall back to cached data when offline
      const online = await isOnline();
      if (!online) {
        const cached = await getCachedSavedRecipes();
        setRecipes(cached);
        filterRecipes(cached, searchText);
      } else {
        console.error('Failed to load saved recipes:', error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRecipes();
    }, [])
  );

  const filterRecipes = (recipeList: Recipe[], search: string) => {
    if (search.trim() === '') {
      setFilteredRecipes(recipeList);
    } else {
      const filtered = recipeList.filter((recipe) =>
        recipe.name.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredRecipes(filtered);
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    filterRecipes(recipes, text);
  };

  const handleRecipePress = (recipe: Recipe) => {
    navigation.navigate('RecipeDetail', { recipe, fromSaved: true });
  };

  const renderRecipeCard = ({ item, index }: { item: Recipe; index: number }) => (
    <AnimatedListItem index={index}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.orange100 }]}
        onPress={() => handleRecipePress(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}: ${item.description}`}
        accessibilityHint="Double tap to view recipe details"
      >
        <Text style={[styles.cardTitle, { color: colors.stone900 }]}>{item.name}</Text>
        <Text style={[styles.cardDescription, { color: colors.stone700 }]} numberOfLines={2} ellipsizeMode="tail">
          {item.description}
        </Text>
        <View style={styles.pillsRow}>
          <View style={[styles.pill, { backgroundColor: colors.orange100 }]}>
            <Text style={[styles.pillText, { color: colors.orange700 }]}>{item.cook_time}</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: colors.orange100 }]}>
            <Text style={[styles.pillText, { color: colors.orange700 }]}>{item.difficulty}</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: colors.orange100 }]}>
            <Text style={[styles.pillText, { color: colors.orange700 }]}>{item.servings} servings</Text>
          </View>
        </View>
      </TouchableOpacity>
    </AnimatedListItem>
  );

  const renderEmptyState = () => {
    if (loading) return null;
    return (
      <EmptyState
        icon="bookmark-outline"
        title="No saved recipes yet"
        subtitle="Save recipes from the Recipes tab"
      />
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ padding: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLoader key={i} lines={3} showImage style={{ marginBottom: 16 }} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.surface, borderColor: colors.inputBorder, color: colors.text }]}
          placeholder="Search recipes..."
          value={searchText}
          onChangeText={handleSearch}
          placeholderTextColor={colors.textSecondary}
          accessibilityRole="search"
          accessibilityLabel="Search saved recipes"
        />
        <TouchableOpacity
          style={[styles.collectionsButton, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
          onPress={() => (navigation as any).navigate('Collections')}
          accessibilityRole="button"
          accessibilityLabel="Collections"
          accessibilityHint="View and manage recipe collections"
        >
          <Ionicons name="folder-outline" size={20} color={colors.primary} />
          <Text style={[styles.collectionsButtonText, { color: colors.text }]}>Collections</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredRecipes}
        renderItem={renderRecipeCard}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        windowSize={5}
        maxToRenderPerBatch={10}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadRecipes(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    padding: 12,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    borderRadius: theme.borderRadius.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  collectionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    gap: 10,
  },
  collectionsButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
});
