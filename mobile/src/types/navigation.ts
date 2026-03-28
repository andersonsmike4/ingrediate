import { Recipe, MealPlan, Collection } from './index';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';

// Root tab navigator param list
export type RootTabParamList = {
  HomeTab: undefined;
  KitchenTab: undefined;
  Shopping: undefined;
  PlanTrackTab: undefined;
};

// Home stack param list
export type HomeStackParamList = {
  Home: { scannedIngredients?: string[] } | undefined;
  RecipeDetail: { recipe: Recipe; fromSaved?: boolean };
  Camera: undefined;
  BarcodeScanner: undefined;
  SavedRecipes: undefined;
  Collections: undefined;
  CollectionDetail: { collectionId: number; collectionName: string };
  Preferences: undefined;
};

// Kitchen stack param list
export type KitchenStackParamList = {
  KitchenHub: undefined;
  PantryMain: undefined;
  ReceiptScan: undefined;
  KitchenTimers: undefined;
  Substitutions: { recipe?: Recipe };
  SmartSuggestions: undefined;
};

// Plan & Track stack param list
export type PlanTrackStackParamList = {
  PlanTrackHub: undefined;
  MealPlanner: undefined;
  MealPlanDetail: { planId: number };
  CookingHistory: undefined;
  Nutrition: undefined;
  Achievements: undefined;
  Challenges: undefined;
  Budget: undefined;
  CommunityFeed: undefined;
  RecipeDetail: { recipe: Recipe; fromSaved?: boolean };
};

// Auth stack param list
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

// Helper types for navigation props
export type HomeStackNavigationProp = NativeStackNavigationProp<HomeStackParamList>;
export type KitchenStackNavigationProp = NativeStackNavigationProp<KitchenStackParamList>;
export type PlanTrackStackNavigationProp = NativeStackNavigationProp<PlanTrackStackParamList>;
export type AuthStackNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

// Composite navigation types for screens in nested stacks
export type HomeTabNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  BottomTabNavigationProp<RootTabParamList>
>;

export type KitchenTabNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<KitchenStackParamList>,
  BottomTabNavigationProp<RootTabParamList>
>;

export type PlanTrackTabNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<PlanTrackStackParamList>,
  BottomTabNavigationProp<RootTabParamList>
>;
