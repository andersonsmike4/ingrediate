import React, { useMemo } from 'react';
import { NavigationContainer, NavigationContainerRef, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  AuthStackParamList,
  HomeStackParamList,
  KitchenStackParamList,
  PlanTrackStackParamList,
  RootTabParamList,
} from '../types/navigation';

// Auth screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';

// Core screens
import HomeScreen from '../screens/HomeScreen';
import PantryScreen from '../screens/PantryScreen';
import ShoppingScreen from '../screens/ShoppingScreen';
import SavedRecipesScreen from '../screens/SavedRecipesScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import CameraScreen from '../screens/CameraScreen';
import BarcodeScannerScreen from '../screens/BarcodeScannerScreen';
import KitchenHubScreen from '../screens/KitchenHubScreen';
import PlanTrackHubScreen from '../screens/PlanTrackHubScreen';

// Phase 4 screens
import MealPlannerScreen from '../screens/MealPlannerScreen';
import MealPlanDetailScreen from '../screens/MealPlanDetailScreen';
import CommunityFeedScreen from '../screens/CommunityFeedScreen';
import CollectionsScreen from '../screens/CollectionsScreen';
import CollectionDetailScreen from '../screens/CollectionDetailScreen';
import NutritionScreen from '../screens/NutritionScreen';
import CookingHistoryScreen from '../screens/CookingHistoryScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import ChallengesScreen from '../screens/ChallengesScreen';
import BudgetScreen from '../screens/BudgetScreen';
import PreferencesScreen from '../screens/PreferencesScreen';

// Phase 5+ screens
import SmartSuggestionsScreen from '../screens/SmartSuggestionsScreen';
import KitchenTimersScreen from '../screens/KitchenTimersScreen';
import SubstitutionsScreen from '../screens/SubstitutionsScreen';
import ReceiptScanScreen from '../screens/ReceiptScanScreen';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeStackNav = createNativeStackNavigator<HomeStackParamList>();
const KitchenStackNav = createNativeStackNavigator<KitchenStackParamList>();
const PlanTrackStackNav = createNativeStackNavigator<PlanTrackStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICONS: { [key: string]: [string, string] } = {
  HomeTab: ['flame-outline', 'flame'],
  KitchenTab: ['grid-outline', 'grid'],
  Shopping: ['cart-outline', 'cart'],
  PlanTrackTab: ['stats-chart-outline', 'stats-chart'],
};

function getHeaderOptions(colors: any) {
  return {
    headerStyle: { backgroundColor: colors.primary },
    headerTintColor: '#FFFFFF',
    headerTitleStyle: { fontWeight: 'bold' as const },
  };
}

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const { colors } = useTheme();
  const [outline, filled] = TAB_ICONS[name] || ['ellipse-outline', 'ellipse'];

  return (
    <Ionicons
      name={(focused ? filled : outline) as any}
      size={24}
      color={focused ? colors.primary : colors.textMuted}
    />
  );
}

function AuthStackScreen() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

function HomeStack() {
  const { colors } = useTheme();
  const headerOptions = getHeaderOptions(colors);

  return (
    <HomeStackNav.Navigator
      screenOptions={{
        animation: 'slide_from_right' as const,
        gestureEnabled: true,
      }}
    >
      <HomeStackNav.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStackNav.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ ...headerOptions, title: 'Recipe' }} />
      <HomeStackNav.Screen name="Camera" component={CameraScreen} options={{ headerShown: false }} />
      <HomeStackNav.Screen name="BarcodeScanner" component={BarcodeScannerScreen} options={{ headerShown: false }} />
      <HomeStackNav.Screen name="SavedRecipes" component={SavedRecipesScreen} options={{ ...headerOptions, title: 'Saved Recipes' }} />
      <HomeStackNav.Screen name="Collections" component={CollectionsScreen} options={{ ...headerOptions, title: 'Collections' }} />
      <HomeStackNav.Screen name="CollectionDetail" component={CollectionDetailScreen} options={{ ...headerOptions, title: 'Collection' }} />
      <HomeStackNav.Screen name="Preferences" component={PreferencesScreen} options={{ ...headerOptions, title: 'Settings' }} />
    </HomeStackNav.Navigator>
  );
}

