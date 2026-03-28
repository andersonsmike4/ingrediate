import { csrfToken } from "./csrf";

export async function generateRecipes(ingredients, filters) {
  const response = await fetch("/api/recipes/generate", {
    method: "POST",
    headers: {
      "X-CSRF-Token": csrfToken(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ingredients,
      dietary: filters.dietary,
      cuisine: filters.cuisine,
      cook_time: filters.cookTime,
      difficulty: filters.difficulty,
      servings: filters.servings
    })
  });

  if (!response.ok) throw new Error("Failed to generate recipes");

  const data = await response.json();
  return data.recipes || [];
}

export async function searchByMealName(mealName) {
  const response = await fetch("/api/recipes/search", {
    method: "POST",
    headers: {
      "X-CSRF-Token": csrfToken(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ meal_name: mealName })
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to search recipes");
  }
  const data = await response.json();
  return data.recipes || [];
}

export async function analyzePhoto(file) {
  const formData = new FormData();
  formData.append("photo", file);

  const response = await fetch("/api/ingredients/analyze_photo", {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken() },
    body: formData
  });

  if (!response.ok) throw new Error("Failed to analyze photo");

  const data = await response.json();
  return data.ingredients || [];
}

export async function saveRecipe(recipe) {
  const response = await fetch("/api/recipes/saved", {
    method: "POST",
    headers: {
      "X-CSRF-Token": csrfToken(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      recipe: {
        name: recipe.name,
        description: recipe.description,
        cook_time: recipe.cook_time,
        difficulty: recipe.difficulty,
        servings: recipe.servings,
        ingredients_json: JSON.stringify(recipe.ingredients),
        steps_json: JSON.stringify(recipe.steps),
        nutrition_json: JSON.stringify(recipe.nutrition),
        substitutions_json: JSON.stringify(recipe.substitutions || [])
      }
    })
  });

  if (!response.ok) throw new Error("Failed to save recipe");
  return response.json();
}

export async function fetchSavedRecipes() {
  const response = await fetch("/api/recipes/saved");
  if (!response.ok) throw new Error("Failed to fetch saved recipes");

  const data = await response.json();
  return (data.recipes || []).map(parseRecipeJson);
}

export async function deleteSavedRecipe(id) {
  const response = await fetch(`/api/recipes/saved/${id}`, {
    method: "DELETE",
    headers: { "X-CSRF-Token": csrfToken() }
  });

  if (!response.ok) throw new Error("Failed to delete recipe");
}

export async function updateSavedRecipe(id, updates) {
  const response = await fetch(`/api/recipes/saved/${id}`, {
    method: "PATCH",
    headers: {
      "X-CSRF-Token": csrfToken(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ recipe: updates })
  });

  if (!response.ok) throw new Error("Failed to update recipe");
  return response.json();
}

// Meal Plans
export async function fetchMealPlans() {
  const response = await fetch("/api/meal_plans");
  if (!response.ok) throw new Error("Failed to fetch meal plans");
  const data = await response.json();
  return (data.meal_plans || []).map(plan => ({
    ...plan,
    meal_plan_entries: (plan.meal_plan_entries || []).map(entry => ({
      ...entry,
      saved_recipe: entry.saved_recipe ? parseRecipeJson(entry.saved_recipe) : null
    }))
  }));
}

export async function createMealPlan(name, startDate, numDays) {
  const response = await fetch("/api/meal_plans", {
    method: "POST",
    headers: {
      "X-CSRF-Token": csrfToken(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, start_date: startDate, num_days: numDays })
  });
  if (!response.ok) throw new Error("Failed to create meal plan");
  return response.json();
}

export async function deleteMealPlan(id) {
  const response = await fetch(`/api/meal_plans/${id}`, {
    method: "DELETE",
    headers: { "X-CSRF-Token": csrfToken() }
  });
  if (!response.ok) throw new Error("Failed to delete meal plan");
}

export async function addMealPlanEntry(planId, { date, mealType, savedRecipeId, eatingOut, note }) {
  const response = await fetch(`/api/meal_plans/${planId}/entries`, {
    method: "POST",
    headers: {
      "X-CSRF-Token": csrfToken(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      date,
      meal_type: mealType,
      saved_recipe_id: savedRecipeId,
      eating_out: eatingOut,
      note
    })
  });
  if (!response.ok) throw new Error("Failed to add entry");
  return response.json();
}

export async function removeMealPlanEntry(planId, entryId) {
  const response = await fetch(`/api/meal_plans/${planId}/entries/${entryId}`, {
    method: "DELETE",
    headers: { "X-CSRF-Token": csrfToken() }
  });
  if (!response.ok) throw new Error("Failed to remove entry");
}

