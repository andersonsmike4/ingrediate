import { apiClient } from './client';

export async function fetchPreferences(): Promise<{ preferences: any }> {
  const response = await apiClient.get<{ preferences: any }>('/api/preferences');
  return response;
}

export async function updatePreferences(
  preferences: any
): Promise<{ preferences: any }> {
  const response = await apiClient.patch<{ preferences: any }>(
    '/api/preferences',
    { preferences }
  );
  return response;
}
