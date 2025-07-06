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

import { Platform } from 'react-native';
import { MIGRATIONS, SCHEMA_VERSION, DBTask, DBComment, DBAttachment, DBTag, DBTaskTag } from './schema';
import { generateId } from '../utils/generateId';

// Import SQLite only for native platforms
let SQLite: any;
if (Platform.OS !== 'web') {
  const { openDatabase } = require('expo-sqlite');
  SQLite = { openDatabase };
}

/**
 * Database service to handle SQLite operations
 */
class DatabaseService {
  private db: any;
  private initialized: boolean = false;
  private isWeb: boolean = Platform.OS === 'web';

  constructor() {
    if (!this.isWeb) {
      try {
        this.db = SQLite.openDatabase('taskmanager.db');
        console.log('SQLite database opened successfully');
      } catch (error) {
        console.error('Error opening SQLite database:', error);
        throw error;
      }
    }
  }

  /**
   * Initialize the database
   */
  async initDatabase(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log('Initializing database...');
      
      if (this.isWeb) {
        // For web, we'll use IndexedDB
        console.log('Web platform detected, using IndexedDB');
        this.initialized = true;
        return;
      }

      if (!this.db) {
        throw new Error('Database not available');
      }

      // Enable foreign key support
      await this.executeSql('PRAGMA foreign_keys = ON;');
      
      // Get current schema version
      const result = await this.executeSql('PRAGMA user_version;');
      const currentVersion = result.rows.item(0).user_version;
      console.log(`Current schema version: ${currentVersion}`);

      // Create tables if they don't exist
      await this.createAllTables();
      
      // Run migrations if needed
      if (currentVersion < SCHEMA_VERSION) {
        await this.runMigrations(currentVersion);
      }
      
      // Create default tags if needed
      await this.createDefaultTagsIfNeeded();
      
      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  /**
   * Force the creation of all database tables
   */
  private async createAllTables(): Promise<void> {
    if (this.isWeb) {
      // For web, we'll use IndexedDB
      return;
    }

    try {
      console.log('Creating all database tables...');
      
      // Create tables in the correct order to handle foreign key constraints
      const createTableQueries = [
        // Create tasks table first (no foreign key dependencies)
        `CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          dueDate TEXT,
          priority TEXT NOT NULL DEFAULT 'medium',
          completed INTEGER NOT NULL DEFAULT 0,
          categoryId TEXT,
          reminder INTEGER,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          syncStatus TEXT NOT NULL DEFAULT 'pending'
        )`,

        // Create subtasks table (depends on tasks)
        `CREATE TABLE IF NOT EXISTS subtasks (
          id TEXT PRIMARY KEY,
          taskId TEXT NOT NULL,
          title TEXT NOT NULL,
          completed INTEGER NOT NULL DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
        )`,

        // Create tags table (no foreign key dependencies)
        `CREATE TABLE IF NOT EXISTS tags (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          createdAt TEXT NOT NULL
        )`,

        // Create task_tags table (depends on tasks and tags)
        `CREATE TABLE IF NOT EXISTS task_tags (
          taskId TEXT NOT NULL,
          tagId TEXT NOT NULL,
          PRIMARY KEY (taskId, tagId),
          FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE
        )`,

        // Create comments table (depends on tasks)
        `CREATE TABLE IF NOT EXISTS comments (
          id TEXT PRIMARY KEY,
          taskId TEXT,
          text TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
        )`,

        // Create attachments table (depends on tasks)
        `CREATE TABLE IF NOT EXISTS attachments (
          id TEXT PRIMARY KEY,
          taskId TEXT,
          fileName TEXT,
          fileType TEXT,
          fileUri TEXT,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
        )`
      ];

      // Execute each query in sequence
      for (const query of createTableQueries) {
        await this.executeSql(query);
      }

      // Create indexes
      const createIndexQueries = [
        'CREATE INDEX IF NOT EXISTS idx_tasks_dueDate ON tasks(dueDate)',
        'CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)',
        'CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)',
        'CREATE INDEX IF NOT EXISTS idx_comments_taskId ON comments(taskId)',
        'CREATE INDEX IF NOT EXISTS idx_attachments_taskId ON attachments(taskId)',
        'CREATE INDEX IF NOT EXISTS idx_subtasks_taskId ON subtasks(taskId)'
      ];

      for (const query of createIndexQueries) {
        try {
          await this.executeSql(query);
        } catch (error) {
          console.warn('Error creating index:', error);
          // Continue even if index creation fails
        }
      }
      
      console.log('All tables and indexes created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  /**
   * Execute a SQL query
   */
  async executeSql(
    query: string, 
    params: any[] = []
  ): Promise<any> {
    if (this.isWeb) {
      // For web, return empty result
      return {
        rows: {
          length: 0,
          item: () => null,
          _array: []
        },
        rowsAffected: 0
      };
    }

    if (!this.db) {
      throw new Error('Database not available');
    }

    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx: any) => {
          tx.executeSql(
            query,
            params,
            (tx: any, result: any) => resolve(result),
            (tx: any, error: any) => reject(error)
          );
        },
        (error: any) => reject(error)
      );
    });
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (!this.isWeb && this.db) {
      this.db.close();
    }
  }

