import { apiClient } from './client';
import { Recipe, RecipeFilters } from '../types';
import { parseRecipeJson } from '../utils/parseRecipe';

export async function generateRecipes(ingredients: string[], filters: RecipeFilters): Promise<Recipe[]> {
  const response = await apiClient.post<{ recipes: Recipe[] }>(
    '/api/recipes/generate',
    {
      ingredients,
      dietary: filters.dietary,
      cuisine: filters.cuisine,
      cook_time: filters.cookTime,
      difficulty: filters.difficulty,
      servings: filters.servings,
    }
  );
  return response.recipes || [];
}

export async function searchByMealName(mealName: string): Promise<Recipe[]> {
  const response = await apiClient.post<{ recipes: Recipe[] }>(
    '/api/recipes/search',
    { meal_name: mealName }
  );
  return response.recipes || [];
}

export async function analyzePhoto(uri: string, fileName: string, mimeType: string): Promise<string[]> {
  const formData = new FormData();
  formData.append('photo', {
    uri,
    name: fileName,
    type: mimeType,
  } as any);

  const response = await apiClient.postFormData<{ ingredients: string[] }>(
    '/api/ingredients/analyze_photo',
    formData
  );
  return response.ingredients || [];
}

export async function saveRecipe(recipe: Recipe): Promise<{ recipe: any }> {
  const response = await apiClient.post<{ recipe: any }>(
    '/api/recipes/saved',
    {
      recipe: {
        name: recipe.name,
        description: recipe.description,
        cook_time: recipe.cook_time,
        difficulty: recipe.difficulty,
        servings: recipe.servings,
        ingredients_json: JSON.stringify(recipe.ingredients),
        steps_json: JSON.stringify(recipe.steps),
        nutrition_json: JSON.stringify(recipe.nutrition),
        substitutions_json: JSON.stringify(recipe.substitutions || []),
      },
    }
  );
  return response;
}

export async function fetchSavedRecipes(): Promise<Recipe[]> {
  const response = await apiClient.get<{ recipes: any[] }>('/api/recipes/saved');
  return (response.recipes || []).map(parseRecipeJson);
}

export async function deleteSavedRecipe(id: number): Promise<void> {
  await apiClient.del(`/api/recipes/saved/${id}`);
}

export async function updateSavedRecipe(id: number, updates: Partial<Recipe>): Promise<{ recipe: any }> {
  const response = await apiClient.patch<{ recipe: any }>(
    `/api/recipes/saved/${id}`,
    { recipe: updates }
  );
  return response;
}

export async function importRecipeFromUrl(url: string): Promise<Recipe> {
  const response = await apiClient.post<{ recipe: any }>(
    '/api/recipes/import_url',
    { url }
  );
  return parseRecipeJson(response.recipe);
}

export async function suggestSubstitutions(recipeId: number, ingredient: string): Promise<{ substitutions: any[] }> {
  const response = await apiClient.post<{ substitutions: any[] }>(
    `/api/recipes/saved/${recipeId}/substitutions`,
    { ingredient }
  );
  return response;
}

export async function estimateRecipeCost(recipeId: number): Promise<{ estimated_cost: number }> {
  const response = await apiClient.post<{ estimated_cost: number }>(
    `/api/recipes/saved/${recipeId}/estimate_cost`
  );
  return response;
}

export async function shareRecipe(id: number): Promise<{ share_token: string; share_url: string }> {
  const response = await apiClient.post<{ share_token: string; share_url: string }>(
    `/api/recipes/saved/${id}/share`
  );
  return response;
}

export async function fetchSharedRecipe(token: string): Promise<Recipe> {
  const response = await apiClient.get<{ recipe: any }>(
    `/api/recipes/shared/${token}`,
    false
  );
  return parseRecipeJson(response.recipe);
}

export async function publishRecipe(id: number): Promise<{ recipe: any }> {
  const response = await apiClient.post<{ recipe: any }>(
    `/api/recipes/saved/${id}/publish`
  );
  return response;
}

export async function unpublishRecipe(id: number): Promise<{ recipe: any }> {
  const response = await apiClient.post<{ recipe: any }>(
    `/api/recipes/saved/${id}/unpublish`
  );
  return response;
}
