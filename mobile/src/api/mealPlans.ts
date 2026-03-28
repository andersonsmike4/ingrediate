import { apiClient } from './client';
import { MealPlan, Recipe } from '../types';
import { parseRecipeJson } from '../utils/parseRecipe';

function parseMealPlan(plan: any): MealPlan {
  return {
    ...plan,
    meal_plan_entries: (plan.meal_plan_entries || []).map((entry: any) => ({
      ...entry,
      saved_recipe: entry.saved_recipe ? parseRecipeJson(entry.saved_recipe) : undefined,
    })),
  };
}

export async function fetchMealPlans(): Promise<MealPlan[]> {
  const response = await apiClient.get<{ meal_plans: any[] }>('/api/meal_plans');
  return (response.meal_plans || []).map(parseMealPlan);
}

export async function createMealPlan(
  name: string,
  startDate: string,
  numDays: number
): Promise<{ meal_plan: MealPlan }> {
  const response = await apiClient.post<{ meal_plan: any }>(
    '/api/meal_plans',
    { name, start_date: startDate, num_days: numDays }
  );
  return { meal_plan: parseMealPlan(response.meal_plan) };
}

export async function deleteMealPlan(id: number): Promise<void> {
  await apiClient.del(`/api/meal_plans/${id}`);
}

export async function addMealPlanEntry(
  planId: number,
  data: {
    date: string;
    mealType: string;
    savedRecipeId?: number;
    eatingOut?: boolean;
    note?: string;
  }
): Promise<{ entry: any }> {
  const response = await apiClient.post<{ entry: any }>(
    `/api/meal_plans/${planId}/entries`,
    {
      date: data.date,
      meal_type: data.mealType,
      saved_recipe_id: data.savedRecipeId,
      eating_out: data.eatingOut,
      note: data.note,
    }
  );
  return response;
}

export async function removeMealPlanEntry(planId: number, entryId: number): Promise<void> {
  await apiClient.del(`/api/meal_plans/${planId}/entries/${entryId}`);
}

export async function fetchMealPlanShoppingList(planId: number): Promise<{ items: any[] }> {
  const response = await apiClient.get<{ items: any[] }>(
    `/api/meal_plans/${planId}/shopping_list`
  );
  return response;
}

export async function autoGenerateMealPlan(): Promise<{ meal_plan: MealPlan }> {
  const response = await apiClient.post<{ meal_plan: any }>(
    '/api/meal_plans/auto_generate',
    {}
  );
  return { meal_plan: parseMealPlan(response.meal_plan) };
}
