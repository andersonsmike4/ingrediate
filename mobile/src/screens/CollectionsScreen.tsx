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
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import {
  fetchCollections,
  createCollection,
  deleteCollection,
  shareCollection,
} from '../api/collections';
import { Collection } from '../types';
import useAsyncData from '../hooks/useAsyncData';
import SkeletonLoader from '../components/SkeletonLoader';
import { sharedStyles } from '../styles/shared';
import { HomeStackNavigationProp } from '../types/navigation';

export default function CollectionsScreen() {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchAll = useCallback(() => fetchCollections(), []);

  const { data: collections, loading, refreshing, refresh, reload } = useAsyncData<Collection[]>({
    fetchFn: fetchAll,
    errorMessage: 'Failed to load collections. Please try again.',
  });

  const handleCreateCollection = async () => {
    if (name.trim() === '') {
      Alert.alert('Error', 'Please enter a collection name');
      return;
    }

    setCreating(true);
    try {
      await createCollection(name.trim(), description.trim());
      setName('');
      setDescription('');
      await reload();
      Alert.alert('Success', 'Collection created successfully');
    } catch (error) {
      console.error('Failed to create collection:', error);
      Alert.alert('Error', 'Failed to create collection. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCollection = (collectionId: number, collectionName: string) => {
    Alert.alert(
      'Delete Collection',
      `Are you sure you want to delete "${collectionName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCollection(collectionId);
              await reload();
              Alert.alert('Success', 'Collection deleted successfully');
            } catch (error) {
              console.error('Failed to delete collection:', error);
              Alert.alert('Error', 'Failed to delete collection. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleShareCollection = async (collectionId: number) => {
    try {
      const { share_url } = await shareCollection(collectionId);
      Alert.alert('Share Collection', share_url, [{ text: 'OK' }]);
    } catch (error) {
      console.error('Failed to share collection:', error);
      Alert.alert('Error', 'Failed to generate share link. Please try again.');
    }
  };

  const handleCollectionPress = (collection: Collection) => {
    navigation.navigate('CollectionDetail', {
      collectionId: collection.id,
      collectionName: collection.name,
    });
  };

  const renderCollectionCard = ({ item }: { item: Collection }) => {
    const recipeCount = item.recipes?.length ?? 0;

    return (
      <View style={[sharedStyles.cardWithShadow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => handleCollectionPress(item)}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
          {item.description && (
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
              {item.description}
            </Text>
          )}
          <Text style={[styles.recipeCount, { color: colors.textSecondary }]}>
            {recipeCount} {recipeCount === 1 ? 'recipe' : 'recipes'}
          </Text>
        </TouchableOpacity>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: colors.primary }]}
            onPress={() => handleShareCollection(item.id)}
          >
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.error }]}
            onPress={() => handleDeleteCollection(item.id, item.name)}
          >
            <Text style={styles.deleteButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (loading) return null;
    return (
      <View style={[sharedStyles.emptyState, { paddingTop: 100 }]}>
        <Text style={[sharedStyles.emptyStateTitle, { color: colors.text, fontSize: 20 }]}>No collections yet</Text>
        <Text style={[sharedStyles.emptyStateSubtitle, { color: colors.textSecondary, fontSize: 16 }]}>Create a collection to organize your recipes</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[sharedStyles.flex1, { backgroundColor: colors.background, padding: 16 }]}>
        <SkeletonLoader lines={3} style={{ marginBottom: 16 }} />
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonLoader key={i} lines={2} style={{ marginBottom: 12 }} />
        ))}
      </View>
    );
  }

  return (
    <View style={[sharedStyles.flex1, { backgroundColor: colors.background }]}>
      <View style={[styles.createSection, { backgroundColor: colors.surfaceSecondary, borderBottomColor: colors.border }]}>
        <Text style={[styles.createTitle, { color: colors.text }]}>Create Collection</Text>
        <TextInput
          style={[sharedStyles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, marginBottom: 12 }]}
          placeholder="Collection name"
          value={name}
          onChangeText={setName}
          placeholderTextColor={colors.textSecondary}
        />
        <TextInput
          style={[sharedStyles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, marginBottom: 12 }]}
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
          placeholderTextColor={colors.textSecondary}
          multiline
        />
        <TouchableOpacity
          style={[sharedStyles.primaryButton, { backgroundColor: colors.primary }, creating && sharedStyles.buttonDisabled]}
          onPress={handleCreateCollection}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={sharedStyles.primaryButtonText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>
      <FlatList
        data={collections}
        renderItem={renderCollectionCard}
        keyExtractor={(item) => item.id.toString()}
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
    padding: 16,
    borderBottomWidth: 1,
  },
  createTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardContent: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 6,
  },
  recipeCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  shareButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
