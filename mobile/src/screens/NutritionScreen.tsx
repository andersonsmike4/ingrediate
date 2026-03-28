import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fetchNutritionGoal, updateNutritionGoal, fetchWeeklyNutritionReport } from '../api/nutrition';
import { NutritionGoal } from '../types';
import useAsyncData from '../hooks/useAsyncData';
import SkeletonLoader from '../components/SkeletonLoader';
import { sharedStyles } from '../styles/shared';

export default function NutritionScreen() {
  const { colors } = useTheme();
  const [saving, setSaving] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const [weeklyReport, setWeeklyReport] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    const data: any = await fetchNutritionGoal();
    return data.goal || data;
  }, []);

  const { loading } = useAsyncData({
    fetchFn: fetchGoals,
    errorMessage: 'Failed to load nutrition goals',
    onSuccess: (goal: any) => {
      setCalories(goal.daily_calories?.toString() || '');
      setProtein(goal.daily_protein?.toString() || '');
      setCarbs(goal.daily_carbs?.toString() || '');
      setFat(goal.daily_fat?.toString() || '');
    },
  });

  const handleSaveGoals = async () => {
    try {
      setSaving(true);
      const goal: NutritionGoal = {
        daily_calories: calories ? parseInt(calories) : null,
        daily_protein: protein ? parseInt(protein) : null,
        daily_carbs: carbs ? parseInt(carbs) : null,
        daily_fat: fat ? parseInt(fat) : null,
      };
      await updateNutritionGoal(goal);
      Alert.alert('Success', 'Nutrition goals saved');
    } catch (error) {
      Alert.alert('Error', 'Failed to save nutrition goals');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      const result = await fetchWeeklyNutritionReport();
      setWeeklyReport(result.report);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate weekly report');
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <View style={[sharedStyles.flex1, { backgroundColor: colors.background, padding: 16 }]}>
        <SkeletonLoader lines={4} style={{ marginBottom: 16 }} />
        <SkeletonLoader lines={2} />
      </View>
    );
  }

  return (
    <ScrollView style={[sharedStyles.flex1, { backgroundColor: colors.background }]}>
      <View style={[sharedStyles.section, { borderBottomColor: colors.border }]}>
        <Text style={[sharedStyles.sectionTitle, { color: colors.text }]}>Daily Goals</Text>

        {[
          { label: 'Calories', value: calories, setter: setCalories, placeholder: '2000' },
          { label: 'Protein (g)', value: protein, setter: setProtein, placeholder: '50' },
          { label: 'Carbs (g)', value: carbs, setter: setCarbs, placeholder: '250' },
          { label: 'Fat (g)', value: fat, setter: setFat, placeholder: '70' },
        ].map(({ label, value, setter, placeholder }) => (
          <View key={label} style={sharedStyles.inputGroup}>
            <Text style={[sharedStyles.inputLabel, { color: colors.text }]}>{label}</Text>
            <TextInput
              style={[sharedStyles.input, { borderColor: colors.border, color: colors.text }]}
              value={value}
              onChangeText={setter}
              placeholder={placeholder}
              keyboardType="numeric"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[sharedStyles.primaryButton, { backgroundColor: colors.primary, marginTop: 8 }, saving && sharedStyles.buttonDisabled]}
          onPress={handleSaveGoals}
          disabled={saving}
        >
          <Text style={sharedStyles.primaryButtonText}>
            {saving ? 'Saving...' : 'Save Goals'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[sharedStyles.section, { borderBottomColor: colors.border }]}>
        <Text style={[sharedStyles.sectionTitle, { color: colors.text }]}>Weekly Report</Text>

        <TouchableOpacity
          style={[sharedStyles.primaryButton, { backgroundColor: colors.primary, marginTop: 8 }, generatingReport && sharedStyles.buttonDisabled]}
          onPress={handleGenerateReport}
          disabled={generatingReport}
        >
          <Text style={sharedStyles.primaryButtonText}>
            {generatingReport ? 'Generating...' : 'Generate Report'}
          </Text>
        </TouchableOpacity>

        {weeklyReport && (
          <View style={[styles.reportCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Text style={[styles.reportText, { color: colors.text }]}>{weeklyReport}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  reportCard: {
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
  },
  reportText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