export async function fetchMealPlanShoppingList(planId) {
  const response = await fetch(`/api/meal_plans/${planId}/shopping_list`);
  if (!response.ok) throw new Error("Failed to fetch shopping list");
  return response.json();
}

// Sharing
export async function shareRecipe(id) {
  const response = await fetch(`/api/recipes/saved/${id}/share`, {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken() }
  });
  if (!response.ok) throw new Error("Failed to share recipe");
  return response.json();
}

export async function fetchSharedRecipe(token) {
  const response = await fetch(`/api/recipes/shared/${token}`);
  if (!response.ok) throw new Error("Recipe not found");
  const data = await response.json();
  return parseRecipeJson(data.recipe);
}

// Pantry
export async function fetchPantryItems() {
  const response = await fetch("/api/pantry");
  if (!response.ok) throw new Error("Failed to fetch pantry");
  return response.json();
}

export async function addPantryItem(name, category, expiresAt, quantity) {
  const response = await fetch("/api/pantry", {
    method: "POST",
    headers: {
      "X-CSRF-Token": csrfToken(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, category, expires_at: expiresAt || null, quantity: quantity || null })
  });
  if (!response.ok) throw new Error("Failed to add pantry item");
  return response.json();
}

export async function bulkAddPantryItems(items) {
  const response = await fetch("/api/pantry/bulk", {
    method: "POST",
    headers: {
      "X-CSRF-Token": csrfToken(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ items })
  });
  if (!response.ok) throw new Error("Failed to add pantry items");
  return response.json();
}

export async function deletePantryItem(id) {
  const response = await fetch(`/api/pantry/${id}`, {
    method: "DELETE",
    headers: { "X-CSRF-Token": csrfToken() }
  });
  if (!response.ok) throw new Error("Failed to delete pantry item");
}

export async function clearPantry() {
  const response = await fetch("/api/pantry", {
    method: "DELETE",
    headers: { "X-CSRF-Token": csrfToken() }
  });
  if (!response.ok) throw new Error("Failed to clear pantry");
}

export async function voiceAddPantryItems(text) {
  const response = await fetch("/api/pantry/voice", {
    method: "POST",
    headers: {
      "X-CSRF-Token": csrfToken(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text })
  });
  if (!response.ok) throw new Error("Failed to process voice input");
  return response.json();
}

export async function scanReceipt(file) {
  const formData = new FormData();
  formData.append("photo", file);

  const response = await fetch("/api/pantry/scan_receipt", {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken() },
    body: formData
  });

  if (!response.ok) throw new Error("Failed to scan receipt");
  return response.json();
}

// Recipe Import
export async function importRecipeFromUrl(url) {
  const response = await fetch("/api/recipes/import_url", {
    method: "POST",
    headers: {
      "X-CSRF-Token": csrfToken(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url })
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to import recipe");
  }
  const data = await response.json();
  return parseRecipeJson(data.recipe);
}

// AI Substitutions
export async function suggestSubstitutions(recipeId, ingredient) {
  const response = await fetch(`/api/recipes/saved/${recipeId}/substitutions`, {
    method: "POST",
    headers: {
      "X-CSRF-Token": csrfToken(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ ingredient })
  });
  if (!response.ok) throw new Error("Failed to get substitutions");
  return response.json();
}

// Cost Estimation
export async function estimateRecipeCost(recipeId) {
  const response = await fetch(`/api/recipes/saved/${recipeId}/estimate_cost`, {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken() }
  });
  if (!response.ok) throw new Error("Failed to estimate cost");
  return response.json();
}

// Cooking Logs
export async function fetchCookingLogs() {
  const response = await fetch("/api/cooking_logs");
  if (!response.ok) throw new Error("Failed to fetch cooking logs");
  const data = await response.json();
  return (data.cooking_logs || []).map(log => ({
    ...log,
    saved_recipe: log.saved_recipe ? parseRecipeJson(log.saved_recipe) : null
  }));
}

export async function logCooking(savedRecipeId) {
  const response = await fetch("/api/cooking_logs", {
    method: "POST",
    headers: {
      "X-CSRF-Token": csrfToken(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ saved_recipe_id: savedRecipeId })
  });
  if (!response.ok) throw new Error("Failed to log cooking");
  return response.json();
}

export async function previewPantryDeduction(savedRecipeId) {
  const response = await fetch("/api/cooking_logs/preview", {
    method: "POST",
    headers: {
      "X-CSRF-Token": csrfToken(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ saved_recipe_id: savedRecipeId })
  });
  if (!response.ok) throw new Error("Failed to preview pantry deduction");
  return response.json();
}

