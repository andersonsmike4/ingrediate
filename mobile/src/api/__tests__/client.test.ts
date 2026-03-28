import { apiClient } from '../client';
import * as SecureStore from 'expo-secure-store';

// Mock fetch globally
global.fetch = jest.fn();

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('getToken', () => {
    it('should get token from SecureStore', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-token');
      const token = await apiClient.getToken();
      expect(token).toBe('test-token');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('auth_token');
    });
  });

  describe('setToken', () => {
    it('should set token in SecureStore', async () => {
      await apiClient.setToken('new-token');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', 'new-token');
    });
  });

  describe('clearToken', () => {
    it('should delete token from SecureStore', async () => {
      await apiClient.clearToken();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
    });
  });

  describe('get', () => {
    it('should include auth token when available', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-token');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'test' }),
      });

      await apiClient.get('/api/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          },
        })
      );
    });

    it('should not include auth token when includeAuth is false', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'test' }),
      });

      await apiClient.get('/api/test', false);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should clear token and throw on 401 response', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-token');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(apiClient.get('/api/test')).rejects.toThrow('Unauthorized');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
    });

    it('should throw with error message on non-OK response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ error: 'Bad request' }),
      });

      await expect(apiClient.get('/api/test')).rejects.toThrow('Bad request');
    });

    it('should throw generic error when response has no error field', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      });

      await expect(apiClient.get('/api/test')).rejects.toThrow('Request failed');
    });
  });

  describe('post', () => {
    it('should include auth token and body', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-token');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      const body = { name: 'Test', value: 123 };
      await apiClient.post('/api/test', body);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          },
          body: JSON.stringify(body),
        })
      );
    });

    it('should handle 401 response', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-token');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(apiClient.post('/api/test', {})).rejects.toThrow('Unauthorized');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
    });

    it('should throw error from errors array', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 422,
        json: jest.fn().mockResolvedValue({ errors: ['Validation failed'] }),
      });

      await expect(apiClient.post('/api/test', {})).rejects.toThrow('Validation failed');
    });
  });

  describe('postFormData', () => {
    it('should include auth token but not Content-Type header', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-token');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      const formData = new FormData();
      formData.append('file', 'test');

      await apiClient.postFormData('/api/upload', formData);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/upload',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-token',
          },
          body: formData,
        })
      );
    });

    it('should handle 401 response', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-token');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      const formData = new FormData();
      await expect(apiClient.postFormData('/api/upload', formData)).rejects.toThrow('Unauthorized');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
    });
  });

  describe('patch', () => {
    it('should include auth token and body', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-token');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ updated: true }),
      });

      const body = { name: 'Updated' };
      await apiClient.patch('/api/test/1', body);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test/1',
        expect.objectContaining({
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          },
          body: JSON.stringify(body),
        })
      );
    });
  });

  describe('del', () => {
    it('should include auth token', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-token');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 204,
      });

      await apiClient.del('/api/test/1');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test/1',
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          },
        })
      );
    });

    it('should return undefined for 204 response', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-token');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await apiClient.del('/api/test/1');
      expect(result).toBeUndefined();
    });

    it('should return JSON for 200 response', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-token');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ deleted: true }),
      });

      const result = await apiClient.del('/api/test/1');
      expect(result).toEqual({ deleted: true });
    });

    it('should handle 401 response', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-token');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(apiClient.del('/api/test/1')).rejects.toThrow('Unauthorized');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
    });
  });
});
