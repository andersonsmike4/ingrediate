import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchPreferences, updatePreferences } from '../api/preferences';

interface HouseholdMember {
  name: string;
  age: string;
}

const DIETARY_OPTIONS = [
  'vegetarian', 'vegan', 'keto', 'paleo', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher',
];

const SPICE_OPTIONS = ['mild', 'medium', 'spicy', 'extra spicy'];

const CUISINE_OPTIONS = [
  'Italian', 'Mexican', 'Asian', 'Indian', 'Mediterranean', 'American', 'French', 'Japanese', 'Thai', 'Middle Eastern',
];

const PROTEIN_OPTIONS = ['chicken', 'beef', 'pork', 'fish', 'tofu', 'beans', 'eggs'];

const CALORIE_OPTIONS = [
  { value: 'none', label: 'No preference' },
  { value: 'light', label: 'Light (<500 cal)' },
  { value: 'moderate', label: 'Moderate (500-700)' },
  { value: 'hearty', label: 'Hearty (700+)' },
];

export default function PreferencesScreen() {
  const { colors, mode, setMode } = useTheme();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [prefs, setPrefs] = useState({
    dietaryRestrictions: [] as string[],
    allergens: [] as string[],
    spiceTolerance: 'medium' as string,
    preferredCuisines: [] as string[],
    preferredProteins: [] as string[],
    caloriePreference: 'none' as string,
    householdMembers: [] as HouseholdMember[],
  });
  const [allergenInput, setAllergenInput] = useState('');
  const [notificationStatus, setNotificationStatus] = useState<string>('unknown');

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data: any = await fetchPreferences();
      const prefsData = data.preferences || data;
      setPrefs({
        dietaryRestrictions: prefsData.dietary_restrictions || [],
        allergens: prefsData.allergens || [],
        spiceTolerance: prefsData.spice_tolerance || 'medium',
        preferredCuisines: prefsData.preferred_cuisines || [],
        preferredProteins: prefsData.preferred_proteins || [],
        caloriePreference: prefsData.calorie_preference || 'none',
        householdMembers: prefsData.household_members || [],
      });
      // Check notification permissions
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationStatus(status);
    } catch (error) {
      Alert.alert('Error', 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadPreferences();
    }, [])
  );

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    }
    return [...array, item];
  };

  const addAllergen = () => {
    const trimmed = allergenInput.trim();
    if (!trimmed) return;
    if (!prefs.allergens.includes(trimmed)) {
      setPrefs(p => ({ ...p, allergens: [...p.allergens, trimmed] }));
    }
    setAllergenInput('');
  };

  const removeAllergen = (allergen: string) => {
    setPrefs(p => ({ ...p, allergens: p.allergens.filter(a => a !== allergen) }));
  };

  const addHouseholdMember = () => {
    setPrefs(p => ({ ...p, householdMembers: [...p.householdMembers, { name: '', age: '' }] }));
  };

  const updateHouseholdMember = (index: number, field: 'name' | 'age', value: string) => {
    setPrefs(p => ({
      ...p,
      householdMembers: p.householdMembers.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      ),
    }));
  };

  const removeHouseholdMember = (index: number) => {
    setPrefs(p => ({ ...p, householdMembers: p.householdMembers.filter((_, i) => i !== index) }));
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      await updatePreferences({
        dietary_restrictions: prefs.dietaryRestrictions,
        allergens: prefs.allergens,
        spice_tolerance: prefs.spiceTolerance,
        preferred_cuisines: prefs.preferredCuisines,
        preferred_proteins: prefs.preferredProteins,
        calorie_preference: prefs.caloriePreference,
        household_members: prefs.householdMembers,
      });
      Alert.alert('Success', 'Preferences saved');
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const renderPillSection = (
    title: string,
    options: string[],
    selected: string[],
    onToggle: (val: string[]) => void,
  ) => (
    <View style={[styles.section, { borderBottomColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.pillContainer}>
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <TouchableOpacity
              key={option}
              style={[styles.pill, { borderColor: colors.border, backgroundColor: isSelected ? colors.primary : colors.surface }]}
              onPress={() => onToggle(toggleArrayItem(selected, option))}
              accessibilityRole="button"
              accessibilityLabel={option}
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[styles.pillText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      {/* User Info */}
      <View style={[styles.userInfoSection, { borderBottomColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={[styles.userName, { color: colors.text }]}>{user?.name}</Text>
        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
      </View>

      {/* Household Members */}
      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Household</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Add the people you cook for so AI can suggest proper portions.
        </Text>
        {prefs.householdMembers.map((member, index) => (
          <View key={index} style={styles.householdRow}>
            <TextInput
              style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
              placeholder="Name (e.g., Dad)"
              placeholderTextColor={colors.textSecondary}
              value={member.name}
              onChangeText={(val) => updateHouseholdMember(index, 'name', val)}
              accessibilityLabel={`Household member ${index + 1} name`}
            />
            <TextInput
              style={[styles.input, { width: 64, textAlign: 'center', borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
              placeholder="Age"
              placeholderTextColor={colors.textSecondary}
              value={member.age}
              onChangeText={(val) => updateHouseholdMember(index, 'age', val)}
              keyboardType="number-pad"
              accessibilityLabel={`Household member ${index + 1} age`}
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeHouseholdMember(index)}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${member.name || 'household member'}`}
            >
              <Text style={[styles.removeButtonText, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity
          style={styles.addMemberButton}
          onPress={addHouseholdMember}
          accessibilityRole="button"
          accessibilityLabel="Add household member"
        >
          <Text style={[styles.addMemberButtonText, { color: colors.primary }]}>+ Add Person</Text>
        </TouchableOpacity>
      </View>

      {/* Dietary Restrictions */}
      {renderPillSection('Dietary Restrictions', DIETARY_OPTIONS, prefs.dietaryRestrictions, (val) => setPrefs(p => ({ ...p, dietaryRestrictions: val })))}

      {/* Spice Tolerance */}
      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Spice Tolerance</Text>
        <View style={styles.pillContainer}>
          {SPICE_OPTIONS.map((option) => {
            const isSelected = prefs.spiceTolerance === option;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.pill, { borderColor: colors.border, backgroundColor: isSelected ? colors.primary : colors.surface }]}
                onPress={() => setPrefs(p => ({ ...p, spiceTolerance: option }))}
                accessibilityRole="button"
                accessibilityLabel={option}
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.pillText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Preferred Cuisines */}
      {renderPillSection('Preferred Cuisines', CUISINE_OPTIONS, prefs.preferredCuisines, (val) => setPrefs(p => ({ ...p, preferredCuisines: val })))}

      {/* Preferred Proteins */}
      {renderPillSection('Preferred Proteins', PROTEIN_OPTIONS, prefs.preferredProteins, (val) => setPrefs(p => ({ ...p, preferredProteins: val })))}

      {/* Allergens */}
      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Allergens</Text>
        <View style={styles.allergenInputRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0, borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
            placeholder="Add allergen (e.g., shellfish)"
            placeholderTextColor={colors.textSecondary}
            value={allergenInput}
            onChangeText={setAllergenInput}
            onSubmitEditing={addAllergen}
            returnKeyType="done"
            accessibilityLabel="Allergen input"
            accessibilityHint="Enter allergen name"
          />
          <TouchableOpacity
            style={[styles.addAllergenButton, { backgroundColor: colors.primary }]}
            onPress={addAllergen}
            accessibilityRole="button"
            accessibilityLabel="Add allergen"
          >
            <Text style={styles.addAllergenButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        {prefs.allergens.length > 0 && (
          <View style={styles.allergenTags}>
            {prefs.allergens.map((allergen) => (
              <View key={allergen} style={styles.allergenTag}>
                <Text style={styles.allergenTagText}>{allergen}</Text>
                <TouchableOpacity
                  onPress={() => removeAllergen(allergen)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${allergen}`}
                >
                  <Text style={styles.allergenTagRemove}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Calorie Preference */}
      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Calorie Preference</Text>
        <View style={styles.pillContainer}>
          {CALORIE_OPTIONS.map((option) => {
            const isSelected = prefs.caloriePreference === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.pill, { borderColor: colors.border, backgroundColor: isSelected ? colors.primary : colors.surface }]}
                onPress={() => setPrefs(p => ({ ...p, caloriePreference: option.value }))}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.pillText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Appearance */}
      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
        <View style={styles.appearanceRow}>
          {(['light', 'dark', 'system'] as const).map((option) => {
            const isSelected = mode === option;
            const iconName = option === 'light' ? 'sunny-outline' : option === 'dark' ? 'moon-outline' : 'phone-portrait-outline';
            const label = option.charAt(0).toUpperCase() + option.slice(1);
            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.appearanceOption,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                  isSelected && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                ]}
                onPress={() => setMode(option)}
                accessibilityRole="button"
                accessibilityLabel={`${label} mode`}
                accessibilityState={{ selected: isSelected }}
              >
                <Ionicons
                  name={iconName as any}
                  size={24}
                  color={isSelected ? colors.primary : colors.textSecondary}
                />
                <Text style={[
                  styles.appearanceLabel,
                  { color: colors.text },
                  isSelected && { color: colors.primary, fontWeight: '600' },
                ]}>
                  {label}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={{ marginTop: 4 }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Notifications */}
      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Get reminders for expiring pantry items, meal plans, and daily challenges.
        </Text>
        <TouchableOpacity
          style={[
            styles.notificationRow,
            {
              backgroundColor: notificationStatus === 'granted' ? colors.primaryLight : colors.surfaceSecondary,
              borderColor: notificationStatus === 'granted' ? colors.primary : colors.border,
            },
          ]}
          onPress={async () => {
            if (notificationStatus === 'granted') {
              Linking.openSettings();
            } else {
              const { status } = await Notifications.requestPermissionsAsync();
              setNotificationStatus(status);
              if (status !== 'granted') {
                Alert.alert(
                  'Notifications Disabled',
                  'Please enable notifications in your device settings.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Open Settings', onPress: () => Linking.openSettings() },
                  ]
                );
              }
            }
          }}
          accessibilityRole="button"
          accessibilityLabel={`Push notifications: ${notificationStatus === 'granted' ? 'Enabled' : 'Disabled'}`}
          accessibilityHint={notificationStatus === 'granted' ? 'Tap to open settings' : 'Tap to enable notifications'}
        >
          <Ionicons
            name={notificationStatus === 'granted' ? 'notifications' : 'notifications-off-outline'}
            size={22}
            color={notificationStatus === 'granted' ? colors.primary : colors.textSecondary}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.notificationLabel, { color: colors.text }]}>
              Push Notifications
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              {notificationStatus === 'granted' ? 'Enabled' : notificationStatus === 'denied' ? 'Disabled - tap to open settings' : 'Tap to enable'}
            </Text>
          </View>
          <Ionicons
            name={notificationStatus === 'granted' ? 'checkmark-circle' : 'chevron-forward'}
            size={20}
            color={notificationStatus === 'granted' ? colors.primary : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }, saving && styles.saveButtonDisabled]}
          onPress={handleSavePreferences}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Save preferences"
          accessibilityHint="Save all preference changes"
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Preferences'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
          onPress={() => {
            Alert.alert(
              'Logout',
              'Are you sure you want to logout?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Logout',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await logout();
                    } catch (error: any) {
                      Alert.alert('Error', 'Failed to logout');
                    }
                  },
                },
              ]
            );
          }}
          accessibilityRole="button"
          accessibilityLabel="Logout"
          accessibilityHint="Sign out of your account"
        >
          <Text style={[styles.logoutButtonText, { color: '#EF4444' }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Household
  householdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    fontSize: 18,
  },
  addMemberButton: {
    marginTop: 4,
    padding: 10,
  },
  addMemberButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Allergens
  allergenInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  addAllergenButton: {
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addAllergenButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  allergenTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  allergenTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  allergenTagText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#B91C1C',
  },
  allergenTagRemove: {
    fontSize: 14,
    color: '#B91C1C',
  },
  // Appearance
  appearanceRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  appearanceOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 6,
  },
  appearanceLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Notifications
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  notificationLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  // User Info
  userInfoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 15,
  },
  // Save
  buttonContainer: {
    padding: 16,
  },
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
