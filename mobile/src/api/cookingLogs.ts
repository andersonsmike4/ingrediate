import { apiClient } from './client';
import { CookingLog, Recipe } from '../types';
import { parseRecipeJson } from '../utils/parseRecipe';

function parseCookingLog(log: any): CookingLog {
  return {
    ...log,
    saved_recipe: log.saved_recipe ? parseRecipeJson(log.saved_recipe) : null,
  };
}

export async function fetchCookingLogs(): Promise<CookingLog[]> {
  const response = await apiClient.get<{ cooking_logs: any[] }>('/api/cooking_logs');
  return (response.cooking_logs || []).map(parseCookingLog);
}

export async function logCooking(savedRecipeId: number): Promise<{ cooking_log: CookingLog }> {
  const response = await apiClient.post<{ cooking_log: any }>(
    '/api/cooking_logs',
    { saved_recipe_id: savedRecipeId }
  );
  return { cooking_log: parseCookingLog(response.cooking_log) };
}

export async function previewPantryDeduction(
  savedRecipeId: number
): Promise<{ preview: any }> {
  const response = await apiClient.post<{ preview: any }>(
    '/api/cooking_logs/preview',
    { saved_recipe_id: savedRecipeId }
  );
  return response;
}
