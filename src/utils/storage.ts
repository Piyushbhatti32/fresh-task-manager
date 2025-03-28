/**
 * Storage utility that provides a unified API for both secure storage and fallback storage
 */

// In-memory storage fallback when SecureStore is not available
const memoryStorage = new Map<string, string>();

// Check if SecureStore is available without throwing
let SecureStore: any = null;
try {
  SecureStore = require('expo-secure-store');
  // Test if the module actually works
  SecureStore.getItemAsync('test').catch(() => {
    console.log('SecureStore is not fully functional, using memory fallback');
    SecureStore = null;
  });
} catch (error) {
  console.warn('SecureStore module not available, using memory fallback');
}

/**
 * Storage adapter with fallback to memory storage
 */
export const Storage = {
  /**
   * Get an item from storage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      if (SecureStore) {
        return await SecureStore.getItemAsync(key);
      }
      return memoryStorage.get(key) || null;
    } catch (error) {
      console.warn('Error accessing storage, using memory fallback', error);
      return memoryStorage.get(key) || null;
    }
  },

  /**
   * Store an item
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (SecureStore) {
        await SecureStore.setItemAsync(key, value);
      } else {
        memoryStorage.set(key, value);
      }
    } catch (error) {
      console.warn('Error storing data, using memory fallback', error);
      memoryStorage.set(key, value);
    }
  },

  /**
   * Remove an item
   */
  async removeItem(key: string): Promise<void> {
    try {
      if (SecureStore) {
        await SecureStore.deleteItemAsync(key);
      } else {
        memoryStorage.delete(key);
      }
    } catch (error) {
      console.warn('Error removing data, using memory fallback', error);
      memoryStorage.delete(key);
    }
  },
}; 