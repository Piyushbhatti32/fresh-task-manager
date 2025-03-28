import databaseService from './DatabaseService';
import { Task } from '../types/Task';
import { formatISO } from 'date-fns';

/**
 * Repository class for Task-related database operations
 */
class TaskRepository {
  /**
   * Create a new task
   */
  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const now = formatISO(new Date());
    
    const result = await databaseService.executeSql(
      `INSERT INTO tasks (
        title, description, dueDate, priority, completed, category, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.title,
        task.description || null,
        task.dueDate || null,
        task.priority || null,
        task.completed ? 1 : 0,
        task.categoryId || null,
        now,
        now
      ]
    );
    
    return result.insertId || 0;
  }

  /**
   * Get a task by id
   */
  async getTaskById(id: number): Promise<Task | null> {
    const result = await databaseService.executeSql(
      'SELECT * FROM tasks WHERE id = ?',
      [id]
    );
    
    if (result.rows.length === 0) return null;
    
    const task = result.rows.item(0);
    return this.mapTaskFromDatabase(task);
  }

  /**
   * Get all tasks, optionally filtered
   */
  async getTasks(options: {
    completed?: boolean,
    category?: string,
    priority?: Task['priority']
  } = {}): Promise<Task[]> {
    let query = 'SELECT * FROM tasks';
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (options.completed !== undefined) {
      conditions.push('completed = ?');
      params.push(options.completed ? 1 : 0);
    }
    
    if (options.category) {
      conditions.push('category = ?');
      params.push(options.category);
    }
    
    if (options.priority) {
      conditions.push('priority = ?');
      params.push(options.priority);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY dueDate ASC, priority DESC, created_at DESC';
    
    const result = await databaseService.executeSql(query, params);
    const tasks: Task[] = [];
    
    for (let i = 0; i < result.rows.length; i++) {
      tasks.push(this.mapTaskFromDatabase(result.rows.item(i)));
    }
    
    return tasks;
  }

  /**
   * Update a task
   */
  async updateTask(id: number, task: Partial<Task>): Promise<boolean> {
    const setValues: string[] = [];
    const params: any[] = [];
    
    if (task.title !== undefined) {
      setValues.push('title = ?');
      params.push(task.title);
    }
    
    if (task.description !== undefined) {
      setValues.push('description = ?');
      params.push(task.description);
    }
    
    if (task.dueDate !== undefined) {
      setValues.push('dueDate = ?');
      params.push(task.dueDate);
    }
    
    if (task.priority !== undefined) {
      setValues.push('priority = ?');
      params.push(task.priority);
    }
    
    if (task.completed !== undefined) {
      setValues.push('completed = ?');
      params.push(task.completed ? 1 : 0);
    }
    
    if (task.categoryId !== undefined) {
      setValues.push('category_id = ?');
      params.push(task.categoryId);
    }
    
    setValues.push('updated_at = ?');
    params.push(formatISO(new Date()));
    
    // Add id as the last parameter
    params.push(id);
    
    const query = `UPDATE tasks SET ${setValues.join(', ')} WHERE id = ?`;
    
    const result = await databaseService.executeSql(query, params);
    return result.rowsAffected > 0;
  }

  /**
   * Delete a task
   */
  async deleteTask(id: number): Promise<boolean> {
    const result = await databaseService.executeSql(
      'DELETE FROM tasks WHERE id = ?',
      [id]
    );
    
    return result.rowsAffected > 0;
  }

  /**
   * Map a database row to a Task object
   */
  private mapTaskFromDatabase(row: any): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      dueDate: row.dueDate,
      priority: row.priority as Task['priority'],
      completed: Boolean(row.completed),
      categoryId: row.category_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

const taskRepository = new TaskRepository();
export default taskRepository; 