import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList 
} from 'react-native';
import {
  Appbar,
  Button,
  FAB,
  Modal,
  Portal,
  Text,
  useTheme
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { Task } from '../types/Task';
import { useDatabase } from '../hooks/useDatabase';
import ViewToggle, { ViewMode } from '../components/ViewToggle';
import TaskList from '../components/TaskList';
import TaskGridView from '../components/TaskGridView';
import TimelineView from '../components/TimelineView';
import InlinePomodoroTimer from '../components/InlinePomodoroTimer';
import TaskForm from '../components/TaskForm';

type TasksScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

const TasksScreen = () => {
  const navigation = useNavigation<TasksScreenNavigationProp>();
  const { colors } = useTheme();
  const { tasks, createTask, updateTask } = useDatabase();
  
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filter, setFilter] = useState<{
    status?: 'completed' | 'pending';
    priority?: 'high' | 'medium' | 'low';
    tag?: string;
  }>({});
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'createdAt'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showForm, setShowForm] = useState(false);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [pomodoroTaskId, setPomodoroTaskId] = useState<string | undefined>(undefined);
  
  // Navigate to task details
  const handleTaskPress = (taskId: string) => {
    navigation.navigate('EditTask', { taskId });
  };
  
  // Start pomodoro timer
  const handleStartPomodoro = (taskId: string) => {
    setPomodoroTaskId(taskId);
    setShowPomodoro(true);
  };

  // Toggle task completion
  const handleToggleCompletion = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await updateTask(taskId, { completed: !task.completed });
    }
  };
  
  // Create a new task
  const handleCreateTask = async (taskData: Partial<Task>) => {
    await createTask(taskData as any);
    setShowForm(false);
  };
  
  // Apply filter and sorting
  const getFilteredTasks = () => {
    let filteredTasks = [...tasks];
    
    // Apply filters
    if (filter.status === 'completed') {
      filteredTasks = filteredTasks.filter(task => task.completed);
    } else if (filter.status === 'pending') {
      filteredTasks = filteredTasks.filter(task => !task.completed);
    }
    
    if (filter.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === filter.priority);
    }
    
    // Apply sorting
    filteredTasks.sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = a.priority ? priorityOrder[a.priority] || 0 : 0;
        const bPriority = b.priority ? priorityOrder[b.priority] || 0 : 0;
        return sortOrder === 'asc' ? aPriority - bPriority : bPriority - aPriority;
      } else if (sortBy === 'dueDate') {
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      } else {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      }
    });
    
    return filteredTasks;
  };
  
  // Filtered tasks
  const filteredTasks = getFilteredTasks();
  
  // Render the task view based on view mode
  const renderTaskView = () => {
    if (viewMode === 'list') {
      return (
        <TaskList
          {...{
            tasks: filteredTasks,
            onPress: handleTaskPress,
            onStartPomodoro: handleStartPomodoro
          } as any}
        />
      );
    } else if (viewMode === 'grid') {
      return (
        <TaskGridView 
          {...{
            tasks: filteredTasks,
            onPress: (task: Task) => handleTaskPress(task.id),
            onToggleCompletion: (task: Task) => handleToggleCompletion(task.id),
            onStartPomodoro: handleStartPomodoro
          } as any}
        />
      );
    } else {
      return (
        <TimelineView 
          {...{
            tasks: filteredTasks,
            onPress: (task: Task) => handleTaskPress(task.id),
            onStartPomodoro: handleStartPomodoro
          } as any}
        />
      );
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header>
        <Appbar.Content title="Tasks" />
        <Appbar.Action icon="filter" onPress={() => {}} />
        <Appbar.Action icon="sort" onPress={() => {}} />
      </Appbar.Header>
      
      <View style={styles.viewOptions}>
        <ViewToggle
          mode={viewMode}
          onToggle={setViewMode}
        />
      </View>
      
      {filteredTasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ color: colors.onSurface }}>No tasks found</Text>
          <Button 
            mode="contained" 
            onPress={() => setShowForm(true)}
            style={{ marginTop: 16 }}
          >
            Create Task
          </Button>
        </View>
      ) : (
        <View style={styles.content}>
          {renderTaskView()}
        </View>
      )}
      
      <FAB
        style={[styles.fab, { backgroundColor: colors.primary }]}
        icon="plus"
        onPress={() => setShowForm(true)}
      />
      
      <Portal>
        <Modal
          visible={showForm}
          onDismiss={() => setShowForm(false)}
          contentContainerStyle={[
            styles.modalContent,
            { backgroundColor: colors.background }
          ]}
        >
          <TaskForm
            {...{
              onSave: handleCreateTask,
              onCancel: () => setShowForm(false)
            } as any}
          />
        </Modal>
        
        <Modal
          visible={showPomodoro}
          onDismiss={() => setShowPomodoro(false)}
          contentContainerStyle={[
            styles.modalContent,
            { backgroundColor: colors.background }
          ]}
        >
          <InlinePomodoroTimer
            {...{
              taskId: pomodoroTaskId,
              onMinimize: () => setShowPomodoro(false)
            } as any}
          />
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  viewOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
});

export default TasksScreen;