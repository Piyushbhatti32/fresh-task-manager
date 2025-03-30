import { DatabaseService } from './src/database/DatabaseService';

async function countTasks() {
  try {
    // Initialize the database service
    const db = new DatabaseService();
    await db.initDatabase();
    
    // Run the count query
    const result = await db.executeSql('SELECT COUNT(*) as count FROM tasks');
    
    // Output the result
    const count = result.rows[0].count;
    console.log(`Total number of tasks in database: ${count}`);
  } catch (error) {
    console.error('Error counting tasks:', error);
  }
}

// Execute the function
countTasks(); 