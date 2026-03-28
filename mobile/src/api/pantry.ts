import { apiClient } from './client';
import { PantryItem } from '../types';

export async function fetchPantryItems(): Promise<{ pantry_items: PantryItem[] }> {
  const response = await apiClient.get<{ pantry_items: PantryItem[] }>('/api/pantry');
  return response;
}

export async function addPantryItem(
  name: string,
  category: string,
  expiresAt: string | null = null,
  quantity: string | null = null
): Promise<{ pantry_item: PantryItem }> {
  const response = await apiClient.post<{ pantry_item: PantryItem }>(
    '/api/pantry',
    { name, category, expires_at: expiresAt, quantity }
  );
  return response;
}

export async function bulkAddPantryItems(items: Array<{ name: string; category: string }>): Promise<{ pantry_items: PantryItem[] }> {
  const response = await apiClient.post<{ pantry_items: PantryItem[] }>(
    '/api/pantry/bulk',
    { items }
  );
  return response;
}

export async function deletePantryItem(id: number): Promise<void> {
  await apiClient.del(`/api/pantry/${id}`);
}

export async function clearPantry(): Promise<void> {
  await apiClient.del('/api/pantry');
}

export async function voiceAddPantryItems(text: string): Promise<{ pantry_items: PantryItem[]; parsed_items: any[] }> {
  const response = await apiClient.post<{ pantry_items: PantryItem[]; parsed_items: any[] }>(
    '/api/pantry/voice',
    { text }
  );
  return response;
}

export async function scanReceipt(
  photoUri: string,
  fileName: string,
  mimeType: string
): Promise<{ pantry_items: PantryItem[]; purchases: any[]; parsed_count: number; added_count: number }> {
  const formData = new FormData();
  formData.append('photo', {
    uri: photoUri,
    name: fileName,
    type: mimeType,
  } as any);

  const response = await apiClient.postFormData<{
    pantry_items: PantryItem[];
    purchases: any[];
    parsed_count: number;
    added_count: number;
  }>('/api/pantry/scan_receipt', formData);
  return response;
}
