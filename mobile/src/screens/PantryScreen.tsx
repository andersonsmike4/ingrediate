import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { fetchPantryItems, addPantryItem, deletePantryItem, clearPantry, voiceAddPantryItems } from '../api/pantry';
import { PantryItem } from '../types';
import { theme } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { cachePantryItems, getCachedPantryItems, isOnline } from '../services/offlineCache';
import { schedulePantryExpiryReminders } from '../services/notifications';
import SwipeableRow from '../components/SwipeableRow';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import AnimatedListItem from '../components/AnimatedListItem';
import { PANTRY_CATEGORIES } from '../constants';

export default function PantryScreen() {
  const navigation = useNavigation();
  const { colors, borderRadius, spacing } = useTheme();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('other');
  const [newExpiresAt, setNewExpiresAt] = useState('');
  const [adding, setAdding] = useState(false);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [voiceProcessing, setVoiceProcessing] = useState(false);

  const loadItems = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      const response = await fetchPantryItems();
      setItems(response.pantry_items);
      // Cache for offline use
      cachePantryItems(response.pantry_items);
      schedulePantryExpiryReminders(response.pantry_items).catch(() => {});
    } catch (error) {
      // Fall back to cached data when offline
      const online = await isOnline();
      if (!online) {
        const cached = await getCachedPantryItems();
        setItems(cached);
      } else {
        Alert.alert('Error', 'Failed to load pantry items');
        console.error(error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadItems();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadItems(true);
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    try {
      setAdding(true);
      await addPantryItem(newItemName.trim(), selectedCategory, newExpiresAt || null, newQuantity.trim() || null);
      setNewItemName('');
      setNewQuantity('');
      setSelectedCategory('other');
      setNewExpiresAt('');
      await loadItems();
    } catch (error) {
      Alert.alert('Error', 'Failed to add item');
      console.error(error);
    } finally {
      setAdding(false);
    }
  };


  const handleClearAll = () => {
    if (items.length === 0) return;

    Alert.alert(
      'Clear Pantry',
      'Are you sure you want to remove all items from your pantry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearPantry();
              await loadItems();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear pantry');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const handleVoiceAdd = async () => {
    if (!voiceText.trim()) return;

    try {
      setVoiceProcessing(true);
      const result = await voiceAddPantryItems(voiceText.trim());
      const count = result.pantry_items?.length || 0;
      Alert.alert('Success', `Added ${count} item${count !== 1 ? 's' : ''} to pantry`);
      setVoiceText('');
      setVoiceModalVisible(false);
      await loadItems();
    } catch (error) {
      Alert.alert('Error', 'Failed to process voice input');
      console.error(error);
    } finally {
      setVoiceProcessing(false);
    }
  };

  const getExpiryStatus = (expiresAt: string | null) => {
    if (!expiresAt) return null;

    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: 'Expired', color: colors.error, isWarning: true };
    } else if (diffDays <= 3) {
      const formatted = expiryDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return { text: `Expires: ${formatted}`, color: colors.error, isWarning: true };
    } else {
      const formatted = expiryDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return { text: `Expires: ${formatted}`, color: colors.textSecondary, isWarning: false };
    }
  };

  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, PantryItem[]>);

  const sortedCategories = Object.keys(groupedItems).sort();

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ padding: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonLoader key={i} lines={2} style={{ marginBottom: 12 }} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Add Item Section */}
        <View style={[styles.addSection, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Item</Text>

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.lg }}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, borderColor: colors.inputBorder, color: colors.text, backgroundColor: colors.surface }]}
              placeholder="Item name"
              value={newItemName}
              onChangeText={setNewItemName}
              placeholderTextColor={colors.textSecondary}
              returnKeyType="done"
              onSubmitEditing={handleAddItem}
              accessibilityLabel="Pantry item name"
              accessibilityHint="Enter name of item to add to pantry"
            />
            <TouchableOpacity
              style={{
                width: 48,
                height: 48,
                borderRadius: borderRadius.md,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => setVoiceModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Voice add items"
              accessibilityHint="Add multiple items by voice or text"
            >
              <Ionicons name="mic" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 12,
              borderRadius: borderRadius.md,
              backgroundColor: colors.surfaceSecondary,
              marginBottom: spacing.lg,
            }}
            onPress={() => (navigation as any).navigate('ReceiptScan')}
            accessibilityRole="button"
            accessibilityLabel="Scan grocery receipt"
            accessibilityHint="Open camera to scan receipt and add items to pantry"
          >
            <Ionicons name="receipt-outline" size={18} color={colors.primary} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>Scan Grocery Receipt</Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { borderColor: colors.inputBorder, color: colors.text, backgroundColor: colors.inputBackground }]}
            placeholder="Quantity (e.g., 2 lbs, 1 dozen)"
            placeholderTextColor={colors.textMuted}
            value={newQuantity}
            onChangeText={setNewQuantity}
            accessibilityLabel="Item quantity"
            accessibilityHint="Optional quantity or amount"
          />

          <Text style={[styles.label, { color: colors.text }]}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {PANTRY_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryPill,
                  { backgroundColor: colors.surfaceSecondary },
                  selectedCategory === category && { backgroundColor: colors.primary },
                ]}
                onPress={() => setSelectedCategory(category)}
                accessibilityRole="button"
                accessibilityLabel={`Category: ${category}`}
                accessibilityState={{ selected: selectedCategory === category }}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    { color: colors.stone700 },
                    selectedCategory === category && { color: colors.surface, fontWeight: '500' },
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.label, { color: colors.text }]}>Expiration Date (optional)</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.inputBorder, color: colors.text, backgroundColor: colors.inputBackground }]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            value={newExpiresAt}
            onChangeText={(text) => {
              // Auto-format: insert dashes as user types digits
              const digits = text.replace(/[^0-9]/g, '');
              if (digits.length <= 4) {
                setNewExpiresAt(digits);
              } else if (digits.length <= 6) {
                setNewExpiresAt(`${digits.slice(0, 4)}-${digits.slice(4)}`);
              } else {
                setNewExpiresAt(`${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`);
              }
            }}
            keyboardType="number-pad"
            maxLength={10}
            accessibilityLabel="Expiration date"
            accessibilityHint="Optional expiration date in YYYY-MM-DD format"
          />

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }, adding && styles.addButtonDisabled]}
            onPress={handleAddItem}
            disabled={adding}
            accessibilityRole="button"
            accessibilityLabel="Add item to pantry"
          >
            {adding ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.addButtonText, { color: colors.surface }]}>Add</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Items List */}
        {items.length === 0 ? (
          <EmptyState
            icon="cube-outline"
            title="Your pantry is empty"
            subtitle="Add items to keep track of what you have"
          />
        ) : (
          <View style={styles.itemsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>My Pantry</Text>

            {sortedCategories.map((category) => (
              <View key={category} style={styles.categorySection}>
                <Text style={[styles.categoryHeader, { color: colors.text }]}>
                  {category.charAt(0).toUpperCase() + category.slice(1)} (
                  {groupedItems[category].length})
                </Text>

                {groupedItems[category].map((item, index) => {
                  const expiryStatus = getExpiryStatus(item.expires_at);

                  return (
                    <AnimatedListItem key={item.id} index={index}>
                      <SwipeableRow onDelete={async () => {
                        try {
                          await deletePantryItem(item.id);
                          await loadItems();
                        } catch (error) {
                          Alert.alert('Error', 'Failed to delete item');
                        }
                      }}>
                        <View style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                          <View style={styles.itemContent}>
                            <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                            {item.quantity && (
                              <Text style={[styles.itemQuantity, { color: colors.textSecondary }]}>
                                {item.quantity}
                              </Text>
                            )}
                            {expiryStatus && (
                              <Text
                                style={[
                                  styles.itemExpiry,
                                  { color: expiryStatus.color },
                                ]}
                              >
                                {expiryStatus.text}
                              </Text>
                            )}
                          </View>
                        </View>
                      </SwipeableRow>
                    </AnimatedListItem>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {/* Clear All Button */}
        {items.length > 0 && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={handleClearAll}
            accessibilityRole="button"
            accessibilityLabel={`Clear all ${items.length} items from pantry`}
            accessibilityHint="Removes all items from your pantry"
          >
            <Text style={[styles.clearAllButtonText, { color: colors.error }]}>Clear All</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Voice Input Modal */}
      <Modal
        visible={voiceModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setVoiceModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.voiceModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.voiceModalContent, { backgroundColor: colors.surface }]}>
            <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
              <View style={styles.voiceModalHeader}>
                <Text style={[styles.voiceModalTitle, { color: colors.text }]}>Add Items by Voice</Text>
                <TouchableOpacity
                  onPress={() => setVoiceModalVisible(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  accessibilityHint="Close voice input dialog"
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.voiceModalSubtitle, { color: colors.textSecondary }]}>
                Tap the microphone on your keyboard to dictate, or type items separated by commas
              </Text>

              <View style={[styles.voiceModalExample, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="mic" size={18} color={colors.primary} />
                <Text style={[styles.voiceModalExampleText, { color: colors.primary }]}>
                  "chicken, rice, tomatoes, olive oil, garlic"
                </Text>
              </View>

              <TextInput
                style={[styles.voiceTextInput, { borderColor: colors.inputBorder, color: colors.text, backgroundColor: colors.surface }]}
                placeholder="Say or type your ingredients..."
                placeholderTextColor={colors.textMuted}
                value={voiceText}
                onChangeText={setVoiceText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoFocus
                accessibilityLabel="Voice input for pantry items"
                accessibilityHint="Enter items separated by commas"
              />

              <TouchableOpacity
                style={[styles.voiceSubmitButton, { backgroundColor: colors.primary }, voiceProcessing && { opacity: 0.6 }]}
                onPress={handleVoiceAdd}
                disabled={voiceProcessing || !voiceText.trim()}
                accessibilityRole="button"
                accessibilityLabel="Add to pantry"
              >
                {voiceProcessing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.voiceSubmitButtonText}>Add to Pantry</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
    padding: theme.spacing.lg,
    paddingBottom: 32,
  },
  addSection: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: theme.spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 16,
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: theme.spacing.sm,
  },
  categoryScroll: {
    marginBottom: theme.spacing.lg,
  },
  categoryScrollContent: {
    paddingRight: theme.spacing.lg,
  },
  categoryPill: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
  },
  categoryPillSelected: {
  },
  categoryPillText: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  categoryPillTextSelected: {
  },
  addButton: {
    borderRadius: theme.borderRadius.md,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemsSection: {
    marginBottom: theme.spacing.lg,
  },
  categorySection: {
    marginBottom: theme.spacing.xl,
  },
  categoryHeader: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemCard: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 13,
    marginTop: 1,
  },
  itemExpiry: {
    fontSize: 13,
    marginTop: 2,
  },
  clearAllButton: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  clearAllButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  voiceModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  voiceModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  voiceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  voiceModalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  voiceModalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  voiceModalExample: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: theme.borderRadius.md,
    marginBottom: 16,
  },
  voiceModalExampleText: {
    fontSize: 14,
    fontStyle: 'italic',
    flex: 1,
  },
  voiceTextInput: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 16,
  },
  voiceSubmitButton: {
    borderRadius: theme.borderRadius.md,
    padding: 16,
    alignItems: 'center',
  },
  voiceSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
