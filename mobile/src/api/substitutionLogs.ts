import { apiClient } from './client';
import { SubstitutionLogEntry } from '../types';

export async function fetchSubstitutionLogs(): Promise<{ logs: SubstitutionLogEntry[] }> {
  const response = await apiClient.get<{ logs: SubstitutionLogEntry[] }>(
    '/api/substitution_logs'
  );
  return response;
}

export async function createSubstitutionLog(
  data: Partial<SubstitutionLogEntry>
): Promise<{ log: SubstitutionLogEntry }> {
  const response = await apiClient.post<{ log: SubstitutionLogEntry }>(
    '/api/substitution_logs',
    { log: data }
  );
  return response;
}

export async function lookupSubstitution(
  ingredient: string
): Promise<{ suggestions: any[] }> {
  const response = await apiClient.get<{ suggestions: any[] }>(
    `/api/substitution_logs/lookup?ingredient=${encodeURIComponent(ingredient)}`
  );
  return response;
}
