import { apiClient } from './client';
import { ShoppingListItem } from '../types';

export async function fetchShoppingList(): Promise<{ items: ShoppingListItem[] }> {
  const response = await apiClient.get<{ items: ShoppingListItem[] }>('/api/shopping_list');
  return response;
}

export async function addShoppingListItem(
  name: string,
  amount: string | null = null,
  source: string | null = null
): Promise<{ item: ShoppingListItem }> {
  const response = await apiClient.post<{ item: ShoppingListItem }>(
    '/api/shopping_list',
    { name, amount, source }
  );
  return response;
}

export async function toggleShoppingListItem(id: number): Promise<{ item: ShoppingListItem }> {
  const response = await apiClient.patch<{ item: ShoppingListItem }>(
    `/api/shopping_list/${id}/toggle`
  );
  return response;
}

export async function deleteShoppingListItem(id: number): Promise<void> {
  await apiClient.del(`/api/shopping_list/${id}`);
}

export async function clearCheckedItems(): Promise<void> {
  await apiClient.del('/api/shopping_list_clear_checked');
}

export async function populateFromPlan(planId: number): Promise<{ items: ShoppingListItem[]; added: number }> {
  const response = await apiClient.post<{ items: ShoppingListItem[]; added: number }>(
    `/api/shopping_list/populate/${planId}`
  );
  return response;
}

export async function addCheckedToPantry(): Promise<{ added_to_pantry: number }> {
  const response = await apiClient.post<{ added_to_pantry: number }>(
    '/api/shopping_list/add_to_pantry'
  );
  return response;
}
