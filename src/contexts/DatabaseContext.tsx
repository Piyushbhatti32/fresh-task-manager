import React, { createContext, useContext } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useDatabase } from '../hooks/useDatabase';
import { DBTask, DBComment, DBAttachment, DBTag } from '../database/schema';
import { useTheme } from '../theme/ThemeProvider';

// Retry mechanism
const retryOperation = async <T,>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
};

interface DatabaseContextType {
  isLoading: boolean;
  error: Error | null;
  tasks: DBTask[];
  tags: DBTag[];
  refreshData: () => Promise<void>;
  createTask: (task: Omit<DBTask, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTask: (id: string, updates: Partial<DBTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addComment: (comment: Omit<DBComment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  getComments: (taskId: string) => Promise<DBComment[]>;
  createTag: (tag: Omit<DBTag, 'id' | 'createdAt'>) => Promise<string>;
  addTagToTask: (taskId: string, tagId: string) => Promise<void>;
  removeTagFromTask: (taskId: string, tagId: string) => Promise<void>;
  addAttachment: (attachment: Omit<DBAttachment, 'id' | 'createdAt'>) => Promise<string>;
  getAttachments: (taskId: string) => Promise<DBAttachment[]>;
  getTasksByPriority: (priority: string) => DBTask[];
  getTasksByTag: (tagId: string) => DBTask[];
  getOverdueTasks: () => DBTask[];
  getTodayTasks: () => DBTask[];
  retryFailedOperation: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const database = useDatabase();
  const { theme } = useTheme();

  // Wrap database operations with retry mechanism
  const wrappedDatabase: DatabaseContextType = {
    ...database,
    createTask: (task: Omit<DBTask, 'id' | 'createdAt' | 'updatedAt'>) =>
      retryOperation(() => database.createTask(task)),
    updateTask: (id: string, updates: Partial<DBTask>) =>
      retryOperation(() => database.updateTask(id, updates)),
    deleteTask: (id: string) =>
      retryOperation(() => database.deleteTask(id)),
    addComment: (comment: Omit<DBComment, 'id' | 'createdAt' | 'updatedAt'>) =>
      retryOperation(() => database.addComment(comment)),
    getComments: (taskId: string) =>
      retryOperation(() => database.getComments(taskId)),
    createTag: (tag: Omit<DBTag, 'id' | 'createdAt'>) =>
      retryOperation(() => database.createTag(tag)),
    addTagToTask: (taskId: string, tagId: string) =>
      retryOperation(() => database.addTagToTask(taskId, tagId)),
    removeTagFromTask: (taskId: string, tagId: string) =>
      retryOperation(() => database.removeTagFromTask(taskId, tagId)),
    addAttachment: (attachment: Omit<DBAttachment, 'id' | 'createdAt'>) =>
      retryOperation(() => database.addAttachment(attachment)),
    getAttachments: (taskId: string) =>
      retryOperation(() => database.getAttachments(taskId)),
    retryFailedOperation: async () => {
      if (database.error) {
        await database.refreshData();
      }
    }
  };

  return (
    <DatabaseContext.Provider value={wrappedDatabase}>
      {children}
    </DatabaseContext.Provider>
  );
}

export const useDbContext = (): DatabaseContextType => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDbContext must be used within a DatabaseProvider');
  }
  return context;
};

// Loading wrapper component
export function withDatabase<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function WithDatabaseWrapper(props: P) {
    const { isLoading, error, retryFailedOperation } = useDbContext();
    const { theme } = useTheme();

    if (isLoading) {
      return <LoadingScreen theme={theme} />;
    }

    if (error) {
      return <ErrorScreen error={error} onRetry={retryFailedOperation} theme={theme} />;
    }

    return <WrappedComponent {...props} />;
  };
}

// Loading screen component
function LoadingScreen({ theme }: { theme: any }) {
  return (
    <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading...</Text>
    </View>
  );
}

// Error screen component
function ErrorScreen({ 
  error, 
  onRetry, 
  theme 
}: { 
  error: Error; 
  onRetry: () => Promise<void>;
  theme: any;
}) {
  return (
    <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.errorText, { color: theme.colors.error }]}>
        Error: {error.message}
      </Text>
      <TouchableOpacity 
        style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
        onPress={onRetry}
      >
        <Text style={[styles.retryButtonText, { color: theme.colors.onPrimary }]}>
          Retry
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 32,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 