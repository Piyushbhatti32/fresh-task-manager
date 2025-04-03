import * as SQLite from 'expo-sqlite';
import { Task } from '../types/Task';

export default class TaskRepository {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabaseSync('taskmanager.db');
  }

  async toggleTaskCompletion(taskId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!taskId || typeof taskId !== 'string') {
        reject(new Error('Invalid task ID'));
        return;
      }

      this.db.transaction((tx: SQLite.SQLTransaction) => {
        tx.executeSql(
          'UPDATE tasks SET completed = NOT completed, updatedAt = ? WHERE id = ?',
          [new Date().toISOString(), taskId],
          (_: SQLite.SQLTransaction, result: SQLite.SQLResultSet) => {
            console.log('Update result:', result);
            resolve(result.rowsAffected > 0);
          },
          (_: SQLite.SQLTransaction, error: SQLite.SQLError) => {
            console.error('SQL Error:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }
}
