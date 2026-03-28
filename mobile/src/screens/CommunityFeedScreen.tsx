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
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { fetchFeed, likeRecipe, unlikeRecipe } from '../api/feed';
import { Recipe } from '../types';
import SkeletonLoader from '../components/SkeletonLoader';
import { sharedStyles } from '../styles/shared';
import { PlanTrackStackNavigationProp } from '../types/navigation';

export default function CommunityFeedScreen() {
  const navigation = useNavigation<PlanTrackStackNavigationProp>();
  const { colors } = useTheme();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadRecipes = async (isRefreshing = false, pageNum = 1, search = '') => {
    if (isRefreshing) {
      setRefreshing(true);
    } else if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const data = await fetchFeed({ page: pageNum, search: search || undefined });

      if (pageNum === 1) {
        setRecipes(data.recipes);
      } else {
        setRecipes((prev) => [...prev, ...data.recipes]);
      }

      setHasMore(data.recipes.length > 0);
    } catch (error) {
      console.error('Failed to load feed:', error);
      Alert.alert('Error', 'Failed to load community feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setPage(1);
      setHasMore(true);
      loadRecipes(false, 1, searchText);
    }, [])
  );

  const handleSearch = (text: string) => {
    setSearchText(text);
    setPage(1);
    setHasMore(true);
    loadRecipes(false, 1, text);
  };

  const handleRefresh = () => {
    setPage(1);
    setHasMore(true);
    loadRecipes(true, 1, searchText);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadRecipes(false, nextPage, searchText);
    }
  };

  const handleRecipePress = (recipe: Recipe) => {
    navigation.navigate('RecipeDetail', { recipe });
  };

  const handleLikeToggle = async (recipe: Recipe) => {
    if (!recipe.id) return;

    const wasLiked = recipe.user_liked;
    const originalCount = recipe.likes_count || 0;

    setRecipes((prev) =>
      prev.map((r) =>
        r.id === recipe.id
          ? {
              ...r,
              user_liked: !wasLiked,
              likes_count: wasLiked ? originalCount - 1 : originalCount + 1,
            }
          : r
      )
    );

    try {
      if (wasLiked) {
        await unlikeRecipe(recipe.id);
      } else {
        await likeRecipe(recipe.id);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === recipe.id
            ? { ...r, user_liked: wasLiked, likes_count: originalCount }
            : r
        )
      );
      Alert.alert('Error', 'Failed to update like status');
    }
  };

  const renderRecipeCard = ({ item }: { item: Recipe }) => (
    <TouchableOpacity style={[sharedStyles.cardWithShadow, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => handleRecipePress(item)}>
      <Text style={[styles.authorName, { color: colors.textSecondary }]}>Anonymous</Text>
      <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
      <Text style={[styles.cardDescription, { color: colors.textSecondary }]} numberOfLines={2} ellipsizeMode="tail">
        {item.description}
      </Text>
      <View style={sharedStyles.pillsRow}>
        <View style={[sharedStyles.pill, { backgroundColor: colors.surfaceSecondary }]}>
          <Text style={[sharedStyles.pillText, { color: colors.textSecondary }]}>{item.cook_time}</Text>
        </View>
        <View style={[sharedStyles.pill, { backgroundColor: colors.surfaceSecondary }]}>
          <Text style={[sharedStyles.pillText, { color: colors.textSecondary }]}>{item.difficulty}</Text>
        </View>
        <View style={[sharedStyles.pill, { backgroundColor: colors.surfaceSecondary }]}>
          <Text style={[sharedStyles.pillText, { color: colors.textSecondary }]}>{item.servings} servings</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.likeButton}
        onPress={(e) => {
          e.stopPropagation();
          handleLikeToggle(item);
        }}
      >
        <Text
          style={[
            styles.likeIcon,
            item.user_liked ? styles.likeIconFilled : styles.likeIconOutline,
          ]}
        >
          {item.user_liked ? '♥' : '♡'}
        </Text>
        <Text
          style={[
            styles.likeCount,
            { color: colors.textSecondary },
            item.user_liked && styles.likeCountActive,
          ]}
        >
          {item.likes_count || 0}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View style={[sharedStyles.emptyState, { paddingTop: 100 }]}>
        <Text style={[sharedStyles.emptyStateTitle, { color: colors.text, fontSize: 20 }]}>No recipes shared yet</Text>
        <Text style={[sharedStyles.emptyStateSubtitle, { color: colors.textSecondary, fontSize: 16 }]}>
          Be the first to share a recipe with the community
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[sharedStyles.flex1, { backgroundColor: colors.background, padding: 16 }]}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonLoader key={i} lines={3} style={{ marginBottom: 12 }} />
        ))}
      </View>
    );
  }

  return (
    <View style={[sharedStyles.flex1, { backgroundColor: colors.background }]}>
      <View style={[sharedStyles.searchContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TextInput
          style={[sharedStyles.searchInput, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text }]}
          placeholder="Search recipes..."
          value={searchText}
          onChangeText={handleSearch}
          placeholderTextColor={colors.textSecondary}
        />
      </View>
      <FlatList
        data={recipes}
        renderItem={renderRecipeCard}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={sharedStyles.listContent}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  authorName: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
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
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  likeIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  likeIconOutline: {
    color: '#9CA3AF',
  },
  likeIconFilled: {
    color: '#EF4444',
  },
  likeCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  likeCountActive: {
    color: '#EF4444',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