// Collections
export async function fetchCollections() {
  const response = await fetch("/api/collections");
  if (!response.ok) throw new Error("Failed to fetch collections");
  const data = await response.json();
  return data.collections || [];
}

export async function createCollection(name, description) {
  const response = await fetch("/api/collections", {
    method: "POST",
    headers: {
      "X-CSRF-Token": csrfToken(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, description })
  });
  if (!response.ok) throw new Error("Failed to create collection");
  return response.json();
}

export async function deleteCollection(id) {
  const response = await fetch(`/api/collections/${id}`, {
    method: "DELETE",
    headers: { "X-CSRF-Token": csrfToken() }
  });
  if (!response.ok) throw new Error("Failed to delete collection");
}

export async function addRecipeToCollection(collectionId, savedRecipeId) {
  const response = await fetch(`/api/collections/${collectionId}/recipes`, {
    method: "POST",
    headers: {
      "X-CSRF-Token": csrfToken(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ saved_recipe_id: savedRecipeId })
  });
  if (!response.ok) throw new Error("Failed to add recipe to collection");
  return response.json();
}

export async function removeRecipeFromCollection(collectionId, recipeId) {
  const response = await fetch(`/api/collections/${collectionId}/recipes/${recipeId}`, {
    method: "DELETE",
    headers: { "X-CSRF-Token": csrfToken() }
  });
  if (!response.ok) throw new Error("Failed to remove recipe");
}

export async function shareCollection(id) {
  const response = await fetch(`/api/collections/${id}/share`, {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken() }
  });
  if (!response.ok) throw new Error("Failed to share collection");
  return response.json();
}

// Nutrition Goals
export async function fetchNutritionGoal() {
  const response = await fetch("/api/nutrition_goals");
  if (!response.ok) throw new Error("Failed to fetch nutrition goals");
  return response.json();
}

export async function updateNutritionGoal(goals) {
  const response = await fetch("/api/nutrition_goals", {
    method: "PATCH",
    headers: {
      "X-CSRF-Token": csrfToken(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(goals)
  });
  if (!response.ok) throw new Error("Failed to update nutrition goals");
  return response.json();
}

// Smart Suggestions
export async function fetchSmartSuggestions() {
  const response = await fetch("/api/suggestions/smart", {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken(), "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  if (!response.ok) throw new Error("Failed to get suggestions");
  return response.json();
}

// Auto-generate meal plan
export async function autoGenerateMealPlan() {
  const response = await fetch("/api/meal_plans/auto_generate", {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken(), "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  if (!response.ok) throw new Error("Failed to auto-generate meal plan");
  return response.json();
}

// Shopping List
export async function fetchShoppingList() {
  const response = await fetch("/api/shopping_list");
  if (!response.ok) throw new Error("Failed to fetch shopping list");
  return response.json();
}

export async function addShoppingListItem(name, amount, source) {
  const response = await fetch("/api/shopping_list", {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken(), "Content-Type": "application/json" },
    body: JSON.stringify({ name, amount, source })
  });
  if (!response.ok) throw new Error("Failed to add item");
  return response.json();
}

export async function toggleShoppingListItem(id) {
  const response = await fetch(`/api/shopping_list/${id}/toggle`, {
    method: "PATCH",
    headers: { "X-CSRF-Token": csrfToken() }
  });
  if (!response.ok) throw new Error("Failed to toggle item");
  return response.json();
}

export async function deleteShoppingListItem(id) {
  const response = await fetch(`/api/shopping_list/${id}`, {
    method: "DELETE",
    headers: { "X-CSRF-Token": csrfToken() }
  });
  if (!response.ok) throw new Error("Failed to delete item");
}

// Preferences (Feature 1)
export async function fetchPreferences() {
  const response = await fetch("/api/preferences");
  if (!response.ok) throw new Error("Failed to fetch preferences");
  return response.json();
}

export async function updatePreferences(preferences) {
  const response = await fetch("/api/preferences", {
    method: "PATCH",
    headers: { "X-CSRF-Token": csrfToken(), "Content-Type": "application/json" },
    body: JSON.stringify(preferences)
  });
  if (!response.ok) throw new Error("Failed to update preferences");
  return response.json();
}

// Community Feed (Feature 2)
export async function fetchFeed(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`/api/feed?${query}`);
  if (!response.ok) throw new Error("Failed to fetch feed");
  return response.json();
}

export async function publishRecipe(id) {
  const response = await fetch(`/api/recipes/saved/${id}/publish`, {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken() }
  });
  if (!response.ok) throw new Error("Failed to publish");
  return response.json();
}

export async function unpublishRecipe(id) {
  const response = await fetch(`/api/recipes/saved/${id}/unpublish`, {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken() }
  });
  if (!response.ok) throw new Error("Failed to unpublish");
  return response.json();
}

export async function likeRecipe(id) {
  const response = await fetch(`/api/feed/${id}/like`, {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken() }
  });
  if (!response.ok) throw new Error("Failed to like");
  return response.json();
}

export async function unlikeRecipe(id) {
  const response = await fetch(`/api/feed/${id}/like`, {
    method: "DELETE",
    headers: { "X-CSRF-Token": csrfToken() }
  });
  if (!response.ok) throw new Error("Failed to unlike");
  return response.json();
}

// Achievements (Feature 3)
export async function fetchAchievements(since) {
  const query = since ? `?since=${encodeURIComponent(since)}` : "";
  const response = await fetch(`/api/achievements${query}`);
  if (!response.ok) throw new Error("Failed to fetch achievements");
  return response.json();
}

// Meal Prep (Feature 4)
export async function generateMealPrep(schedule) {
  const response = await fetch("/api/meal_prep/generate", {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken(), "Content-Type": "application/json" },
    body: JSON.stringify({ schedule })
  });
  if (!response.ok) throw new Error("Failed to generate meal prep plan");
  return response.json();
}

