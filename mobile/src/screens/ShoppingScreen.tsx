import React, { useState, useEffect, useCallback } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import {
  fetchShoppingList,
  addShoppingListItem,
  toggleShoppingListItem,
  deleteShoppingListItem,
  clearCheckedItems,
  addCheckedToPantry,
} from '../api/shopping';
import { ShoppingListItem } from '../types';
import { cacheShoppingList, getCachedShoppingList, isOnline, queueOfflineAction } from '../services/offlineCache';
import SwipeableRow from '../components/SwipeableRow';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

export default function ShoppingScreen() {
  const { colors } = useTheme();
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [uncheckedItems, setUncheckedItems] = useState<ShoppingListItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [addingItem, setAddingItem] = useState(false);

  const loadItems = async () => {
    try {
      const response = await fetchShoppingList();
      setItems(response.items);
      splitItems(response.items);
      // Cache for offline use
      cacheShoppingList(response.items);
    } catch (error) {
      // Fall back to cached data when offline
      const online = await isOnline();
      if (!online) {
        const cached = await getCachedShoppingList();
        setItems(cached);
        splitItems(cached);
      } else {
        Alert.alert('Error', 'Failed to load shopping list');
        console.error('Load shopping list error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const splitItems = (allItems: ShoppingListItem[]) => {
    const unchecked = allItems.filter((item) => !item.checked);
    const checked = allItems.filter((item) => item.checked);
    setUncheckedItems(unchecked);
    setCheckedItems(checked);
  };

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      return;
    }

    setAddingItem(true);
    try {
      const response = await addShoppingListItem(newItemName.trim());
      setItems([response.item, ...items]);
      setUncheckedItems([response.item, ...uncheckedItems]);
      setNewItemName('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add item');
      console.error('Add item error:', error);
    } finally {
      setAddingItem(false);
    }
  };

  const handleToggleItem = async (item: ShoppingListItem) => {
    // Capture previous state for potential revert
    const previousItems = [...items];

    // Optimistic UI update
    const updatedItem = { ...item, checked: !item.checked };
    const newItems = items.map((i) => (i.id === item.id ? updatedItem : i));
    setItems(newItems);
    splitItems(newItems);

    try {
      await toggleShoppingListItem(item.id);
    } catch (error) {
      const online = await isOnline();
      if (!online) {
        // Queue for later sync
        queueOfflineAction({ type: 'toggle_shopping_item', payload: { id: item.id } });
        // Keep optimistic update
      } else {
        // Revert on error
        setItems(previousItems);
        splitItems(previousItems);
        Alert.alert('Error', 'Failed to update item');
        console.error('Toggle item error:', error);
      }
    }
  };


  const handleClearChecked = () => {
    Alert.alert(
      'Clear Checked Items',
      `Remove all ${checkedItems.length} checked items?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCheckedItems();
              await loadItems();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear items');
              console.error('Clear items error:', error);
            }
          },
        },
      ]
    );
  };

  const handleAddToPantry = async () => {
    try {
      const response = await addCheckedToPantry();
      Alert.alert(
        'Success',
        `Added ${response.added_to_pantry} item${
          response.added_to_pantry !== 1 ? 's' : ''
        } to pantry`
      );
      await loadItems();
    } catch (error) {
      Alert.alert('Error', 'Failed to add items to pantry');
      console.error('Add to pantry error:', error);
    }
  };

  const renderCheckbox = (item: ShoppingListItem) => {
    return (
      <TouchableOpacity
        style={[
          styles.checkbox,
          { borderColor: colors.inputBorder },
          item.checked && { backgroundColor: colors.success, borderColor: colors.success },
        ]}
        onPress={() => handleToggleItem(item)}
        accessibilityRole="checkbox"
        accessibilityLabel={`${item.name}${item.checked ? ', checked' : ', unchecked'}`}
        accessibilityState={{ checked: item.checked }}
        accessibilityHint="Double tap to toggle"
      >
        {item.checked && (
          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
        )}
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: ShoppingListItem }) => {
    return (
      <SwipeableRow onDelete={async () => {
        try {
          await deleteShoppingListItem(item.id);
          const newItems = items.filter((i) => i.id !== item.id);
          setItems(newItems);
          splitItems(newItems);
        } catch (error) {
          Alert.alert('Error', 'Failed to delete item');
        }
      }}>
        <View style={[styles.itemRow, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          {renderCheckbox(item)}
          <View style={styles.itemContent}>
            <Text
              style={[
                styles.itemName,
                { color: colors.text },
                item.checked && { color: colors.textMuted, textDecorationLine: 'line-through' },
              ]}
            >
              {item.name}
            </Text>
            {item.amount && (
              <Text style={[styles.itemAmount, { color: colors.textSecondary }]}>{item.amount}</Text>
            )}
            {item.source && (
              <Text style={[styles.itemSource, { color: colors.textSecondary }]}>from {item.source}</Text>
            )}
          </View>
        </View>
      </SwipeableRow>
    );
  };

  const renderSectionHeader = (title: string, count: number) => {
    if (count === 0) return null;
    return (
      <View style={[styles.sectionHeader, { backgroundColor: colors.surfaceSecondary }]}>
        <Text style={[styles.sectionHeaderText, { color: colors.textMuted }]}>
          {title} ({count})
        </Text>
      </View>
    );
  };

  const renderListContent = () => {
    return (
      <View style={styles.listContent}>
        {renderSectionHeader('TO BUY', uncheckedItems.length)}
        {uncheckedItems.map((item) => (
          <View key={item.id}>{renderItem({ item })}</View>
        ))}

        {renderSectionHeader('DONE', checkedItems.length)}
        {checkedItems.map((item) => (
          <View key={item.id}>{renderItem({ item })}</View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ padding: 16 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonLoader key={i} lines={1} style={{ marginBottom: 8 }} />
          ))}
        </View>
      </View>
    );
  }

  const showActionButtons = checkedItems.length > 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.addItemSection, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
          placeholder="Add item..."
          value={newItemName}
          onChangeText={setNewItemName}
          onSubmitEditing={handleAddItem}
          returnKeyType="done"
          editable={!addingItem}
          accessibilityLabel="Add shopping item"
          accessibilityHint="Enter item name and press add"
        />
        <TouchableOpacity
          style={[
            styles.addButton,
            { backgroundColor: colors.primary },
            (addingItem || !newItemName.trim()) && styles.addButtonDisabled,
          ]}
          onPress={handleAddItem}
          disabled={addingItem || !newItemName.trim()}
          accessibilityRole="button"
          accessibilityLabel="Add item to shopping list"
        >
          {addingItem ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.addButtonText}>Add</Text>
          )}
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <EmptyState
          icon="cart-outline"
          title="No items in your shopping list"
          subtitle="Add items above to get started"
        />
      ) : (
        <FlatList
          data={[{ key: 'content' }]}
          renderItem={() => renderListContent()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}

      {showActionButtons && (
        <View style={[styles.actionButtons, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.pantryButton, { backgroundColor: colors.background, borderColor: colors.primary }]}
            onPress={handleAddToPantry}
            accessibilityRole="button"
            accessibilityLabel={`Add ${checkedItems.length} checked items to pantry`}
          >
            <Text style={[styles.pantryButtonText, { color: colors.primary }]}>
              Add Checked to Pantry
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearChecked}
            accessibilityRole="button"
            accessibilityLabel={`Clear ${checkedItems.length} checked items`}
            accessibilityHint="Removes checked items from shopping list"
          >
            <Text style={[styles.clearButtonText, { color: colors.error }]}>Clear Checked</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
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
  addItemSection: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
  },
  addButton: {
    marginLeft: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    flexGrow: 1,
  },
  listContent: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    marginBottom: 2,
  },
  itemNameChecked: {
  },
  itemAmount: {
    fontSize: 14,
    marginTop: 2,
  },
  itemSource: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  actionButtons: {
    padding: 16,
    borderTopWidth: 1,
  },
  pantryButton: {
    borderWidth: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  pantryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
