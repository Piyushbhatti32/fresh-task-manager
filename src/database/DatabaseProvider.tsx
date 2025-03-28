import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import databaseService from './DatabaseService';

interface DatabaseContextType {
  isDbReady: boolean;
}

const DatabaseContext = createContext<DatabaseContextType>({ isDbReady: false });

export const useDatabase = () => useContext(DatabaseContext);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDbReady, setIsDbReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initDb = async () => {
      try {
        console.log('Initializing database from DatabaseProvider...');
        await databaseService.initDatabase();
        setIsDbReady(true);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError('Failed to initialize database. Please restart the app.');
      }
    };

    initDb();
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 16, color: 'red', textAlign: 'center', marginBottom: 20 }}>
          {error}
        </Text>
      </View>
    );
  }

  if (!isDbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 20, fontSize: 16 }}>Initializing database...</Text>
      </View>
    );
  }

  return (
    <DatabaseContext.Provider value={{ isDbReady }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export default DatabaseProvider; 