import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fetchBudgetSummary, logPurchase } from '../api/budget';
import useAsyncData from '../hooks/useAsyncData';
import SkeletonLoader from '../components/SkeletonLoader';
import { sharedStyles } from '../styles/shared';
import { formatCurrency, formatShortDate } from '../utils/formatters';

interface BudgetSummary {
  total_estimated?: number;
  total_actual?: number;
  purchases?: Array<{
    id: number;
    item_name: string;
    actual_price_cents: number;
    store_name: string;
    purchased_at: string;
  }>;
}

export default function BudgetScreen() {
  const { colors } = useTheme();
  const [logging, setLogging] = useState(false);

  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [storeName, setStoreName] = useState('');

  const fetchSummary = useCallback(async () => {
    const data: any = await fetchBudgetSummary();
    return (data.summary || data) as BudgetSummary;
  }, []);

  const { data: summary, loading, reload } = useAsyncData<BudgetSummary>({
    fetchFn: fetchSummary,
    errorMessage: 'Failed to load budget summary',
  });

  const handleLogPurchase = async () => {
    if (!itemName.trim() || !price.trim()) {
      Alert.alert('Error', 'Please enter item name and price');
      return;
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue < 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    try {
      setLogging(true);
      await logPurchase(
        itemName.trim(),
        Math.round(priceValue * 100),
        new Date().toISOString().split('T')[0],
        storeName.trim() || ''
      );
      Alert.alert('Success', 'Purchase logged');
      setItemName('');
      setPrice('');
      setStoreName('');
      await reload();
    } catch (error) {
      Alert.alert('Error', 'Failed to log purchase');
    } finally {
      setLogging(false);
    }
  };

  if (loading) {
    return (
      <View style={[sharedStyles.flex1, { backgroundColor: colors.background, padding: 16 }]}>
        <SkeletonLoader lines={3} style={{ marginBottom: 16 }} />
        <SkeletonLoader lines={4} style={{ marginBottom: 16 }} />
        <SkeletonLoader lines={2} />
      </View>
    );
  }

  const s = summary || {};

  return (
    <ScrollView style={[sharedStyles.flex1, { backgroundColor: colors.background }]}>
      <View style={[sharedStyles.section, { borderBottomColor: colors.border }]}>
        <Text style={[sharedStyles.sectionTitle, { color: colors.text }]}>Budget Summary</Text>
        <View style={[sharedStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {s.total_estimated !== undefined && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Estimated:</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {formatCurrency(s.total_estimated)}
              </Text>
            </View>
          )}
          {s.total_actual !== undefined && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Actual:</Text>
              <Text style={[
                styles.summaryValue,
                { color: colors.text },
                s.total_actual > (s.total_estimated || 0) && { color: colors.error }
              ]}>
                {formatCurrency(s.total_actual)}
              </Text>
            </View>
          )}
          {s.total_estimated !== undefined && s.total_actual !== undefined && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Difference:</Text>
              <Text style={[
                styles.summaryValue,
                { color: s.total_actual > s.total_estimated ? colors.error : colors.success }
              ]}>
                {formatCurrency(Math.abs(s.total_actual - s.total_estimated))}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={[sharedStyles.section, { borderBottomColor: colors.border }]}>
        <Text style={[sharedStyles.sectionTitle, { color: colors.text }]}>Log Purchase</Text>

        {[
          { label: 'Item Name', value: itemName, setter: setItemName, placeholder: 'e.g., Tomatoes' },
          { label: 'Price', value: price, setter: setPrice, placeholder: '0.00', keyboardType: 'decimal-pad' as const },
          { label: 'Store Name (optional)', value: storeName, setter: setStoreName, placeholder: 'e.g., Whole Foods' },
        ].map(({ label, value, setter, placeholder, keyboardType }) => (
          <View key={label} style={sharedStyles.inputGroup}>
            <Text style={[sharedStyles.inputLabel, { color: colors.text }]}>{label}</Text>
            <TextInput
              style={[sharedStyles.input, { borderColor: colors.border, color: colors.text }]}
              value={value}
              onChangeText={setter}
              placeholder={placeholder}
              keyboardType={keyboardType}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[sharedStyles.primaryButton, { backgroundColor: colors.primary, marginTop: 8 }, logging && sharedStyles.buttonDisabled]}
          onPress={handleLogPurchase}
          disabled={logging}
        >
          <Text style={sharedStyles.primaryButtonText}>
            {logging ? 'Logging...' : 'Log Purchase'}
          </Text>
        </TouchableOpacity>
      </View>

      {s.purchases && s.purchases.length > 0 && (
        <View style={{ padding: 16 }}>
          <Text style={[sharedStyles.sectionTitle, { color: colors.text }]}>Recent Purchases</Text>
          {s.purchases.map((purchase) => (
            <View key={purchase.id} style={[sharedStyles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <View style={styles.purchaseHeader}>
                <Text style={[styles.purchaseName, { color: colors.text }]}>{purchase.item_name}</Text>
                <Text style={[styles.purchasePrice, { color: colors.primary }]}>
                  {formatCurrency(purchase.actual_price_cents)}
                </Text>
              </View>
              <View style={styles.purchaseFooter}>
                {purchase.store_name && (
                  <Text style={[styles.purchaseStore, { color: colors.textSecondary }]}>{purchase.store_name}</Text>
                )}
                <Text style={[styles.purchaseDate, { color: colors.textSecondary }]}>
                  {formatShortDate(purchase.purchased_at)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  purchaseName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  purchasePrice: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  purchaseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  purchaseStore: {
    fontSize: 14,
  },
  purchaseDate: {
    fontSize: 12,
  },
});
