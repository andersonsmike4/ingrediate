import { apiClient } from './client';
import { NutritionGoal } from '../types';

export async function fetchNutritionGoal(): Promise<{ goal: NutritionGoal | null }> {
  const response = await apiClient.get<{ goal: NutritionGoal | null }>('/api/nutrition_goals');
  return response;
}

export async function updateNutritionGoal(
  goals: Partial<NutritionGoal>
): Promise<{ goal: NutritionGoal }> {
  const response = await apiClient.patch<{ goal: NutritionGoal }>(
    '/api/nutrition_goals',
    { goals }
  );
  return response;
}

export async function fetchWeeklyNutritionReport(): Promise<{ report: any }> {
  const response = await apiClient.get<{ report: any }>('/api/nutrition_reports/weekly');
  return response;
}
