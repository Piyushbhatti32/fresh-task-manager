import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList,
  TextInput,
  TouchableOpacity
} from 'react-native';
import {
  Button,
  Modal,
  Portal,
  Text,
  useTheme,
  IconButton,
  Menu,
  Divider,
  Searchbar,
  Chip,
  Surface,
  Card
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { Task } from '../types/Task';
import ViewToggle, { ViewMode } from '../components/ViewToggle';
import TaskList from '../components/TaskList';
import TaskGridView from '../components/TaskGridView';
import TimelineView from '../components/TimelineView';
import InlinePomodoroTimer from '../components/InlinePomodoroTimer';
import TaskForm from '../components/TaskForm';
import { useTaskStore } from '../stores/taskStore';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';

type TasksScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

const TasksScreen = () => {
  const navigation = useNavigation<TasksScreenNavigationProp>();
  const { colors, isDark } = useTheme();
  const { tasks, isLoading, fetchTasks, createTask, updateTask } = useTaskStore();
  
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
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
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Fetch tasks when component mounts
  useEffect(() => {
    const loadTasks = async () => {
      try {
        await fetchTasks();
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    };
    loadTasks();
  }, [fetchTasks]);
  
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
  
  // Apply filter, search, and sorting
  const getFilteredTasks = () => {
    let filteredTasks = [...tasks];
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    }
    
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

  const renderTaskView = () => {
    const filteredTasks = getFilteredTasks();
    
    if (filteredTasks.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="assignment" size={64} color={colors.primary} />
          <Text style={styles.emptyText}>No tasks found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? 'Try adjusting your search' : 'Create a new task to get started'}
          </Text>
          <Button 
            mode="contained" 
            onPress={() => setShowForm(true)}
            style={styles.createButton}
          >
            Create Task
          </Button>
        </View>
      );
    }

    switch (viewMode) {
      case 'grid':
        return (
          <TaskGridView
            tasks={filteredTasks}
            onTaskPress={handleTaskPress}
            onStartPomodoro={handleStartPomodoro}
            onToggleCompletion={handleToggleCompletion}
          />
        );
      case 'timeline':
        return (
          <TimelineView
            tasks={filteredTasks}
            onTaskPress={handleTaskPress}
            onStartPomodoro={handleStartPomodoro}
            onToggleCompletion={handleToggleCompletion}
          />
        );
      default:
        return (
          <TaskList
            tasks={filteredTasks}
            onTaskPress={handleTaskPress}
            onStartPomodoro={handleStartPomodoro}
            onToggle={handleToggleCompletion}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search tasks..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            iconColor={colors.primary}
            inputStyle={{ color: colors.onSurface }}
          />
        </View>

        <View style={styles.controlsContainer}>
          <ViewToggle
            mode={viewMode}
            onToggle={setViewMode}
          />
          
          <View style={styles.filterContainer}>
            <Menu
              visible={showFilterMenu}
              onDismiss={() => setShowFilterMenu(false)}
              anchor={
                <IconButton
                  icon="filter-variant"
                  size={24}
                  onPress={() => setShowFilterMenu(true)}
                />
              }
            >
              <Menu.Item 
                onPress={() => {
                  setFilter({ ...filter, status: 'pending' });
                  setShowFilterMenu(false);
                }}
                title="Show Pending"
                leadingIcon="clock-outline"
              />
              <Menu.Item 
                onPress={() => {
                  setFilter({ ...filter, status: 'completed' });
                  setShowFilterMenu(false);
                }}
                title="Show Completed"
                leadingIcon="check-circle"
              />
              <Divider />
              <Menu.Item 
                onPress={() => {
                  setFilter({ ...filter, priority: 'high' });
                  setShowFilterMenu(false);
                }}
                title="High Priority"
                leadingIcon="arrow-upward"
              />
              <Menu.Item 
                onPress={() => {
                  setFilter({ ...filter, priority: 'medium' });
                  setShowFilterMenu(false);
                }}
                title="Medium Priority"
                leadingIcon="remove"
              />
              <Menu.Item 
                onPress={() => {
                  setFilter({ ...filter, priority: 'low' });
                  setShowFilterMenu(false);
                }}
                title="Low Priority"
                leadingIcon="arrow-downward"
              />
            </Menu>

            <Menu
              visible={showSortMenu}
              onDismiss={() => setShowSortMenu(false)}
              anchor={
                <IconButton
                  icon="sort"
                  size={24}
                  onPress={() => setShowSortMenu(true)}
                />
              }
            >
              <Menu.Item 
                onPress={() => {
                  setSortBy('priority');
                  setShowSortMenu(false);
                }}
                title="Sort by Priority"
                leadingIcon="flag"
              />
              <Menu.Item 
                onPress={() => {
                  setSortBy('dueDate');
                  setShowSortMenu(false);
                }}
                title="Sort by Due Date"
                leadingIcon="calendar"
              />
              <Menu.Item 
                onPress={() => {
                  setSortBy('createdAt');
                  setShowSortMenu(false);
                }}
                title="Sort by Created Date"
                leadingIcon="clock"
              />
            </Menu>
          </View>
        </View>

        {renderTaskView()}
      </View>

      <Portal>
        <Modal
          visible={showForm}
          onDismiss={() => setShowForm(false)}
          contentContainerStyle={styles.modalContent}
        >
          <TaskForm
            onClose={() => setShowForm(false)}
            onSave={handleCreateTask}
          />
        </Modal>

        <Modal
          visible={showPomodoro}
          onDismiss={() => setShowPomodoro(false)}
          contentContainerStyle={styles.modalContent}
        >
          <InlinePomodoroTimer
            taskId={pomodoroTaskId}
            onClose={() => setShowPomodoro(false)}
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
  content: {
    flex: 1,
    padding: 4,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchBar: {
    elevation: 2,
    borderRadius: 12,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 24,
    textAlign: 'center',
  },
  createButton: {
    marginTop: 8,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  gridList: {
    padding: 4,
  },
  gridItem: {
    flex: 1,
    padding: 4,
  },
  gridCard: {
    margin: 0,
    height: 160,
  },
  gridCardContent: {
    padding: 12,
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  gridTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  gridDescription: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 8,
  },
  gridFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  gridDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridDate: {
    fontSize: 12,
    marginLeft: 4,
  },
  gridTagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridTags: {
    fontSize: 12,
    marginLeft: 4,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 10,
    color: '#fff',
    textTransform: 'capitalize',
  },
  gridCheckButton: {
    margin: 0,
    padding: 0,
  },
});

export default TasksScreen;