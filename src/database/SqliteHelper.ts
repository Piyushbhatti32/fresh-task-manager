/**
 * Simple SQLite helper for Expo
 */
import * as SQLite from 'expo-sqlite';

// Export the direct function for easier usage
export const getDatabase = (name: string) => {
  try {
    console.log('Opening database with expo-sqlite@15.1.2:', name);
    return SQLite.openDatabaseSync(name);
  } catch (error) {
    console.error('Error opening database:', error);
    throw error;
  }
}; 