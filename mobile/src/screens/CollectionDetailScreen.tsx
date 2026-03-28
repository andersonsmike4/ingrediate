import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { fetchCollection, removeRecipeFromCollection } from '../api/collections';
import { Collection, Recipe } from '../types';
import { HomeStackParamList, HomeStackNavigationProp } from '../types/navigation';

export default function CollectionDetailScreen() {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const route = useRoute<RouteProp<HomeStackParamList, 'CollectionDetail'>>();
  const { colors } = useTheme();
  const { collectionId, collectionName } = route.params;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: collectionName,
    });
  }, [navigation, collectionName]);

  const loadCollection = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await fetchCollection(collectionId);
      setCollection(data.collection);
    } catch (error) {
      console.error('Failed to load collection:', error);
      Alert.alert('Error', 'Failed to load collection. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCollection();
    }, [collectionId])
  );

  const handleRemoveRecipe = (recipeId: number, recipeName: string) => {
    Alert.alert(
      'Remove Recipe',
      `Are you sure you want to remove "${recipeName}" from this collection?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeRecipeFromCollection(collectionId, recipeId);
              await loadCollection();
              Alert.alert('Success', 'Recipe removed from collection');
            } catch (error) {
              console.error('Failed to remove recipe:', error);
              Alert.alert('Error', 'Failed to remove recipe. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleRecipePress = (recipe: Recipe) => {
    navigation.navigate('RecipeDetail', { recipe });
  };

  const renderRecipeCard = ({ item }: { item: Recipe }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => handleRecipePress(item)}
      >
        <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.cardDescription, { color: colors.textSecondary }]} numberOfLines={2} ellipsizeMode="tail">
          {item.description}
        </Text>
        <View style={styles.pillsRow}>
          <View style={[styles.pill, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.pillText, { color: colors.textSecondary }]}>{item.cook_time}</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.pillText, { color: colors.textSecondary }]}>{item.difficulty}</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.pillText, { color: colors.textSecondary }]}>{item.servings} servings</Text>
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.removeButton, { backgroundColor: colors.error }]}
        onPress={() => handleRemoveRecipe(item.id!, item.name)}
      >
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyState}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No recipes in this collection</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Add recipes from your saved recipes
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={collection?.recipes || []}
        renderItem={renderRecipeCard}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadCollection(true)}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    marginBottom: 12,
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
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  removeButton: {
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});
