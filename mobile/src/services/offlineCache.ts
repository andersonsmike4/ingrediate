import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { PantryItem, ShoppingListItem, Recipe } from '../types';
import { toggleShoppingListItem, addShoppingListItem, deleteShoppingListItem, clearCheckedItems } from '../api/shopping';
import { addPantryItem, deletePantryItem } from '../api/pantry';

// Storage keys
const KEYS = {
  PANTRY_ITEMS: '@ingrediate:pantry_items',
  SHOPPING_LIST: '@ingrediate:shopping_list',
  SAVED_RECIPES: '@ingrediate:saved_recipes',
  OFFLINE_QUEUE: '@ingrediate:offline_queue',
};

// Offline action types
export type OfflineAction =
  | { type: 'toggle_shopping_item'; payload: { id: number } }
  | { type: 'add_shopping_item'; payload: { name: string } }
  | { type: 'delete_shopping_item'; payload: { id: number } }
  | { type: 'add_pantry_item'; payload: { name: string; category: string; expiresAt?: string | null; quantity?: string | null } }
  | { type: 'delete_pantry_item'; payload: { id: number } }
  | { type: 'clear_checked_items'; payload: {} };

// ===== Cache operations =====

export async function cachePantryItems(items: PantryItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.PANTRY_ITEMS, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to cache pantry items:', error);
  }
}

export async function getCachedPantryItems(): Promise<PantryItem[]> {
  try {
    const cached = await AsyncStorage.getItem(KEYS.PANTRY_ITEMS);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Failed to get cached pantry items:', error);
    return [];
  }
}

export async function cacheShoppingList(items: ShoppingListItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.SHOPPING_LIST, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to cache shopping list:', error);
  }
}

export async function getCachedShoppingList(): Promise<ShoppingListItem[]> {
  try {
    const cached = await AsyncStorage.getItem(KEYS.SHOPPING_LIST);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Failed to get cached shopping list:', error);
    return [];
  }
}

export async function cacheSavedRecipes(recipes: Recipe[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.SAVED_RECIPES, JSON.stringify(recipes));
  } catch (error) {
    console.error('Failed to cache saved recipes:', error);
  }
}

export async function getCachedSavedRecipes(): Promise<Recipe[]> {
  try {
    const cached = await AsyncStorage.getItem(KEYS.SAVED_RECIPES);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Failed to get cached saved recipes:', error);
    return [];
  }
}

// ===== Offline queue operations =====

export async function queueOfflineAction(action: OfflineAction): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    queue.push(action);
    await AsyncStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  } catch (error) {
    console.error('Failed to queue offline action:', error);
  }
}

export async function getOfflineQueue(): Promise<OfflineAction[]> {
  try {
    const cached = await AsyncStorage.getItem(KEYS.OFFLINE_QUEUE);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Failed to get offline queue:', error);
    return [];
  }
}

export async function clearOfflineQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.OFFLINE_QUEUE);
  } catch (error) {
    console.error('Failed to clear offline queue:', error);
  }
}

// ===== Network state =====

export async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  } catch (error) {
    console.error('Failed to check network state:', error);
    return false;
  }
}

export function subscribeToNetworkChanges(
  callback: (isConnected: boolean) => void
): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    callback(state.isConnected ?? false);
  });

  return unsubscribe;
}

// ===== Sync operations =====

export async function syncOfflineActions(): Promise<void> {
  const online = await isOnline();
  if (!online) {
    console.log('Cannot sync: device is offline');
    return;
  }

  const queue = await getOfflineQueue();
  if (queue.length === 0) {
    return;
  }

  console.log(`Syncing ${queue.length} offline actions...`);

  const failedActions: OfflineAction[] = [];

  for (const action of queue) {
    try {
      switch (action.type) {
        case 'toggle_shopping_item':
          await toggleShoppingListItem(action.payload.id);
          break;

        case 'add_shopping_item':
          await addShoppingListItem(action.payload.name);
          break;

        case 'delete_shopping_item':
          await deleteShoppingListItem(action.payload.id);
          break;

        case 'add_pantry_item':
          await addPantryItem(
            action.payload.name,
            action.payload.category,
            action.payload.expiresAt,
            action.payload.quantity
          );
          break;

        case 'delete_pantry_item':
          await deletePantryItem(action.payload.id);
          break;

        case 'clear_checked_items':
          await clearCheckedItems();
          break;

        default:
          console.warn('Unknown action type:', action);
      }
    } catch (error) {
      console.error('Failed to sync action:', action, error);
      failedActions.push(action);
    }
  }

  // Clear queue or keep failed actions
  if (failedActions.length > 0) {
    await AsyncStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(failedActions));
    console.log(`${failedActions.length} actions failed to sync and will be retried`);
  } else {
    await clearOfflineQueue();
    console.log('All offline actions synced successfully');
  }
}
