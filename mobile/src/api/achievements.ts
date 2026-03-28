import { apiClient } from './client';
import { Achievement } from '../types';

export async function fetchAchievements(since?: string): Promise<{ achievements: Achievement[] }> {
  const queryString = since ? `?since=${encodeURIComponent(since)}` : '';
  const response = await apiClient.get<{ achievements: Achievement[] }>(
    `/api/achievements${queryString}`
  );
  return response;
}
