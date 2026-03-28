import { apiClient } from './client';
import { Recipe } from '../types';

export async function fetchFeed(params?: {
  page?: number;
  search?: string;
}): Promise<{ recipes: Recipe[] }> {
  const queryParams = new URLSearchParams();
  if (params?.page) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.search) {
    queryParams.append('search', params.search);
  }

  const queryString = queryParams.toString();
  const path = queryString ? `/api/feed?${queryString}` : '/api/feed';

  const response = await apiClient.get<{ recipes: Recipe[] }>(path);
  return response;
}

export async function likeRecipe(id: number): Promise<{ likes_count: number }> {
  const response = await apiClient.post<{ likes_count: number }>(
    `/api/feed/${id}/like`
  );
  return response;
}

export async function unlikeRecipe(id: number): Promise<{ likes_count: number }> {
  const response = await apiClient.del<{ likes_count: number }>(
    `/api/feed/${id}/like`
  );
  return response as { likes_count: number };
}
