import { apiClient } from './client';

export async function fetchSmartSuggestions(): Promise<{ suggestions: any }> {
  const response = await apiClient.post<{ suggestions: any }>(
    '/api/suggestions/smart',
    {}
  );
  return response;
}

export async function generateMealPrep(schedule: any): Promise<{ plan: any }> {
  const response = await apiClient.post<{ plan: any }>(
    '/api/meal_prep/generate',
    { schedule }
  );
  return response;
}

export async function compareRecipes(recipeIds: number[]): Promise<{ comparison: any }> {
  const response = await apiClient.post<{ comparison: any }>(
    '/api/recipes/compare',
    { recipe_ids: recipeIds }
  );
  return response;
}

export async function generateTimeline(recipeIds: number[]): Promise<{ timeline: any }> {
  const response = await apiClient.post<{ timeline: any }>(
    '/api/timelines/generate',
    { recipe_ids: recipeIds }
  );
  return response;
}
