import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { format } from 'date-fns';
import { Task, SubTask } from '../types/Task';
import { useTaskStore } from '../stores/taskStore';
import { useTheme } from '../theme/ThemeProvider';
import { Ionicons, MaterialIcons, AntDesign } from '@expo/vector-icons';
import databaseService from '../database/DatabaseService';
import TaskItem from './TaskItem';
import AnimatedEmptyState from './AnimatedEmptyState';

interface TaskListProps {
  onTaskPress: (taskId: string) => void;
  onStartPomodoro?: (taskId: string) => void;
  onToggle?: (taskId: string) => void;
  filter?: {
    status?: 'completed' | 'pending';
    priority?: 'high' | 'medium' | 'low';
    tag?: string;
  };
  sortBy?: 'dueDate' | 'priority' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  tasks?: Task[];
}

export default function TaskList({ 
  onTaskPress, 
  onStartPomodoro,
  onToggle,
  filter, 
  sortBy = 'dueDate', 
  sortOrder = 'asc',
  tasks: providedTasks
}: TaskListProps) {
  const { theme, isDark } = useTheme();
  const { tasks: storeTasks, isLoading, error, fetchTasks, markTaskAsCompleted } = useTaskStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Log how many tasks were provided through props
  useEffect(() => {
    if (providedTasks) {
      console.log(`TaskList received ${providedTasks.length} tasks from props`);
      providedTasks.forEach((task, index) => {
        console.log(`Task ${index + 1}: ID=${task.id}, Title=${task.title}, Completed=${task.completed}`);
      });
    } else {
      console.log('TaskList: No tasks provided through props, will load from database');
    }
  }, [providedTasks]);

  useEffect(() => {
    loadTasks();
  }, [filter, sortBy, sortOrder]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      let query = `
        SELECT t.*, GROUP_CONCAT(tag.name) as tagNames, GROUP_CONCAT(tag.color) as tagColors
        FROM tasks t
        LEFT JOIN task_tags tt ON t.id = tt.taskId
        LEFT JOIN tags tag ON tt.tagId = tag.id
      `;

      const whereConditions = [];
      const params = [];

      if (filter?.status) {
        whereConditions.push('t.completed = ?');
        params.push(filter.status === 'completed' ? 1 : 0);
      }

      if (filter?.priority) {
        whereConditions.push('t.priority = ?');
        params.push(filter.priority);
      }

      if (filter?.tag) {
        whereConditions.push('tag.name = ?');
        params.push(filter.tag);
      }

      if (whereConditions.length > 0) {
        query += ' WHERE ' + whereConditions.join(' AND ');
      }

      query += ' GROUP BY t.id';

      if (sortBy) {
        const sortColumn = sortBy === 'createdAt' ? 't.createdAt' : 
                          sortBy === 'priority' ? 't.priority' :
                          't.dueDate';
        query += ` ORDER BY ${sortColumn} ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
      }

      const result = await databaseService.executeSql(query, params);
      const fetchedTasks = result.rows._array.map(row => ({
        ...row,
        tags: row.tagNames ? 
          row.tagNames.split(',').map((name: string, i: number) => ({
            name,
            color: row.tagColors.split(',')[i]
          })) : []
      }));
      
      setTasks(fetchedTasks);
      setErrorState(null);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setErrorState('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (errorState) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.error, { color: theme.colors.error }]}>{errorState}</Text>
      </View>
    );
  }

  if (tasks.length === 0) {
    return (
      <AnimatedEmptyState 
        message="No tasks found" 
        icon="clipboard-outline"
      />
    );
  }

  return (
    <FlatList
      data={providedTasks || tasks}
      keyExtractor={(item) => item?.id || `task-${Math.random().toString(36)}`}
      renderItem={({ item }) => (
        <TaskItem
          task={item}
          onPress={() => onTaskPress(item.id)}
          onStartPomodoro={onStartPomodoro ? (taskId) => onStartPomodoro(taskId) : undefined}
          onToggle={onToggle ? () => {
            console.log('Toggling task completion from TaskList:', item.id);
            onToggle(item.id);
          } : undefined}
        />
      )}
      initialNumToRender={20}
      maxToRenderPerBatch={20}
      windowSize={21}
      onEndReachedThreshold={0.5}
      onEndReached={() => console.log('Reached end of list')}
      style={styles.list}
      contentContainerStyle={styles.content}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
}); 