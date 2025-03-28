// Define Priority here to avoid circular dependency
export type Priority = 'low' | 'medium' | 'high';

// Database Schema Constants

// Current schema version
export const SCHEMA_VERSION = 1;

// Database structure
export interface DBTask {
  id: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  completed: boolean;
  categoryId?: string;
  reminder?: number;
  createdAt: string;
  updatedAt: string;
  tags?: Array<{ id: string; name: string; color: string }>;
}

export interface DBComment {
  id: string;
  taskId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBAttachment {
  id: string;
  taskId: string;
  fileName: string;
  fileType: string;
  fileUri: string;
  createdAt: string;
}

export interface DBTag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface DBCategory {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface DBTaskTag {
  taskId: string;
  tagId: string;
}

// Database migrations
export const MIGRATIONS = {
  1: [
    // Create tasks table
    `CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      dueDate TEXT,
      priority TEXT NOT NULL DEFAULT 'medium',
      completed INTEGER NOT NULL DEFAULT 0,
      isMeeting INTEGER NOT NULL DEFAULT 0,
      assignee TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncStatus TEXT NOT NULL DEFAULT 'pending',
      categoryId TEXT,
      reminder INTEGER
    )`,

    // Create comments table
    `CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      taskId TEXT,
      content TEXT,
      authorId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncStatus TEXT NOT NULL DEFAULT 'pending',
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
    )`,

    // Create attachments table
    `CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      taskId TEXT,
      fileName TEXT,
      fileType TEXT,
      fileSize INTEGER,
      localPath TEXT,
      cloudUrl TEXT,
      createdAt TEXT NOT NULL,
      syncStatus TEXT NOT NULL DEFAULT 'pending',
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
    )`,

    // Create tags table
    `CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )`,

    // Create task_tags table for many-to-many relationship
    `CREATE TABLE IF NOT EXISTS task_tags (
      taskId TEXT NOT NULL,
      tagId TEXT NOT NULL,
      PRIMARY KEY (taskId, tagId),
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE
    )`,

    // Create indexes
    `CREATE INDEX IF NOT EXISTS idx_tasks_dueDate ON tasks(dueDate)`,
    `CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)`,
    `CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)`,
    `CREATE INDEX IF NOT EXISTS idx_comments_taskId ON comments(taskId)`,
    `CREATE INDEX IF NOT EXISTS idx_attachments_taskId ON attachments(taskId)`,
    `CREATE INDEX IF NOT EXISTS idx_task_tags_taskId ON task_tags(taskId)`,
    `CREATE INDEX IF NOT EXISTS idx_task_tags_tagId ON task_tags(tagId)`
  ]
}; 