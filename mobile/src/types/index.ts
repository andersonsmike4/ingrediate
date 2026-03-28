export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface Recipe {
  id?: number;
  name: string;
  description: string;
  cook_time: string;
  difficulty: string;
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
  nutrition: Nutrition | null;
  substitutions?: Substitution[];
  is_public?: boolean;
  likes_count?: number;
  user_liked?: boolean;
}

export interface Ingredient {
  name: string;
  amount: string;
}

export interface Nutrition {
  calories?: number;
  protein?: string;
  carbs?: string;
  fat?: string;
  fiber?: string;
}

export interface Substitution {
  original: string;
  replacement: string;
  reason: string;
}

export interface PantryItem {
  id: number;
  name: string;
  quantity: string | null;
  category: string;
  expires_at: string | null;
  created_at: string;
}

export interface ShoppingListItem {
  id: number;
  name: string;
  amount: string | null;
  source: string | null;
  checked: boolean;
  created_at: string;
}

export interface MealPlan {
  id: number;
  name: string;
  start_date: string;
  num_days: number;
  meal_plan_entries: MealPlanEntry[];
}

export interface MealPlanEntry {
  id: number;
  date: string;
  meal_type: string;
  saved_recipe?: Recipe;
  eating_out: boolean;
  note: string | null;
}

export interface RecipeFilters {
  dietary?: string;
  cuisine?: string;
  cookTime?: string;
  difficulty?: string;
  servings?: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthStatusResponse {
  authenticated: boolean;
  user: User | null;
}

export interface Collection {
  id: number;
  name: string;
  description: string;
  share_token?: string;
  recipes?: Recipe[];
}

export interface CookingLog {
  id: number;
  saved_recipe: Recipe | null;
  cooked_at: string;
}

export interface NutritionGoal {
  daily_calories: number | null;
  daily_protein: number | null;
  daily_carbs: number | null;
  daily_fat: number | null;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  points: number;
  category: string;
  unlocked: boolean;
  unlocked_at: string | null;
}

export interface CookingChallenge {
  id: number;
  challenge_text: string;
  challenge_type: string;
  difficulty: string;
  tips: string[];
  challenge_date: string;
  submitted: boolean;
}

export interface GroceryPurchase {
  id: number;
  item_name: string;
  actual_price_cents: number;
  purchased_at: string;
  store_name: string;
}

export interface SubstitutionLogEntry {
  id: number;
  original_ingredient: string;
  substitute_ingredient: string;
  recipe_name: string | null;
  notes: string | null;
  rating: number | null;
}

// Re-export navigation types for convenience
export * from './navigation';
