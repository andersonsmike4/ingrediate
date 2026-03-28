import { apiClient } from './client';
import { CookingChallenge } from '../types';

export async function fetchTodayChallenge(): Promise<{ challenge: CookingChallenge | null }> {
  const response = await apiClient.get<{ challenge: CookingChallenge | null }>(
    '/api/challenges/today'
  );
  return response;
}

export async function submitChallenge(
  id: number,
  notes: string
): Promise<{ submission: any }> {
  const response = await apiClient.post<{ submission: any }>(
    `/api/challenges/${id}/submit`,
    { notes }
  );
  return response;
}

export async function fetchChallengeHistory(): Promise<{ submissions: any[] }> {
  const response = await apiClient.get<{ submissions: any[] }>(
    '/api/challenges/history'
  );
  return response;
}