  private async createDefaultTagsIfNeeded(): Promise<void> {
    try {
      const tags = await this.getTags();
      
      // Only create default tags if there are none
      if (tags.length === 0) {
        const defaultTags = [
          { name: 'Work', color: '#3B82F6' }, // Blue
          { name: 'Personal', color: '#10B981' }, // Green
          { name: 'Urgent', color: '#EF4444' }, // Red
          { name: 'Meeting', color: '#8B5CF6' }, // Purple
          { name: 'Ideas', color: '#F59E0B' }, // Amber
        ];
        
        for (const tag of defaultTags) {
          await this.createTag(tag);
        }
      }
    } catch (error) {
      console.error('Failed to create default tags:', error);
    }
  }

  /**
   * Run database migrations
   */
  private async runMigrations(currentVersion: number): Promise<void> {
    console.log(`Running migrations from version ${currentVersion} to ${SCHEMA_VERSION}`);
    
    // Run each migration in sequence
    for (let version = currentVersion + 1; version <= SCHEMA_VERSION; version++) {
      const migrations = MIGRATIONS[version as keyof typeof MIGRATIONS];
      
      if (!migrations) {
        console.warn(`No migrations found for version ${version}`);
        continue;
      }
      
      console.log(`Applying migrations for version ${version} (${migrations.length} statements)`);
      
      try {
        // Execute each migration statement
        for (const migration of migrations) {
          try {
            await this.executeSql(migration);
          } catch (error: any) {
            // If the error is about duplicate column, we can ignore it
            if (error.message?.includes('duplicate column name')) {
              console.log(`Column already exists, skipping: ${migration}`);
              continue;
            }
            throw error;
          }
        }
        
        // Update the schema version
        await this.executeSql(`PRAGMA user_version = ${version}`);
        
        console.log(`Successfully migrated to version ${version}`);
      } catch (error) {
        console.error(`Migration to version ${version} failed:`, error);
        throw error;
      }
    }
  }

