import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { addPantryItem } from '../api/pantry';
import { theme } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { PANTRY_CATEGORIES } from '../constants';

const { width, height } = Dimensions.get('window');

interface OpenFoodFactsResponse {
  status: number;
  product?: {
    product_name?: string;
    brands?: string;
  };
}

export default function BarcodeScannerScreen() {
  const { colors, borderRadius } = useTheme();
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [productName, setProductName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('other');
  const [manualEntry, setManualEntry] = useState(false);

  React.useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const lookupProduct = async (barcode: string): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
      );
      const data: OpenFoodFactsResponse = await response.json();

      if (data.status === 1 && data.product?.product_name) {
        return data.product.product_name;
      }
      return null;
    } catch (error) {
      console.error('Failed to lookup product:', error);
      return null;
    }
  };

  const handleBarCodeScanned = async (result: { type: string; data: string }) => {
    if (scanned || processing) {
      return;
    }

    setScanned(true);
    setProcessing(true);

    try {
      const name = await lookupProduct(result.data);

      if (name) {
        setProductName(name);
        setManualEntry(false);
        setShowConfirmModal(true);
      } else {
        Alert.alert(
          'Product Not Found',
          'We couldn\'t find this product. Would you like to enter the name manually?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                setScanned(false);
              },
            },
            {
              text: 'Enter Manually',
              onPress: () => {
                setProductName('');
                setManualEntry(true);
                setShowConfirmModal(true);
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to scan barcode. Please try again.');
      console.error(error);
      setScanned(false);
    } finally {
      setProcessing(false);
    }
  };

  const handleAddToPantry = async () => {
    const name = productName.trim();
    if (!name) {
      Alert.alert('Error', 'Please enter a product name');
      return;
    }

    try {
      await addPantryItem(name, selectedCategory, null);
      setShowConfirmModal(false);
      Alert.alert('Success', `${name} added to your pantry!`, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add item to pantry');
      console.error(error);
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleCancelModal = () => {
    setShowConfirmModal(false);
    setProductName('');
    setManualEntry(false);
    setSelectedCategory('other');
    setScanned(false);
  };

  if (!permission) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>No access to camera</Text>
        <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
          Please enable camera permissions in your device settings
        </Text>
        <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.primary }]} onPress={handleClose}>
          <Text style={styles.closeButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay with targeting rectangle */}
      <View style={styles.overlay}>
        {/* Top overlay */}
        <View style={styles.overlayTop}>
          <TouchableOpacity style={styles.closeIconButton} onPress={handleClose}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Middle section with targeting rectangle */}
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.targetingRectangle}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
          <View style={styles.overlaySide} />
        </View>

        {/* Bottom overlay */}
        <View style={styles.overlayBottom}>
          <Text style={styles.instructionText}>
            {processing
              ? 'Looking up product...'
              : 'Position barcode within the frame'}
          </Text>
          {processing && <ActivityIndicator size="small" color="#FFFFFF" />}
        </View>
      </View>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="slide"
        onRequestClose={handleCancelModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: borderRadius.xl }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {manualEntry ? 'Enter Product Name' : 'Product Found'}
            </Text>

            {manualEntry ? (
              <TextInput
                style={[styles.modalInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface, borderRadius: borderRadius.md }]}
                placeholder="Product name"
                value={productName}
                onChangeText={setProductName}
                placeholderTextColor={colors.textSecondary}
                autoFocus
              />
            ) : (
              <Text style={[styles.modalProductName, { color: colors.text }]}>{productName}</Text>
            )}

            <Text style={[styles.modalLabel, { color: colors.text }]}>Category</Text>
            <View style={styles.modalCategoryGrid}>
              {PANTRY_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.modalCategoryPill,
                    { borderColor: colors.border, backgroundColor: colors.surface },
                    selectedCategory === category && [styles.modalCategoryPillSelected, { backgroundColor: colors.primary, borderColor: colors.primary }],
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.modalCategoryPillText,
                      { color: colors.text },
                      selectedCategory === category &&
                        styles.modalCategoryPillTextSelected,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius.md }]}
                onPress={handleCancelModal}
              >
                <Text style={[styles.modalButtonTextCancel, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonAdd, { backgroundColor: colors.primary, borderRadius: borderRadius.md }]}
                onPress={handleAddToPantry}
              >
                <Text style={styles.modalButtonTextAdd}>Add to Pantry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  closeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  overlayTop: {
    height: height * 0.2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-start',
    paddingTop: 50,
    paddingLeft: 20,
  },
  closeIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '300',
  },
  overlayMiddle: {
    flexDirection: 'row',
    flex: 1,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  targetingRectangle: {
    width: width * 0.7,
    height: width * 0.5,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: theme.colors.primary,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  overlayBottom: {
    height: height * 0.25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalProductName: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  modalCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 8,
  },
  modalCategoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 4,
    marginBottom: 4,
  },
  modalCategoryPillSelected: {
  },
  modalCategoryPillText: {
    fontSize: 13,
    textTransform: 'capitalize',
  },
  modalCategoryPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    borderWidth: 1,
  },
  modalButtonAdd: {
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextAdd: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
