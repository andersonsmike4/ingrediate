import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { theme } from '../theme';
import { fetchSmartSuggestions } from '../api/suggestions';
import { useTheme } from '../contexts/ThemeContext';

interface Suggestion {
  name: string;
  reason: string;
  ingredients_needed: string[];
  ingredients_from_pantry: string[];
  cook_time?: string;
  difficulty?: string;
}

export default function SmartSuggestionsScreen() {
  const { colors, borderRadius } = useTheme();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const handleGetSuggestions = async () => {
    try {
      setLoading(true);
      const result = await fetchSmartSuggestions();
      // The API returns suggestions in various formats - normalize
      const data = result.suggestions;
      if (Array.isArray(data)) {
        setSuggestions(data);
      } else if (data?.recipes) {
        setSuggestions(data.recipes);
      } else if (data?.suggestions) {
        setSuggestions(data.suggestions);
      } else {
        setSuggestions([]);
      }
      setHasLoaded(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to get suggestions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Hero section */}
      <View style={styles.heroSection}>
        <View style={[styles.heroIconContainer, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="sparkles" size={32} color={colors.primary} />
        </View>
        <Text style={[styles.heroTitle, { color: colors.text }]}>Smart Suggestions</Text>
        <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
          AI-powered recipe ideas based on your pantry, preferences, and what's expiring soon
        </Text>

        <TouchableOpacity
          style={[styles.generateButton, { backgroundColor: colors.primary, borderRadius: borderRadius.md }, loading && { opacity: 0.6 }]}
          onPress={handleGetSuggestions}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="sparkles" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.generateButtonText}>
                {hasLoaded ? 'Refresh Suggestions' : 'Get Suggestions'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Loading state */}
      {loading && (
        <View style={styles.loadingSection}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Analyzing your pantry and preferences...</Text>
        </View>
      )}

      {/* Empty state */}
      {!loading && hasLoaded && suggestions.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="nutrition-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No suggestions available</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Add items to your pantry first so we can suggest recipes
          </Text>
        </View>
      )}

      {/* Suggestions list */}
      {!loading && suggestions.map((suggestion, index) => (
        <View key={index} style={[styles.suggestionCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: borderRadius.xl }]}>
          <View style={styles.suggestionHeader}>
            <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
            <Text style={[styles.suggestionName, { color: colors.text }]}>{suggestion.name}</Text>
          </View>

          {suggestion.reason && (
            <View style={[styles.reasonContainer, { backgroundColor: colors.orange50, borderRadius: borderRadius.md }]}>
              <Ionicons name="bulb-outline" size={16} color={colors.orange700} />
              <Text style={[styles.reasonText, { color: colors.stone700 }]}>{suggestion.reason}</Text>
            </View>
          )}

          {suggestion.cook_time && (
            <View style={styles.metaRow}>
              {suggestion.cook_time && (
                <View style={[styles.metaPill, { backgroundColor: colors.primaryLight, borderRadius: borderRadius.full }]}>
                  <Ionicons name="time-outline" size={14} color={colors.orange700} />
                  <Text style={[styles.metaPillText, { color: colors.orange700 }]}>{suggestion.cook_time}</Text>
                </View>
              )}
              {suggestion.difficulty && (
                <View style={[styles.metaPill, { backgroundColor: colors.primaryLight, borderRadius: borderRadius.full }]}>
                  <Ionicons name="flame-outline" size={14} color={colors.orange700} />
                  <Text style={[styles.metaPillText, { color: colors.orange700 }]}>{suggestion.difficulty}</Text>
                </View>
              )}
            </View>
          )}

          {suggestion.ingredients_from_pantry && suggestion.ingredients_from_pantry.length > 0 && (
            <View style={styles.ingredientSection}>
              <Text style={[styles.ingredientLabel, { color: colors.textSecondary }]}>From your pantry:</Text>
              <View style={styles.ingredientPills}>
                {suggestion.ingredients_from_pantry.map((ing, i) => (
                  <View key={i} style={[styles.pantryPill, { borderRadius: borderRadius.full }]}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                    <Text style={styles.pantryPillText}>{ing}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {suggestion.ingredients_needed && suggestion.ingredients_needed.length > 0 && (
            <View style={styles.ingredientSection}>
              <Text style={[styles.ingredientLabel, { color: colors.textSecondary }]}>Need to buy:</Text>
              <View style={styles.ingredientPills}>
                {suggestion.ingredients_needed.map((ing, i) => (
                  <View key={i} style={[styles.needPill, { backgroundColor: colors.primaryLight, borderRadius: borderRadius.full }]}>
                    <Ionicons name="add-circle-outline" size={14} color={colors.orange700} />
                    <Text style={[styles.needPillText, { color: colors.orange700 }]}>{ing}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  heroSection: {
    padding: 24,
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  generateButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingSection: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  suggestionCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: theme.borderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  suggestionName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: theme.colors.orange50,
    padding: 12,
    borderRadius: theme.borderRadius.md,
    marginBottom: 12,
  },
  reasonText: {
    fontSize: 14,
    color: theme.colors.stone700,
    flex: 1,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  metaPillText: {
    fontSize: 13,
    color: theme.colors.orange700,
    fontWeight: '500',
  },
  ingredientSection: {
    marginTop: 8,
  },
  ingredientLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  ingredientPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pantryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
  },
  pantryPillText: {
    fontSize: 13,
    color: '#166534',
  },
  needPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
  },
  needPillText: {
    fontSize: 13,
    color: theme.colors.orange700,
  },
});
