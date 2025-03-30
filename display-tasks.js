// This script will run SQL to fetch all tasks from the database

// Import the expo-sqlite module
const SQLite = require('expo-sqlite');

// Open the database
const db = SQLite.openDatabase('taskmanager.db');

// Function to fetch all tasks
function fetchAllTasks() {
  console.log("Fetching all tasks from the database...");
  
  // Execute the query
  db.transaction(tx => {
    tx.executeSql(
      'SELECT COUNT(*) as count FROM tasks',
      [],
      (_, result) => {
        console.log(`Total tasks in database: ${result.rows._array[0].count}`);
      },
      (_, error) => {
        console.error("Error counting tasks:", error);
        return false;
      }
    );
    
    tx.executeSql(
      'SELECT * FROM tasks',
      [],
      (_, result) => {
        console.log("All tasks:");
        result.rows._array.forEach((task, index) => {
          console.log(`Task ${index + 1}: ID=${task.id}, Title=${task.title}, Completed=${task.completed}`);
        });
      },
      (_, error) => {
        console.error("Error fetching tasks:", error);
        return false;
      }
    );
  });
}

// Run the function
fetchAllTasks(); 