import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { scanReceipt } from '../api/pantry';
import { PantryItem } from '../types';
import { theme } from '../theme';

export default function ReceiptScanScreen() {
  const navigation = useNavigation();
  const { colors, borderRadius } = useTheme();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<{
    pantry_items: PantryItem[];
    purchases: any[];
    parsed_count: number;
    added_count: number;
  } | null>(null);

  const pickImage = async (useCamera: boolean) => {
    try {
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission Required', 'Please allow camera access to take receipt photos.');
          return;
        }
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission Required', 'Please allow photo library access.');
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: false })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.8, allowsEditing: false });

      if (!result.canceled && result.assets?.[0]) {
        setImageUri(result.assets[0].uri);
        setResults(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image.');
      console.error(error);
    }
  };

  const handleScan = async () => {
    if (!imageUri) return;

    setScanning(true);
    try {
      const fileName = imageUri.split('/').pop() || 'receipt.jpg';
      const mimeType = 'image/jpeg';
      const data = await scanReceipt(imageUri, fileName, mimeType);
      setResults(data);

      if (data.added_count === 0) {
        Alert.alert('No Items Found', 'Could not find food items on this receipt. Try a clearer photo.');
      }
    } catch (error: any) {
      console.error('Receipt scan error:', error);
      Alert.alert('Error', error.message || 'Failed to scan receipt. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Loading overlay */}
      <Modal visible={scanning} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingCard, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Scanning receipt...</Text>
            <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>
              Extracting items and prices
            </Text>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero section */}
        <View style={styles.heroSection}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="receipt-outline" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Scan Receipt</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Take a photo of your grocery receipt to auto-add items to your pantry and track spending.
          </Text>
        </View>

        {/* Image capture buttons */}
        {!imageUri && (
          <View style={styles.captureSection}>
            <TouchableOpacity
              style={[styles.captureButton, { backgroundColor: colors.primary }]}
              onPress={() => pickImage(true)}
            >
              <Ionicons name="camera" size={24} color="#FFFFFF" />
              <Text style={styles.captureButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.captureButton, { backgroundColor: colors.surface, borderColor: colors.inputBorder, borderWidth: 1 }]}
              onPress={() => pickImage(false)}
            >
              <Ionicons name="images-outline" size={24} color={colors.text} />
              <Text style={[styles.captureButtonText, { color: colors.text }]}>From Library</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Image preview */}
        {imageUri && !results && (
          <View style={styles.previewSection}>
            <Image source={{ uri: imageUri }} style={[styles.previewImage, { borderColor: colors.border }]} resizeMode="contain" />
            <View style={styles.previewActions}>
              <TouchableOpacity
                style={[styles.retakeButton, { borderColor: colors.inputBorder }]}
                onPress={() => { setImageUri(null); setResults(null); }}
              >
                <Ionicons name="refresh-outline" size={18} color={colors.text} />
                <Text style={[styles.retakeText, { color: colors.text }]}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.scanButton, { backgroundColor: colors.primary }]}
                onPress={handleScan}
              >
                <Ionicons name="scan-outline" size={18} color="#FFFFFF" />
                <Text style={styles.scanButtonText}>Scan Receipt</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Results */}
        {results && (
          <View style={styles.resultsSection}>
            <View style={[styles.resultsSummary, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              <Text style={[styles.resultsSummaryText, { color: colors.primary }]}>
                Added {results.added_count} of {results.parsed_count} items to pantry
                {results.purchases.length > 0 && ` and logged ${results.purchases.length} purchase${results.purchases.length !== 1 ? 's' : ''}`}
              </Text>
            </View>

            {results.pantry_items.length > 0 && (
              <View style={styles.resultsGroup}>
                <Text style={[styles.resultsGroupTitle, { color: colors.text }]}>Pantry Items Added</Text>
                {results.pantry_items.map((item) => (
                  <View key={item.id} style={[styles.resultItem, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                    <View style={styles.resultItemContent}>
                      <Text style={[styles.resultItemName, { color: colors.text }]}>{item.name}</Text>
                      {item.quantity && (
                        <Text style={[styles.resultItemDetail, { color: colors.textSecondary }]}>{item.quantity}</Text>
                      )}
                    </View>
                    <View style={[styles.categoryBadge, { backgroundColor: colors.surfaceSecondary }]}>
                      <Text style={[styles.categoryBadgeText, { color: colors.textSecondary }]}>{item.category}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {results.purchases.length > 0 && (
              <View style={styles.resultsGroup}>
                <Text style={[styles.resultsGroupTitle, { color: colors.text }]}>Purchases Logged</Text>
                {results.purchases.map((purchase: any, index: number) => (
                  <View key={index} style={[styles.resultItem, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.resultItemName, { color: colors.text }]}>{purchase.item_name}</Text>
                    {purchase.actual_price_cents && (
                      <Text style={[styles.resultItemPrice, { color: colors.primary }]}>
                        ${(purchase.actual_price_cents / 100).toFixed(2)}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            <View style={styles.doneActions}>
              <TouchableOpacity
                style={[styles.scanAnotherButton, { borderColor: colors.inputBorder }]}
                onPress={() => { setImageUri(null); setResults(null); }}
              >
                <Ionicons name="camera-outline" size={18} color={colors.text} />
                <Text style={[styles.scanAnotherText, { color: colors.text }]}>Scan Another</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.doneButton, { backgroundColor: colors.primary }]}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  captureSection: {
    gap: 12,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 18,
    borderRadius: theme.borderRadius.lg,
  },
  captureButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  previewSection: {
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 360,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    marginBottom: 16,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
  },
  retakeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: theme.borderRadius.md,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  loadingText: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: '600',
  },
  loadingSubtext: {
    marginTop: 6,
    fontSize: 14,
  },
  resultsSection: {
    gap: 16,
  },
  resultsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: theme.borderRadius.lg,
  },
  resultsSummaryText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  resultsGroup: {
    gap: 8,
  },
  resultsGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
  },
  resultItemContent: {
    flex: 1,
  },
  resultItemName: {
    fontSize: 15,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  resultItemDetail: {
    fontSize: 13,
    marginTop: 2,
  },
  resultItemPrice: {
    fontSize: 15,
    fontWeight: '600',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  doneActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  scanAnotherButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
  },
  scanAnotherText: {
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: theme.borderRadius.md,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
