import { apiClient } from './client';

export async function fetchBudgetSummary(): Promise<{ summary: any }> {
  const response = await apiClient.get<{ summary: any }>('/api/budget/summary');
  return response;
}

export async function logPurchase(
  itemName: string,
  actualPriceCents: number,
  purchasedAt: string,
  storeName: string
): Promise<{ purchase: any }> {
  const response = await apiClient.post<{ purchase: any }>(
    '/api/budget/purchases',
    {
      item_name: itemName,
      actual_price_cents: actualPriceCents,
      purchased_at: purchasedAt,
      store_name: storeName,
    }
  );
  return response;
}
