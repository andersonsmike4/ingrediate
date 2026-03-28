import { apiClient } from './client';
import { User, AuthResponse, AuthStatusResponse } from '../types';

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  const response = await apiClient.post<{ user: User; token: string }>(
    '/api/auth/token/sign_in',
    { user: { email, password } },
    false
  );

  // Store the token
  await apiClient.setToken(response.token);

  return response;
}

export async function signUp(name: string, email: string, password: string): Promise<AuthResponse> {
  const response = await apiClient.post<{ user: User; token: string }>(
    '/api/auth/token/sign_up',
    { user: { name, email, password, password_confirmation: password } },
    false
  );

  // Store the token
  await apiClient.setToken(response.token);

  return response;
}

export async function signOut(): Promise<void> {
  try {
    await apiClient.del('/api/auth/token/sign_out');
  } finally {
    // Always clear token even if request fails
    await apiClient.clearToken();
  }
}

export async function checkAuthStatus(): Promise<AuthStatusResponse> {
  try {
    const response = await apiClient.get<AuthStatusResponse>('/api/auth/status');
    return response;
  } catch (error) {
    // If auth check fails, clear token and return unauthenticated
    await apiClient.clearToken();
    return { authenticated: false, user: null };
  }
}
