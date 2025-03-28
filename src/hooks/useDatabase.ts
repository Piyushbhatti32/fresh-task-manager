import { useState, useEffect } from 'react';
import * as SQLite from 'expo-sqlite';
import { DBTask, DBComment, DBAttachment, DBTag } from '../database/schema';

// Define custom interfaces for SQLite types
interface SQLResultSet {
  insertId?: number;
  rowsAffected: number;
  rows: {
    length: number;
    item: (idx: number) => any;
    _array: any[];
    [index: number]: any;
  };
}

interface SQLTransaction {
  executeSql: (
    sqlStatement: string,
    args?: any[],
    callback?: (transaction: SQLTransaction, resultSet: SQLResultSet) => void,
    errorCallback?: (transaction: SQLTransaction, error: Error) => boolean
  ) => void;
}

/**
 * Custom hook for database operations
 */
export const useDatabase = () => {
  const [database, setDatabase] = useState<SQLite.SQLiteDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tasks, setTasks] = useState<DBTask[]>([]);
  const [tags, setTags] = useState<DBTag[]>([]);

  // Initialize database
  useEffect(() => {
    const initDatabase = async () => {
      try {
        setIsLoading(true);
        
        // Open database
        const db = SQLite.openDatabaseSync('taskmanager.db');
        setDatabase(db);
        
        // Load initial data
        await refreshData();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    initDatabase();
  }, []);

  // Refresh all data from database
  const refreshData = async () => {
    if (!database) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch tasks
      const taskResults = await executeSql('SELECT * FROM tasks ORDER BY dueDate ASC');
      setTasks(taskResults.rows._array || []);
      
      // Fetch tags
      const tagResults = await executeSql('SELECT * FROM tags ORDER BY name ASC');
      setTags(tagResults.rows._array || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  // Execute SQL
  const executeSql = async (
    query: string, 
    params: any[] = []
  ): Promise<SQLResultSet> => {
    return new Promise((resolve, reject) => {
      if (!database) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      (database as any).transaction((tx: SQLTransaction) => {
        tx.executeSql(
          query,
          params,
          (_: SQLTransaction, result: SQLResultSet) => resolve(result),
          (_: SQLTransaction, error: Error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  };

  // Create a new task
  const createTask = async (
    task: Omit<DBTask, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    const now = new Date().toISOString();
    const result = await executeSql(
      `INSERT INTO tasks (
        title, description, priority, dueDate, completed,
        categoryId, reminder, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.title,
        task.description || null,
        task.priority,
        task.dueDate || null,
        task.completed ? 1 : 0,
        task.categoryId || null,
        task.reminder || null,
        now,
        now
      ]
    );
    
    const id = result.insertId?.toString() || '';
    await refreshData();
    return id;
  };

  // Update an existing task
  const updateTask = async (id: string, updates: Partial<DBTask>): Promise<void> => {
    const setClause = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'createdAt')
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.entries(updates)
      .filter(([key]) => key !== 'id' && key !== 'createdAt')
      .map(([_, value]) => {
        if (typeof value === 'boolean') return value ? 1 : 0;
        return value;
      });
    
    await executeSql(
      `UPDATE tasks SET ${setClause}, updatedAt = ? WHERE id = ?`,
      [...values, new Date().toISOString(), id]
    );
    
    await refreshData();
  };

  // Delete a task
  const deleteTask = async (id: string): Promise<void> => {
    await executeSql('DELETE FROM tasks WHERE id = ?', [id]);
    await refreshData();
  };

  // Add a comment
  const addComment = async (
    comment: Omit<DBComment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    const now = new Date().toISOString();
    const result = await executeSql(
      'INSERT INTO comments (taskId, text, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
      [comment.taskId, comment.text, now, now]
    );
    
    return result.insertId?.toString() || '';
  };

  // Get comments for a task
  const getComments = async (taskId: string): Promise<DBComment[]> => {
    const result = await executeSql(
      'SELECT * FROM comments WHERE taskId = ? ORDER BY createdAt DESC',
      [taskId]
    );
    
    return result.rows._array || [];
  };

  // Create a tag
  const createTag = async (
    tag: Omit<DBTag, 'id' | 'createdAt'>
  ): Promise<string> => {
    const now = new Date().toISOString();
    const result = await executeSql(
      'INSERT INTO tags (name, color, createdAt) VALUES (?, ?, ?)',
      [tag.name, tag.color, now]
    );
    
    await refreshData();
    return result.insertId?.toString() || '';
  };

  // Add tag to task
  const addTagToTask = async (taskId: string, tagId: string): Promise<void> => {
    await executeSql(
      'INSERT OR IGNORE INTO task_tags (taskId, tagId) VALUES (?, ?)',
      [taskId, tagId]
    );
  };

  // Remove tag from task
  const removeTagFromTask = async (taskId: string, tagId: string): Promise<void> => {
    await executeSql(
      'DELETE FROM task_tags WHERE taskId = ? AND tagId = ?',
      [taskId, tagId]
    );
  };

  // Add attachment
  const addAttachment = async (
    attachment: Omit<DBAttachment, 'id' | 'createdAt'>
  ): Promise<string> => {
    const now = new Date().toISOString();
    const result = await executeSql(
      'INSERT INTO attachments (taskId, fileName, fileType, fileUri, createdAt) VALUES (?, ?, ?, ?, ?)',
      [
        attachment.taskId,
        attachment.fileName,
        attachment.fileType,
        attachment.fileUri,
        now
      ]
    );
    
    return result.insertId?.toString() || '';
  };

  // Get attachments for a task
  const getAttachments = async (taskId: string): Promise<DBAttachment[]> => {
    const result = await executeSql(
      'SELECT * FROM attachments WHERE taskId = ? ORDER BY createdAt DESC',
      [taskId]
    );
    
    return result.rows._array || [];
  };

  // Get tasks by priority
  const getTasksByPriority = (priority: string): DBTask[] => {
    return tasks.filter(task => task.priority === priority);
  };

  // Get tasks by tag
  const getTasksByTag = (tagId: string): DBTask[] => {
    // This is a simplified version - in reality, you'd query the database
    // using a JOIN with task_tags table
    return tasks.filter(task => 
      task.tags && task.tags.some((tag: any) => tag.id === tagId)
    );
  };

  // Get overdue tasks
  const getOverdueTasks = (): DBTask[] => {
    const now = new Date();
    return tasks.filter(task => 
      !task.completed && 
      task.dueDate && 
      new Date(task.dueDate) < now
    );
  };

  // Get today's tasks
  const getTodayTasks = (): DBTask[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return tasks.filter(task => 
      !task.completed && 
      task.dueDate && 
      new Date(task.dueDate) >= today && 
      new Date(task.dueDate) < tomorrow
    );
  };

  return {
    isLoading,
    error,
    tasks,
    tags,
    refreshData,
    executeSql,
    createTask,
    updateTask,
    deleteTask,
    addComment,
    getComments,
    createTag,
    addTagToTask,
    removeTagFromTask,
    addAttachment,
    getAttachments,
    getTasksByPriority,
    getTasksByTag,
    getOverdueTasks,
    getTodayTasks
  };
}; 