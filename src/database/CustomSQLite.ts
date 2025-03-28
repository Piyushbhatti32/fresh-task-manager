/**
 * CustomSQLite.ts - A wrapper for expo-sqlite to handle different versions
 */

let SQLiteImplementation: any;

try {
  // First try the standard import
  SQLiteImplementation = require('expo-sqlite');
  
  // If openDatabase is not a function, try alternative imports
  if (typeof SQLiteImplementation.openDatabase !== 'function') {
    // For newer versions of expo-sqlite that might use a different structure
    if (SQLiteImplementation.default && typeof SQLiteImplementation.default.openDatabase === 'function') {
      SQLiteImplementation = SQLiteImplementation.default;
    } else {
      console.warn('Unexpected expo-sqlite module structure. Falling back to manual implementation.');
      SQLiteImplementation = null;
    }
  }
} catch (error) {
  console.error('Failed to import expo-sqlite:', error);
  SQLiteImplementation = null;
}

// If we couldn't get a valid implementation, create a dummy one that logs errors
if (!SQLiteImplementation) {
  SQLiteImplementation = {
    openDatabase: (name: string) => {
      const error = new Error('SQLite is not properly initialized');
      console.error('SQLite error:', error);
      
      // Return a dummy database object that logs errors when methods are called
      return {
        transaction: (callback: Function, errorCallback: Function) => {
          const err = new Error('SQLite is not properly initialized');
          console.error('SQLite transaction error:', err);
          if (errorCallback) errorCallback(err);
        }
      };
    }
  };
}

export const openDatabase = (name: string) => {
  console.log('Opening database:', name);
  try {
    return SQLiteImplementation.openDatabase(name);
  } catch (error) {
    console.error('Error opening database:', error);
    throw error;
  }
};

export default {
  openDatabase
}; 