// Recipe Compare (Feature 5)
export async function compareRecipes(recipeIds) {
  const response = await fetch("/api/recipes/compare", {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken(), "Content-Type": "application/json" },
    body: JSON.stringify({ recipe_ids: recipeIds })
  });
  if (!response.ok) throw new Error("Failed to compare");
  return response.json();
}

// Budget (Feature 6)
export async function fetchBudgetSummary() {
  const response = await fetch("/api/budget/summary");
  if (!response.ok) throw new Error("Failed to fetch budget");
  return response.json();
}

export async function logPurchase(itemName, actualPriceCents, purchasedAt, storeName) {
  const response = await fetch("/api/budget/purchases", {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken(), "Content-Type": "application/json" },
    body: JSON.stringify({ item_name: itemName, actual_price_cents: actualPriceCents, purchased_at: purchasedAt, store_name: storeName })
  });
  if (!response.ok) throw new Error("Failed to log purchase");
  return response.json();
}

// Substitution Logs (Feature 7)
export async function fetchSubstitutionLogs() {
  const response = await fetch("/api/substitution_logs");
  if (!response.ok) throw new Error("Failed to fetch logs");
  return response.json();
}

export async function createSubstitutionLog(data) {
  const response = await fetch("/api/substitution_logs", {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken(), "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error("Failed to log substitution");
  return response.json();
}

export async function lookupSubstitution(ingredient) {
  const response = await fetch(`/api/substitution_logs/lookup?ingredient=${encodeURIComponent(ingredient)}`);
  if (!response.ok) throw new Error("Failed to lookup");
  return response.json();
}

// Nutrition Report (Feature 8)
export async function fetchWeeklyNutritionReport() {
  const response = await fetch("/api/nutrition_reports/weekly");
  if (!response.ok) throw new Error("Failed to fetch report");
  return response.json();
}

// Challenges (Feature 9)
export async function fetchTodayChallenge() {
  const response = await fetch("/api/challenges/today");
  if (!response.ok) throw new Error("Failed to fetch challenge");
  return response.json();
}

export async function submitChallenge(id, notes) {
  const response = await fetch(`/api/challenges/${id}/submit`, {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken(), "Content-Type": "application/json" },
    body: JSON.stringify({ notes })
  });
  if (!response.ok) throw new Error("Failed to submit");
  return response.json();
}

export async function fetchChallengeHistory() {
  const response = await fetch("/api/challenges/history");
  if (!response.ok) throw new Error("Failed to fetch history");
  return response.json();
}

// Kitchen Timeline (Feature 10)
export async function generateTimeline(recipeIds) {
  const response = await fetch("/api/timelines/generate", {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken(), "Content-Type": "application/json" },
    body: JSON.stringify({ recipe_ids: recipeIds })
  });
  if (!response.ok) throw new Error("Failed to generate timeline");
  return response.json();
}

function parseRecipeJson(recipe) {
  return {
    ...recipe,
    ingredients: recipe.ingredients_json ? JSON.parse(recipe.ingredients_json) : [],
    steps: recipe.steps_json ? JSON.parse(recipe.steps_json) : [],
    nutrition: recipe.nutrition_json ? JSON.parse(recipe.nutrition_json) : null,
    substitutions: recipe.substitutions_json ? JSON.parse(recipe.substitutions_json) : []
  };
}
