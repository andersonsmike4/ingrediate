import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:3000';
const TOKEN_KEY = 'auth_token';

const REQUEST_TIMEOUT_MS = 60000;
const MAX_RETRIES = 2; // 3 total attempts
const RETRY_DELAYS = [1000, 2000]; // exponential backoff delays in ms

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { ...options, signal: controller.signal }).finally(() => {
    clearTimeout(timeoutId);
  });
}

function shouldRetry(error: any, response?: Response): boolean {
  if (error) {
    // Network errors (fetch throws TypeError)
    if (error instanceof TypeError) {
      return true;
    }
  }

  // HTTP status codes that warrant retry
  if (response) {
    const status = response.status;
    return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
  }

  return false;
}

async function fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
  let lastError: any;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);

      // If response is not retryable, return it (even if it's an error status)
      if (!shouldRetry(null, response)) {
        return response;
      }

      // If it's retryable and we have retries left, continue
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
        continue;
      }

      // Final attempt, return the response
      return response;
    } catch (error: any) {
      lastError = error;

      // If not retryable or no retries left, throw
      if (!shouldRetry(error) || attempt >= MAX_RETRIES) {
        throw error;
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
    }
  }

  throw lastError;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  }

  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }

  async clearToken(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }

  private async getHeaders(includeAuth: boolean = true): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = await this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async get<T>(path: string, includeAuth: boolean = true): Promise<T> {
    const headers = await this.getHeaders(includeAuth);
    const response = await fetchWithRetry(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers,
    });

    if (response.status === 401) {
      await this.clearToken();
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async post<T>(path: string, body?: any, includeAuth: boolean = true): Promise<T> {
    const headers = await this.getHeaders(includeAuth);
    const response = await fetchWithRetry(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      await this.clearToken();
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.errors?.[0] || 'Request failed');
    }

    return response.json();
  }

  async postFormData<T>(path: string, formData: FormData, includeAuth: boolean = true): Promise<T> {
    const token = includeAuth ? await this.getToken() : null;
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetchWithRetry(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (response.status === 401) {
      await this.clearToken();
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async patch<T>(path: string, body?: any, includeAuth: boolean = true): Promise<T> {
    const headers = await this.getHeaders(includeAuth);
    const response = await fetchWithRetry(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      await this.clearToken();
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async del<T>(path: string, includeAuth: boolean = true): Promise<T | void> {
    const headers = await this.getHeaders(includeAuth);
    const response = await fetchWithRetry(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers,
    });

    if (response.status === 401) {
      await this.clearToken();
      throw new Error('Unauthorized');
    }

    if (!response.ok && response.status !== 204) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    if (response.status === 204) {
      return;
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
