import { apiClient } from './client';
import { Collection } from '../types';

export async function fetchCollections(): Promise<Collection[]> {
  const response = await apiClient.get<{ collections: Collection[] }>('/api/collections');
  return response.collections || [];
}

export async function createCollection(
  name: string,
  description: string
): Promise<{ collection: Collection }> {
  const response = await apiClient.post<{ collection: Collection }>(
    '/api/collections',
    { name, description }
  );
  return response;
}

export async function deleteCollection(id: number): Promise<void> {
  await apiClient.del(`/api/collections/${id}`);
}

export async function fetchCollection(id: number): Promise<{ collection: Collection }> {
  const response = await apiClient.get<{ collection: Collection }>(`/api/collections/${id}`);
  return response;
}

export async function addRecipeToCollection(
  collectionId: number,
  savedRecipeId: number
): Promise<{ collection: Collection }> {
  const response = await apiClient.post<{ collection: Collection }>(
    `/api/collections/${collectionId}/recipes`,
    { saved_recipe_id: savedRecipeId }
  );
  return response;
}

export async function removeRecipeFromCollection(
  collectionId: number,
  recipeId: number
): Promise<void> {
  await apiClient.del(`/api/collections/${collectionId}/recipes/${recipeId}`);
}

export async function shareCollection(id: number): Promise<{ share_token: string; share_url: string }> {
  const response = await apiClient.post<{ share_token: string; share_url: string }>(
    `/api/collections/${id}/share`
  );
  return response;
}
