import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { analyzePhoto } from '../api/recipes';
import { useTheme } from '../contexts/ThemeContext';
import { HomeStackNavigationProp } from '../types/navigation';

export default function CameraScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<HomeStackNavigationProp>();
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Request permission on mount if not already granted
  React.useEffect(() => {
    if (permission && !permission.granted && !permission.canAskAgain) {
      // Permission was denied permanently
      return;
    }
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleClose = () => {
    navigation.goBack();
  };

  const handleCapture = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera not ready. Please try again.');
      return;
    }

    try {
      setIsAnalyzing(true);

      // Capture the photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (!photo || !photo.uri) {
        throw new Error('Failed to capture photo');
      }

      // Extract file name and mime type
      const fileName = photo.uri.split('/').pop() || 'photo.jpg';
      const mimeType = 'image/jpeg';

      // Send to API for analysis
      const extractedIngredients = await analyzePhoto(photo.uri, fileName, mimeType);

      if (extractedIngredients && extractedIngredients.length > 0) {
        // Navigate back to Home with the scanned ingredients
        navigation.navigate('Home', {
          scannedIngredients: extractedIngredients,
        });
      } else {
        setIsAnalyzing(false);
        Alert.alert(
          'No Ingredients Found',
          'Could not detect ingredients in this photo. Please try again with a clearer image.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      setIsAnalyzing(false);
      console.error('Camera capture error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to analyze photo. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Loading state while checking permissions
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionMessage}>
            Please grant camera access to scan ingredients from photos.
          </Text>
          {permission.canAskAgain ? (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={requestPermission}
            >
              <Text style={styles.primaryButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.permissionDeniedText}>
              Camera access was denied. Please enable it in your device settings.
            </Text>
          )}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleClose}
          >
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        {/* Close button - top left */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Capture button - bottom center */}
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
            disabled={isAnalyzing}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>

        {/* Guide text */}
        <View style={styles.guideContainer}>
          <Text style={styles.guideText}>
            Point camera at ingredients and tap to capture
          </Text>
        </View>
      </CameraView>

      {/* Analyzing overlay */}
      {isAnalyzing && (
        <View style={styles.analyzingOverlay}>
          <View style={[styles.analyzingCard, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.analyzingText, { color: colors.text }]}>Analyzing ingredients...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  guideContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  guideText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
  },
  analyzingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  permissionContainer: {
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.9,
  },
  permissionDeniedText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 12,
    minWidth: 200,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 200,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
