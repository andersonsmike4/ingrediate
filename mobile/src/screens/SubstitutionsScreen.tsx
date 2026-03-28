import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { theme } from '../theme';
import { fetchSubstitutionLogs, createSubstitutionLog, lookupSubstitution } from '../api/substitutionLogs';
import { SubstitutionLogEntry } from '../types/index';
import { useTheme } from '../contexts/ThemeContext';
import useAsyncData from '../hooks/useAsyncData';
import SkeletonLoader from '../components/SkeletonLoader';
import { sharedStyles } from '../styles/shared';

export default function SubstitutionsScreen() {
  const { colors, borderRadius, spacing } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SubstitutionLogEntry[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // New substitution form
  const [showForm, setShowForm] = useState(false);
  const [formOriginal, setFormOriginal] = useState('');
  const [formSubstitute, setFormSubstitute] = useState('');
  const [formRecipe, setFormRecipe] = useState('');
  const [formRating, setFormRating] = useState(0);
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchLogs = useCallback(async () => {
    const response = await fetchSubstitutionLogs();
    return response.logs || [];
  }, []);

  const { data: logs, loading, refreshing, refresh, reload } = useAsyncData<SubstitutionLogEntry[]>({
    fetchFn: fetchLogs,
    errorMessage: 'Failed to load substitution logs',
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      const response = await lookupSubstitution(searchQuery.trim());
      setSearchResults(response.suggestions || []);
      setHasSearched(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to search substitutions');
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  const handleSave = async () => {
    if (!formOriginal.trim() || !formSubstitute.trim()) {
      Alert.alert('Required', 'Please enter both the original and substitute ingredient');
      return;
    }
    try {
      setSaving(true);
      await createSubstitutionLog({
        original_ingredient: formOriginal.trim(),
        substitute_ingredient: formSubstitute.trim(),
        recipe_name: formRecipe.trim() || null,
        rating: formRating || null,
        notes: formNotes.trim() || null,
      });
      Alert.alert('Saved', 'Substitution logged successfully');
      setShowForm(false);
      setFormOriginal('');
      setFormSubstitute('');
      setFormRecipe('');
      setFormRating(0);
      setFormNotes('');
      await reload();
    } catch (error) {
      Alert.alert('Error', 'Failed to save substitution');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const renderStars = (rating: number, onPress?: (val: number) => void) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity
          key={i}
          onPress={() => onPress?.(i === rating ? 0 : i)}
          disabled={!onPress}
        >
          <Ionicons
            name={i <= rating ? 'star' : 'star-outline'}
            size={onPress ? 28 : 16}
            color={i <= rating ? '#F59E0B' : colors.textMuted}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={[sharedStyles.flex1, { backgroundColor: colors.background, padding: 16 }]}>
        <SkeletonLoader lines={3} style={{ marginBottom: 16 }} />
        <SkeletonLoader lines={4} style={{ marginBottom: 16 }} />
        <SkeletonLoader lines={3} />
      </View>
    );
  }

  const logsList = logs || [];

  return (
    <View style={[sharedStyles.flex1, { backgroundColor: colors.background }]}>
      <ScrollView
        style={sharedStyles.flex1}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Search Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: borderRadius.xl }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Look Up Substitution</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={[styles.searchInput, { borderColor: colors.inputBorder, color: colors.text, backgroundColor: colors.surface, borderRadius: borderRadius.md }]}
              placeholder="e.g., butter, eggs, cream..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={[styles.searchButton, { backgroundColor: colors.primary, borderRadius: borderRadius.md }]}
              onPress={handleSearch}
              disabled={searching}
            >
              {searching ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="search" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          {hasSearched && searchResults.length === 0 && (
            <View style={styles.noResults}>
              <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
                No substitutions found for "{searchQuery}"
              </Text>
            </View>
          )}

          {searchResults.map((result, index) => (
            <View key={result.id || index} style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: borderRadius.lg }]}>
              <View style={styles.resultHeader}>
                <Ionicons name="swap-horizontal" size={18} color={colors.primary} />
                <Text style={[styles.resultOriginal, { color: colors.text }]}>{result.original_ingredient}</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
                <Text style={[styles.resultSubstitute, { color: colors.primary }]}>{result.substitute_ingredient}</Text>
              </View>
              {result.rating && result.rating > 0 && renderStars(result.rating)}
              {result.recipe_name && (
                <Text style={[styles.resultRecipe, { color: colors.textSecondary }]}>Used in: {result.recipe_name}</Text>
              )}
              {result.notes && <Text style={[styles.resultNotes, { color: colors.textSecondary }]}>{result.notes}</Text>}
            </View>
          ))}
        </View>

        {/* Log New Substitution */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: borderRadius.xl }]}>
          <TouchableOpacity
            style={[styles.toggleFormButton, { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: borderRadius.lg }]}
            onPress={() => setShowForm(!showForm)}
          >
            <Ionicons
              name={showForm ? 'chevron-up' : 'add-circle-outline'}
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.toggleFormText, { color: colors.primary }]}>
              {showForm ? 'Hide Form' : 'Log a Substitution'}
            </Text>
          </TouchableOpacity>

          {showForm && (
            <View style={styles.formCard}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Original Ingredient *</Text>
              <TextInput
                style={[styles.formInput, { borderColor: colors.inputBorder, color: colors.text, backgroundColor: colors.surface, borderRadius: borderRadius.md }]}
                placeholder="e.g., butter"
                placeholderTextColor={colors.textSecondary}
                value={formOriginal}
                onChangeText={setFormOriginal}
              />

              <Text style={[styles.formLabel, { color: colors.text }]}>Substitute Ingredient *</Text>
              <TextInput
                style={[styles.formInput, { borderColor: colors.inputBorder, color: colors.text, backgroundColor: colors.surface, borderRadius: borderRadius.md }]}
                placeholder="e.g., coconut oil"
                placeholderTextColor={colors.textSecondary}
                value={formSubstitute}
                onChangeText={setFormSubstitute}
              />

              <Text style={[styles.formLabel, { color: colors.text }]}>Recipe Name</Text>
              <TextInput
                style={[styles.formInput, { borderColor: colors.inputBorder, color: colors.text, backgroundColor: colors.surface, borderRadius: borderRadius.md }]}
                placeholder="e.g., Chocolate Cake"
                placeholderTextColor={colors.textSecondary}
                value={formRecipe}
                onChangeText={setFormRecipe}
              />

              <Text style={[styles.formLabel, { color: colors.text }]}>Rating</Text>
              {renderStars(formRating, setFormRating)}

              <Text style={[styles.formLabel, { color: colors.text, marginTop: spacing.md }]}>Notes</Text>
              <TextInput
                style={[styles.formInput, { minHeight: 80, borderColor: colors.inputBorder, color: colors.text, backgroundColor: colors.surface, borderRadius: borderRadius.md }]}
                placeholder="How did the substitution work out?"
                placeholderTextColor={colors.textSecondary}
                value={formNotes}
                onChangeText={setFormNotes}
                multiline
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary, borderRadius: borderRadius.md }, saving && sharedStyles.buttonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={sharedStyles.primaryButtonText}>Save Substitution</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* History */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: borderRadius.xl }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Substitution History</Text>
          {logsList.length === 0 ? (
            <View style={sharedStyles.emptyState}>
              <Ionicons name="swap-horizontal-outline" size={40} color={colors.textMuted} />
              <Text style={[sharedStyles.emptyStateTitle, { color: colors.text, marginTop: spacing.md }]}>No substitutions logged yet</Text>
              <Text style={[sharedStyles.emptyStateSubtitle, { color: colors.textSecondary }]}>
                Log your ingredient swaps to remember what works
              </Text>
            </View>
          ) : (
            logsList.map((log, index) => (
              <View key={log.id || index} style={[styles.logCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: borderRadius.lg }]}>
                <View style={styles.logHeader}>
                  <View style={styles.logSwap}>
                    <Text style={[styles.logOriginal, { color: colors.text }]}>{log.original_ingredient}</Text>
                    <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />
                    <Text style={[styles.logSubstitute, { color: colors.primary }]}>{log.substitute_ingredient}</Text>
                  </View>
                  {log.rating && log.rating > 0 && renderStars(log.rating)}
                </View>
                {log.recipe_name && <Text style={[styles.logRecipe, { color: colors.textSecondary }]}>{log.recipe_name}</Text>}
                {log.notes && <Text style={[styles.logNotes, { color: colors.textSecondary }]}>{log.notes}</Text>}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 32,
  },
  section: {
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
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 16,
  },
  searchButton: {
    width: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResults: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  resultCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    borderWidth: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  resultOriginal: {
    fontSize: 15,
    fontWeight: '600',
  },
  resultSubstitute: {
    fontSize: 15,
    fontWeight: '600',
  },
  resultRecipe: {
    fontSize: 13,
    marginTop: 4,
  },
  resultNotes: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginVertical: 4,
  },
  toggleFormButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
  },
  toggleFormText: {
    fontSize: 16,
    fontWeight: '500',
  },
  formCard: {
    marginTop: theme.spacing.lg,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: theme.spacing.sm,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 16,
    marginBottom: theme.spacing.lg,
  },
  saveButton: {
    borderRadius: theme.borderRadius.md,
    padding: 14,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    minHeight: 48,
  },
  logCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logSwap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  logOriginal: {
    fontSize: 15,
    fontWeight: '500',
  },
  logSubstitute: {
    fontSize: 15,
    fontWeight: '500',
  },
  logRecipe: {
    fontSize: 13,
    marginTop: 6,
  },
  logNotes: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
});