  // Task Operations
  async _createTaskInternal(task: Omit<DBTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    console.log('DatabaseService - _createTaskInternal called with data:', task);
    
    if (!this.db) throw new Error('Database not initialized');
    
    const id = Math.random().toString(36).substring(2, 11);
    const now = new Date().toISOString();

    try {
      // Create the task with all columns
      await this.db.runAsync(
        `INSERT INTO tasks (
          id, title, description, dueDate, priority, completed, 
          categoryId, reminder, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          task.title,
          task.description ?? null,
          task.dueDate ?? null,
          task.priority,
          task.completed ? 1 : 0,
          task.categoryId ?? null,
          task.reminder ?? null,
          now,
          now
        ]
      );

      console.log('DatabaseService - Task created successfully with ID:', id);
      return id;
    } catch (error) {
      console.error('DatabaseService - Failed to create task:', error);
      throw error;
    }
  }

  async updateTask(id: string, updates: Partial<DBTask>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'syncStatus') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    try {
      await this.db.runAsync(
        `UPDATE tasks SET ${fields.join(', ')}, updatedAt = ?, syncStatus = 'pending' WHERE id = ?`,
        [...values, now, id]
      );
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  }

  async deleteTask(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      await this.db.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  }

  async getTasks(): Promise<DBTask[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.getAllAsync(
        `SELECT * FROM tasks ORDER BY dueDate ASC`
      );
      
      return result.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        priority: row.priority,
        dueDate: row.dueDate,
        completed: Boolean(row.completed),
        categoryId: row.categoryId,
        reminder: row.reminder,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      }));
    } catch (error) {
      console.error('Failed to get tasks:', error);
      throw error;
    }
  }

  // Comment Operations
  async addComment(comment: Omit<DBComment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    
    const id = Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();

    try {
      await this.db.runAsync(
        `INSERT INTO comments (id, taskId, text, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?)`,
        [id, comment.taskId, comment.text, now, now]
      );
      return id;
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  }

  async getComments(taskId: string): Promise<DBComment[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      return await this.db.getAllAsync<DBComment>(
        'SELECT * FROM comments WHERE taskId = ? ORDER BY createdAt ASC',
        [taskId]
      );
    } catch (error) {
      console.error('Failed to get comments:', error);
      throw error;
    }
  }

  // Tag Operations
  async createTag(tag: Omit<DBTag, 'id' | 'createdAt'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    
    const id = Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();

    try {
      await this.db.runAsync(
        'INSERT INTO tags (id, name, color, createdAt) VALUES (?, ?, ?, ?)',
        [id, tag.name, tag.color, now]
      );
      return id;
    } catch (error) {
      console.error('Failed to create tag:', error);
      throw error;
    }
  }

  async getTags(): Promise<DBTag[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      return await this.db.getAllAsync<DBTag>('SELECT * FROM tags ORDER BY name ASC');
    } catch (error) {
      console.error('Failed to get tags:', error);
      throw error;
    }
  }

  async addTagToTask(taskId: string, tagId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      await this.db.runAsync(
        'INSERT OR IGNORE INTO task_tags (taskId, tagId) VALUES (?, ?)',
        [taskId, tagId]
      );
    } catch (error) {
      console.error('Failed to add tag to task:', error);
      throw error;
    }
  }

  async removeTagFromTask(taskId: string, tagId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      await this.db.runAsync(
        'DELETE FROM task_tags WHERE taskId = ? AND tagId = ?',
        [taskId, tagId]
      );
    } catch (error) {
      console.error('Failed to remove tag from task:', error);
      throw error;
    }
  }

  // Attachment Operations
  async addAttachment(attachment: Omit<DBAttachment, 'id' | 'createdAt'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    
    const id = Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();

    try {
      await this.db.runAsync(
        `INSERT INTO attachments (
          id, taskId, fileName, fileType, fileUri, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id, attachment.taskId, attachment.fileName, attachment.fileType,
          attachment.fileUri, now
        ]
      );
      return id;
    } catch (error) {
      console.error('Failed to add attachment:', error);
      throw error;
    }
  }

  async getAttachments(taskId: string): Promise<DBAttachment[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      return await this.db.getAllAsync<DBAttachment>(
        'SELECT * FROM attachments WHERE taskId = ? ORDER BY createdAt DESC',
        [taskId]
      );
    } catch (error) {
      console.error('Failed to get attachments:', error);
      throw error;
    }
  }

  // Sync Operations
  async getPendingSyncItems(): Promise<{
    tasks: DBTask[];
    comments: DBComment[];
    attachments: DBAttachment[];
  }> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const tasks = await this.db.getAllAsync<DBTask>("SELECT * FROM tasks WHERE syncStatus = 'pending'");
      const comments = await this.db.getAllAsync<DBComment>("SELECT * FROM comments WHERE syncStatus = 'pending'");
      const attachments = await this.db.getAllAsync<DBAttachment>("SELECT * FROM attachments WHERE syncStatus = 'pending'");
      
      return { tasks, comments, attachments };
    } catch (error) {
      console.error('Failed to get pending sync items:', error);
      throw error;
    }
  }

  async markAsSynced(type: 'task' | 'comment' | 'attachment', id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const table = `${type}s`;
    const now = new Date().toISOString();

    try {
      await this.db.runAsync(
        `UPDATE ${table} SET syncStatus = 'synced', lastSyncedAt = ? WHERE id = ?`,
        [now, id]
      );
    } catch (error) {
      console.error(`Failed to mark ${type} as synced:`, error);
      throw error;
    }
  }

  /**
   * Begin a database transaction
   */
  async transaction<T>(callback: (tx: SQLTransaction) => Promise<T>): Promise<T> {
    try {
      // Start transaction
      await this.executeSql('BEGIN TRANSACTION;');
      
      // Create transaction object with executeSql method
      const tx: SQLTransaction = {
        executeSql: async (sql, args) => {
          const result = await this.executeSql(sql, args || []);
          return result;
        }
      } as SQLTransaction;
      
      // Execute callback
      const result = await callback(tx);
      
      // Commit if successful
      await this.executeSql('COMMIT;');
      return result;
    } catch (error) {
      // Rollback on error
      await this.executeSql('ROLLBACK;');
      throw error;
    }
  }
}

// Create a singleton instance
const databaseService = new DatabaseService();

export default databaseService; 