function KitchenStack() {
  const { colors } = useTheme();
  const headerOptions = getHeaderOptions(colors);

  return (
    <KitchenStackNav.Navigator
      screenOptions={{
        animation: 'slide_from_right' as const,
        gestureEnabled: true,
      }}
    >
      <KitchenStackNav.Screen name="KitchenHub" component={KitchenHubScreen} options={{ headerShown: false }} />
      <KitchenStackNav.Screen name="PantryMain" component={PantryScreen} options={{ ...headerOptions, title: 'My Pantry' }} />
      <KitchenStackNav.Screen name="ReceiptScan" component={ReceiptScanScreen} options={{ ...headerOptions, title: 'Scan Receipt' }} />
      <KitchenStackNav.Screen name="KitchenTimers" component={KitchenTimersScreen} options={{ ...headerOptions, title: 'Kitchen Timers' }} />
      <KitchenStackNav.Screen name="Substitutions" component={SubstitutionsScreen} options={{ ...headerOptions, title: 'Substitutions' }} />
      <KitchenStackNav.Screen name="SmartSuggestions" component={SmartSuggestionsScreen} options={{ ...headerOptions, title: 'Smart Suggestions' }} />
    </KitchenStackNav.Navigator>
  );
}

function PlanTrackStack() {
  const { colors } = useTheme();
  const headerOptions = getHeaderOptions(colors);

  return (
    <PlanTrackStackNav.Navigator
      screenOptions={{
        animation: 'slide_from_right' as const,
        gestureEnabled: true,
      }}
    >
      <PlanTrackStackNav.Screen name="PlanTrackHub" component={PlanTrackHubScreen} options={{ headerShown: false }} />
      <PlanTrackStackNav.Screen name="MealPlanner" component={MealPlannerScreen} options={{ ...headerOptions, title: 'Meal Plans' }} />
      <PlanTrackStackNav.Screen name="MealPlanDetail" component={MealPlanDetailScreen} options={{ ...headerOptions, title: 'Meal Plan' }} />
      <PlanTrackStackNav.Screen name="CookingHistory" component={CookingHistoryScreen} options={{ ...headerOptions, title: 'Cooking History' }} />
      <PlanTrackStackNav.Screen name="Nutrition" component={NutritionScreen} options={{ ...headerOptions, title: 'Nutrition' }} />
      <PlanTrackStackNav.Screen name="Achievements" component={AchievementsScreen} options={{ ...headerOptions, title: 'Achievements' }} />
      <PlanTrackStackNav.Screen name="Challenges" component={ChallengesScreen} options={{ ...headerOptions, title: 'Challenges' }} />
      <PlanTrackStackNav.Screen name="Budget" component={BudgetScreen} options={{ ...headerOptions, title: 'Budget' }} />
      <PlanTrackStackNav.Screen name="CommunityFeed" component={CommunityFeedScreen} options={{ ...headerOptions, title: 'Community' }} />
      <PlanTrackStackNav.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ ...headerOptions, title: 'Recipe' }} />
    </PlanTrackStackNav.Navigator>
  );
}

function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          title: 'Recipes',
          headerShown: false,
          tabBarAccessibilityLabel: 'Recipes tab',
        }}
      />
      <Tab.Screen
        name="KitchenTab"
        component={KitchenStack}
        options={{
          title: 'Kitchen',
          headerShown: false,
          tabBarAccessibilityLabel: 'Kitchen tab',
        }}
      />
      <Tab.Screen
        name="Shopping"
        component={ShoppingScreen}
        options={{
          title: 'Shopping',
          tabBarAccessibilityLabel: 'Shopping tab',
        }}
      />
      <Tab.Screen
        name="PlanTrackTab"
        component={PlanTrackStack}
        options={{
          title: 'Plan & Track',
          headerShown: false,
          tabBarAccessibilityLabel: 'Plan and Track tab',
        }}
      />
    </Tab.Navigator>
  );
}

interface AppNavigatorProps {
  navigationRef?: React.RefObject<NavigationContainerRef<any> | null>;
}

export default function AppNavigator({ navigationRef }: AppNavigatorProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors, isDark } = useTheme();

  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const navTheme = useMemo(() => ({
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  }), [isDark, colors]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, fontSize: 16, color: colors.secondary }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {isAuthenticated ? <MainTabs /> : <AuthStackScreen />}
    </NavigationContainer>
  );
}
