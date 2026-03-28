import React, { useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainerRef } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import OfflineBanner from './src/components/OfflineBanner';
import ErrorBoundary from './src/components/ErrorBoundary';
import { setupNotificationHandler, registerForPushNotifications } from './src/services/notifications';
import { syncOfflineActions, subscribeToNetworkChanges } from './src/services/offlineCache';
import { handleNotificationNavigation } from './src/services/notificationNavigation';

// Set up notification handler before rendering
setupNotificationHandler();

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    // Register for push notifications on launch
    registerForPushNotifications();

    // Sync offline actions when coming back online
    const unsubscribe = subscribeToNetworkChanges((isConnected) => {
      if (isConnected) {
        syncOfflineActions();
      }
    });

    // Handle notification taps for deep linking
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data && navigationRef.current) {
        handleNotificationNavigation(data, navigationRef.current);
      }
    });

    return () => {
      unsubscribe();
      subscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <AuthProvider>
              <OfflineBanner />
              <AppNavigator navigationRef={navigationRef} />
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
