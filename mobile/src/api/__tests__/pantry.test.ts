import {
  fetchPantryItems,
  addPantryItem,
  bulkAddPantryItems,
  deletePantryItem,
  clearPantry,
  voiceAddPantryItems,
  scanReceipt,
} from '../pantry';
import { apiClient } from '../client';
import { PantryItem } from '../../types';

jest.mock('../client');

describe('Pantry API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchPantryItems', () => {
    it('should call correct endpoint', async () => {
      const mockResponse = {
        pantry_items: [
          {
            id: 1,
            name: 'Milk',
            category: 'Dairy',
            quantity: '1 gallon',
            expires_at: '2026-04-01',
            created_at: '2026-03-20',
          },
        ],
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await fetchPantryItems();

      expect(apiClient.get).toHaveBeenCalledWith('/api/pantry');
      expect(result).toEqual(mockResponse);
      expect(result.pantry_items).toHaveLength(1);
      expect(result.pantry_items[0].name).toBe('Milk');
    });
  });

  describe('addPantryItem', () => {
    it('should send name, category, expires_at, and quantity', async () => {
      const mockResponse = {
        pantry_item: {
          id: 1,
          name: 'Eggs',
          category: 'Dairy',
          quantity: '12',
          expires_at: '2026-04-05',
          created_at: '2026-03-27',
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await addPantryItem('Eggs', 'Dairy', '2026-04-05', '12');

      expect(apiClient.post).toHaveBeenCalledWith('/api/pantry', {
        name: 'Eggs',
        category: 'Dairy',
        expires_at: '2026-04-05',
        quantity: '12',
      });
      expect(result).toEqual(mockResponse);
      expect(result.pantry_item.name).toBe('Eggs');
    });

    it('should handle null expires_at and quantity', async () => {
      const mockResponse = {
        pantry_item: {
          id: 2,
          name: 'Salt',
          category: 'Spices',
          quantity: null,
          expires_at: null,
          created_at: '2026-03-27',
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await addPantryItem('Salt', 'Spices', null, null);

      expect(apiClient.post).toHaveBeenCalledWith('/api/pantry', {
        name: 'Salt',
        category: 'Spices',
        expires_at: null,
        quantity: null,
      });
      expect(result.pantry_item.quantity).toBeNull();
      expect(result.pantry_item.expires_at).toBeNull();
    });
  });

  describe('bulkAddPantryItems', () => {
    it('should send items array', async () => {
      const items = [
        { name: 'Tomato', category: 'Produce' },
        { name: 'Onion', category: 'Produce' },
      ];

      const mockResponse = {
        pantry_items: [
          {
            id: 1,
            name: 'Tomato',
            category: 'Produce',
            quantity: null,
            expires_at: null,
            created_at: '2026-03-27',
          },
          {
            id: 2,
            name: 'Onion',
            category: 'Produce',
            quantity: null,
            expires_at: null,
            created_at: '2026-03-27',
          },
        ],
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await bulkAddPantryItems(items);

      expect(apiClient.post).toHaveBeenCalledWith('/api/pantry/bulk', { items });
      expect(result.pantry_items).toHaveLength(2);
    });
  });

  describe('deletePantryItem', () => {
    it('should call correct endpoint with id', async () => {
      (apiClient.del as jest.Mock).mockResolvedValue(undefined);

      await deletePantryItem(5);

      expect(apiClient.del).toHaveBeenCalledWith('/api/pantry/5');
    });
  });

  describe('clearPantry', () => {
    it('should call correct endpoint', async () => {
      (apiClient.del as jest.Mock).mockResolvedValue(undefined);

      await clearPantry();

      expect(apiClient.del).toHaveBeenCalledWith('/api/pantry');
    });
  });

  describe('voiceAddPantryItems', () => {
    it('should send text', async () => {
      const mockResponse = {
        pantry_items: [
          {
            id: 1,
            name: 'Milk',
            category: 'Dairy',
            quantity: '1 gallon',
            expires_at: null,
            created_at: '2026-03-27',
          },
        ],
        parsed_items: [{ name: 'Milk', category: 'Dairy', quantity: '1 gallon' }],
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await voiceAddPantryItems('I bought milk one gallon');

      expect(apiClient.post).toHaveBeenCalledWith('/api/pantry/voice', {
        text: 'I bought milk one gallon',
      });
      expect(result.pantry_items).toHaveLength(1);
      expect(result.parsed_items).toHaveLength(1);
    });
  });

  describe('scanReceipt', () => {
    it('should send FormData with photo', async () => {
      const mockResponse = {
        pantry_items: [
          {
            id: 1,
            name: 'Banana',
            category: 'Produce',
            quantity: null,
            expires_at: null,
            created_at: '2026-03-27',
          },
        ],
        purchases: [
          {
            item_name: 'Banana',
            actual_price_cents: 299,
            store_name: 'Grocery Store',
          },
        ],
        parsed_count: 1,
        added_count: 1,
      };

      (apiClient.postFormData as jest.Mock).mockResolvedValue(mockResponse);

      const result = await scanReceipt(
        'file:///path/to/receipt.jpg',
        'receipt.jpg',
        'image/jpeg'
      );

      expect(apiClient.postFormData).toHaveBeenCalledWith(
        '/api/pantry/scan_receipt',
        expect.any(FormData)
      );

      const formDataCall = (apiClient.postFormData as jest.Mock).mock.calls[0][1];
      expect(formDataCall).toBeInstanceOf(FormData);

      expect(result.pantry_items).toHaveLength(1);
      expect(result.purchases).toHaveLength(1);
      expect(result.parsed_count).toBe(1);
      expect(result.added_count).toBe(1);
    });
  });
});
