import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform
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
  Card,
  Dialog
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
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import PomodoroTimer from '../components/PomodoroTimer';
import TaskDetail from '../components/TaskDetail';

type TasksScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

const TasksScreen = () => {
  const navigation = useNavigation<TasksScreenNavigationProp>();
  const theme = useTheme();
  const isDark = (theme as any).dark;
  const { colors } = theme;
  const { 
    tasks, 
    isLoading, 
    fetchTasks, 
    addTask, 
    updateTask, 
    deleteTask,
    toggleTaskCompletion,
    toggleSubtask
  } = useTaskStore();
  
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<{
    status?: string[];
    priority?: string[];
    dueDateRange?: { start?: Date, end?: Date };
    tags?: string[];
  }>({
    status: [],
    priority: [],
    dueDateRange: {},
    tags: []
  });
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'createdAt'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showForm, setShowForm] = useState(false);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [pomodoroTaskId, setPomodoroTaskId] = useState<string | undefined>(undefined);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showDateFilterDialog, setShowDateFilterDialog] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);

  // Fetch tasks when component mounts (consolidated from multiple hooks)
  useEffect(() => {
    const loadTasks = async () => {
      try {
        console.log('Loading tasks on component mount (single useEffect)...');
        
        // Reset all filters
        setFilter({
          status: [],
          priority: [],
          dueDateRange: {},
          tags: []
        });
        setSearchQuery('');
        
        // Make sure we're in list view for better visibility
        setViewMode('list');
        
        // Fetch all tasks without any filtering
        await fetchTasks();
        
        console.log(`Total number of tasks in database: ${tasks.length}`);
        tasks.forEach((task, index) => {
          console.log(`Task ${index + 1}: ID=${task.id}, Title=${task.title}, Completed=${task.completed}`);
        });
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    };
    
    loadTasks();
    // Empty dependency array means this only runs once on component mount
  }, []);
  
  // Debug effect for filter menu
  useEffect(() => {
    console.log('Filter menu state updated:', showFilterMenu);
  }, [showFilterMenu]);
  
  // Navigate to task details
  const handleTaskPress = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setShowTaskDetail(true);
    }
  };
  
  // Start pomodoro timer
  const handleStartPomodoro = (taskId: string) => {
    setPomodoroTaskId(taskId);
    setShowPomodoro(true);
  };

  // Toggle task completion
  const handleToggleCompletion = async (taskId: string) => {
    console.log('TasksScreen - handleToggleCompletion called with taskId:', taskId);
    try {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        console.log('Found task:', task.id, task.title, 'Current completed status:', task.completed);
        // Update task with new completed status
        const updatedTask = {
          ...task,
          completed: !task.completed
        };
        await updateTask(updatedTask);
        console.log('Task completion toggled successfully');
        
        // Refresh tasks to update UI
        await fetchTasks();
      } else {
        console.error('Task not found with ID:', taskId);
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };
  
  // Create a new task
  const handleCreateTask = async (taskData: Partial<Task>) => {
    try {
      console.log('Creating new task with data:', taskData);
      
      // Ensure required fields are present
      const newTaskData = {
        ...taskData,
        title: taskData.title || 'Untitled Task',
        priority: taskData.priority || 'medium',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('Creating task with complete data:', newTaskData);
      const newTask = await addTask(newTaskData);
      
      if (!newTask) {
        throw new Error('Failed to create task');
      }
      
      console.log('New task created successfully:', newTask.id);
      
      // Close the form if it's open
      setShowForm(false);
      
      // Log the current task count
      console.log(`Current task count after creation: ${tasks.length + 1}`);
      
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  // Toggle filter selection
  const toggleFilter = (type: 'status' | 'priority', value: string) => {
    setFilter(prev => {
      const current = [...(prev[type] || [])];
      const index = current.indexOf(value);
      
      if (index >= 0) {
        current.splice(index, 1);
      } else {
        current.push(value);
      }
      
      return {
        ...prev,
        [type]: current
      };
    });
  };

  // Check if a filter is active
  const isFilterActive = (type: 'status' | 'priority', value: string) => {
    return filter[type]?.includes(value) || false;
  };

  // Reset all filters
  const resetFilters = () => {
    setFilter({
      status: [],
      priority: [],
      dueDateRange: {},
      tags: []
    });
    setSearchQuery('');
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };
  
  // Apply filter, search, and sorting
  const getFilteredTasks = useMemo(() => {
    console.log(`Starting filtering with ${tasks.length} total tasks`);
    let result = [...tasks];
    
    // Log the initial tasks
    console.log(`Initial task count: ${result.length}`);
    
    // Don't filter out null IDs, but generate temporary ones
    const beforeNullFilter = result.length;
    result = result.filter(task => task !== null && task !== undefined);
    
    // Assign temporary IDs to tasks with null IDs
    result.forEach((task, index) => {
      if (!task.id) {
        console.log(`Assigning temporary ID to task: ${task.title}`);
        task.id = `temp-${Date.now()}-${index}`;
      }
    });
    
    console.log(`After null check: ${result.length} tasks (removed ${beforeNullFilter - result.length})`);
    
    // Apply text search if any
    if (searchQuery.trim()) {
      const beforeSearch = result.length;
      const searchTerm = searchQuery.toLowerCase();
      
      // First log which tasks match the search query
      console.log(`Searching for: "${searchTerm}"`);
      result.forEach(task => {
        const titleMatch = task.title.toLowerCase().includes(searchTerm);
        const descMatch = task.description && task.description.toLowerCase().includes(searchTerm);
        console.log(`Task ${task.id}: "${task.title}" - Title match: ${titleMatch}, Desc match: ${descMatch}`);
      });
      
      // Then perform the filtering
      result = result.filter(task => 
        task.title.toLowerCase().includes(searchTerm) ||
        (task.description && task.description.toLowerCase().includes(searchTerm))
      );
      console.log(`After search filter: ${result.length} tasks (removed ${beforeSearch - result.length})`);
    }
    
    // Apply category filter if selected
    if (filter.status && filter.status.length > 0) {
      const beforeStatus = result.length;
      result = result.filter(task => {
        if (filter.status?.includes('completed')) {
          if (task.completed) return true;
        }
        if (filter.status?.includes('pending')) {
          if (!task.completed) return true;
        }
        return false;
      });
      console.log(`After status filter: ${result.length} tasks (removed ${beforeStatus - result.length})`);
    }
    
    // Apply priority filters
    if (filter.priority && filter.priority.length > 0) {
      const beforePriority = result.length;
      result = result.filter(task => 
        filter.priority?.includes(task.priority || 'medium')
      );
      console.log(`After priority filter: ${result.length} tasks (removed ${beforePriority - result.length})`);
    }
    
    // Apply date range filter
    if (filter.dueDateRange?.start || filter.dueDateRange?.end) {
      const beforeDate = result.length;
      result = result.filter(task => {
        if (!task.dueDate) return false;
        
        const taskDate = new Date(task.dueDate);
        const startOk = filter.dueDateRange?.start 
          ? taskDate >= new Date(filter.dueDateRange.start) 
          : true;
        const endOk = filter.dueDateRange?.end 
          ? taskDate <= new Date(filter.dueDateRange.end) 
          : true;
        
        return startOk && endOk;
      });
      console.log(`After date range filter: ${result.length} tasks (removed ${beforeDate - result.length})`);
    }
    
    // Apply tag filters if available
    if (filter.tags && filter.tags.length > 0) {
      const beforeTags = result.length;
      result = result.filter(task => {
        // Safe check for tags property which might not exist on Task type
        const taskTags = (task as any).tags;
        return taskTags && Array.isArray(taskTags) && 
          taskTags.some((tag: string) => filter.tags?.includes(tag));
      });
      console.log(`After tag filter: ${result.length} tasks (removed ${beforeTags - result.length})`);
    }
    
    // Apply sorting
    const beforeSort = result.length;
    result.sort((a, b) => {
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
    console.log(`After sorting: ${result.length} tasks (should be same as before)`);
    
    console.log(`Final filtered task count: ${result.length}`);
    return result;
  }, [tasks, sortBy, sortOrder, filter, searchQuery]);

  // Count active filters
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filter.status?.length) count += filter.status.length;
    if (filter.priority?.length) count += filter.priority.length;
    if (filter.dueDateRange?.start || filter.dueDateRange?.end) count++;
    if (filter.tags?.length) count += filter.tags.length;
    return count;
  };

  // Add delete handler with confirmation
  const handleDeleteTask = async (taskId: string) => {
    setTaskToDelete(taskId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    
    try {
      console.log('Deleting task:', taskToDelete);
      await deleteTask(taskToDelete);
      console.log('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setShowDeleteDialog(false);
      setTaskToDelete(null);
    }
  };

  // Render the appropriate task view based on viewMode
  const renderTaskView = () => {
    if (getFilteredTasks.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
            No tasks found
          </Text>
        </View>
      );
    }

    switch (viewMode) {
      case 'grid':
        return (
          <TaskGridView
            tasks={getFilteredTasks}
            onTaskPress={handleTaskPress}
            onToggleCompletion={handleToggleCompletion}
            onDelete={handleDeleteTask}
            onStartPomodoro={handleStartPomodoro}
          />
        );
      case 'timeline':
        return (
          <TimelineView
            tasks={getFilteredTasks}
            onTaskPress={handleTaskPress}
            onToggleCompletion={handleToggleCompletion}
            onStartPomodoro={handleStartPomodoro}
          />
        );
      default:
        return (
          <TaskList
            tasks={getFilteredTasks}
            onTaskPress={handleTaskPress}
            onToggle={handleToggleCompletion}
            onDelete={handleDeleteTask}
            onStartPomodoro={handleStartPomodoro}
          />
        );
    }
  };

  // Render active filter chips
  const renderFilterChips = () => {
    if (getActiveFiltersCount() === 0) return null;
    
    return (
      <View style={styles.filterChipsContainer}>
        <View style={styles.chipScrollContainer}>
          {filter.status?.map((status) => (
            <Chip 
              key={`status-${status}`}
              style={styles.filterChip} 
              onClose={() => toggleFilter('status', status)}
              icon={status === 'completed' ? 'check-circle' : 'clock-outline'}
            >
              {status === 'completed' ? 'Completed' : 'Pending'}
            </Chip>
          ))}
          
          {filter.priority?.map((priority) => (
            <Chip 
              key={`priority-${priority}`}
              style={styles.filterChip} 
              onClose={() => toggleFilter('priority', priority)}
              icon={priority === 'high' ? 'arrow-up' : priority === 'medium' ? 'minus' : 'arrow-down'}
            >
              {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
            </Chip>
          ))}
          
          {(filter.dueDateRange?.start || filter.dueDateRange?.end) && (
            <Chip 
              key="date-range"
              style={styles.filterChip} 
              onClose={() => setFilter(prev => ({ ...prev, dueDateRange: {} }))}
              icon="calendar-range"
            >
              Date Filter
            </Chip>
          )}
          
          {filter.tags?.map((tag) => (
            <Chip 
              key={`tag-${tag}`}
              style={styles.filterChip} 
              onClose={() => setFilter(prev => ({ 
                ...prev, 
                tags: prev.tags?.filter(t => t !== tag) 
              }))}
              icon="tag"
            >
              {tag}
            </Chip>
          ))}

          <Chip 
            key="reset"
            style={styles.filterChip} 
            onPress={resetFilters}
            icon="filter-remove"
          >
            Reset All
          </Chip>
        </View>
      </View>
    );
  };

  // Format date for display
  const formatDate = (date: Date | null | undefined): string => {
    if (!date) return 'Select Date';
    return date.toLocaleDateString();
  };

  // Add a function to force-fetch all tasks (meant to be called manually, not in useEffect)
  const forceDisplayAllTasks = async () => {
    try {
      console.log('Force displaying all tasks (manual refresh)...');
      
      // Reset all filters
      setFilter({
        status: [],
        priority: [],
        dueDateRange: {},
        tags: []
      });
      setSearchQuery('');
      
      // Make sure we're in list view for better visibility
      setViewMode('list');
      
      // Call fetchTasks without any filters
      await fetchTasks();
      
      // Log the tasks we have
      console.log(`Database has ${tasks.length} tasks total`);
      console.log(`Filtered tasks count: ${getFilteredTasks.length}`);
      console.log(`Difference: ${tasks.length - getFilteredTasks.length} tasks are being filtered out`);
      
      // Log the search query to ensure it's empty
      console.log(`Current search query: "${searchQuery}"`);
      
      // Debug specific filter conditions
      console.log('Current filters:', JSON.stringify(filter));
    } catch (error) {
      console.error('Error displaying all tasks:', error);
    }
  };
  
  // Call the function when component mounts
  useEffect(() => {
    forceDisplayAllTasks();
  }, []);

  // Add a function to debug task filtering
  const debugTaskFiltering = () => {
    console.log('=== DEBUG TASK FILTERING ===');
    
    // Check if the number of tasks matches expected
    console.log(`Database has ${tasks.length} total tasks`);
    console.log(`${getFilteredTasks.length} tasks after filtering`);
    
    // Log search query
    console.log(`Current search query: "${searchQuery}"`);
    
    // Check if any filters are active
    console.log('Current filters:', filter);
    
    // Get the IDs of all tasks in the database
    const allTaskIds = tasks.map(t => t.id);
    
    // Get the IDs of all filtered tasks
    const filteredTaskIds = getFilteredTasks.map(t => t.id);
    
    // Find which tasks are missing from filtered tasks
    const missingTaskIds = allTaskIds.filter(id => !filteredTaskIds.includes(id));
    console.log(`Missing task IDs: ${missingTaskIds.join(', ')}`);
    
    // Log details about missing tasks to identify patterns
    missingTaskIds.forEach(id => {
      const task = tasks.find(t => t.id === id);
      console.log(`Missing task: ID=${id}, Title=${task?.title}, Priority=${task?.priority}, Completed=${task?.completed}`);
      
      // Check for null or undefined properties
      const taskAny = task as any;
      if (!task?.id) console.log(`- Missing ID`);
      if (!task?.title) console.log(`- Missing title`);
      if (taskAny.tags && taskAny.tags.length === 0) console.log(`- Empty tags array`);
    });
    
    console.log('=== END DEBUG ===');
  };
  
  // Add a button to trigger the debug function
  useEffect(() => {
    // Call debug function after a short delay to ensure all state is updated
    const debugTimer = setTimeout(debugTaskFiltering, 500);
    return () => clearTimeout(debugTimer);
  }, [tasks, getFilteredTasks.length]);

  // Add task detail handlers
  const handleTaskUpdate = (updatedTask: Task) => {
    updateTask(updatedTask);
    setSelectedTask(updatedTask);
  };

  const handleTaskDelete = async (taskId: string) => {
    await deleteTask(taskId);
    setShowTaskDetail(false);
    setSelectedTask(null);
  };

  const handleToggleTaskCompletion = async (taskId: string) => {
    await toggleTaskCompletion(taskId);
    if (selectedTask) {
      setSelectedTask({ ...selectedTask, completed: !selectedTask.completed });
    }
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    await toggleSubtask(taskId, subtaskId);
    if (selectedTask && selectedTask.subtasks) {
      const updatedSubtasks = selectedTask.subtasks.map(subtask => 
        subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
      );
      setSelectedTask({ ...selectedTask, subtasks: updatedSubtasks });
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
            <IconButton
              icon={sortOrder === 'asc' ? 'sort-ascending' : 'sort-descending'}
              size={24}
              onPress={toggleSortOrder}
            />
            
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
            
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => {
                console.log('Filter button pressed');
                setShowFilterMenu(!showFilterMenu);
              }}
            >
              <View style={styles.filterButtonContent}>
                <MaterialCommunityIcons name="filter-variant" size={24} color={colors.primary} />
                {getActiveFiltersCount() > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            
            <IconButton
              icon="refresh"
              size={24}
              onPress={forceDisplayAllTasks}
            />
            
            <IconButton
              icon="bug"
              size={24}
              onPress={async () => {
                try {
                  console.log("Debug task creation test - Starting");
                  const testTask = {
                    title: "Debug Test Task " + new Date().toLocaleTimeString(),
                    description: "Created for debugging",
                    priority: "medium" as const,
                    completed: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  };
                  
                  console.log("Creating test task:", testTask);
                  await handleCreateTask(testTask);
                  
                  console.log("Debug task creation test - Completed");
                } catch (error) {
                  console.error("Error in debug task creation:", error);
                }
              }}
            />
            
            <View style={{
              backgroundColor: tasks.length !== getFilteredTasks.length ? 'red' : 'green',
              padding: 8,
              borderRadius: 4,
              marginLeft: 8
            }}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>
                {getFilteredTasks.length}/{tasks.length}
              </Text>
            </View>
            
            <Menu
              visible={showFilterMenu}
              onDismiss={() => {
                console.log('Dismissing filter menu');
                setShowFilterMenu(false);
              }}
              anchor={<View style={{ width: 1, height: 1 }} />}
              style={styles.filterMenu}
            >
              <Menu.Item 
                onPress={() => toggleFilter('status', 'pending')}
                title="Pending Tasks"
                leadingIcon="clock-outline"
                trailingIcon={isFilterActive('status', 'pending') ? 'check' : undefined}
              />
              <Menu.Item 
                onPress={() => toggleFilter('status', 'completed')}
                title="Completed Tasks"
                leadingIcon="check-circle"
                trailingIcon={isFilterActive('status', 'completed') ? 'check' : undefined}
              />
              <Divider />
              <Menu.Item 
                onPress={() => toggleFilter('priority', 'high')}
                title="High Priority"
                leadingIcon="arrow-up"
                trailingIcon={isFilterActive('priority', 'high') ? 'check' : undefined}
              />
              <Menu.Item 
                onPress={() => toggleFilter('priority', 'medium')}
                title="Medium Priority"
                leadingIcon="minus"
                trailingIcon={isFilterActive('priority', 'medium') ? 'check' : undefined}
              />
              <Menu.Item 
                onPress={() => toggleFilter('priority', 'low')}
                title="Low Priority"
                leadingIcon="arrow-down"
                trailingIcon={isFilterActive('priority', 'low') ? 'check' : undefined}
              />
              <Divider />
              <Menu.Item 
                onPress={() => {
                  setShowFilterMenu(false);
                  setShowDateFilterDialog(true);
                }}
                title="Date Range"
                leadingIcon="calendar-range"
                trailingIcon={(filter.dueDateRange?.start || filter.dueDateRange?.end) ? 'check' : undefined}
              />
              <Divider />
              <Menu.Item 
                onPress={() => {
                  resetFilters();
                  setShowFilterMenu(false);
                }}
                title="Reset All Filters"
                leadingIcon="filter-remove"
              />
            </Menu>
          </View>
        </View>

        {renderFilterChips()}
        {renderTaskView()}
      </View>

      <Portal>
        <Modal
          visible={showForm}
          onDismiss={() => setShowForm(false)}
          contentContainerStyle={styles.modalContent}
        >
          <TaskForm
            isVisible={showForm}
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
            initialTaskId={pomodoroTaskId}
            onMinimize={() => setShowPomodoro(false)}
          />
        </Modal>

        <Dialog visible={showDateFilterDialog} onDismiss={() => setShowDateFilterDialog(false)}>
          <Dialog.Title>Filter by Date Range</Dialog.Title>
          <Dialog.Content>
            <View style={{gap: 16}}>
              <View style={styles.datePickerRow}>
                <Text>Start Date: </Text>
                <Button 
                  mode="outlined" 
                  onPress={() => setShowStartDatePicker(true)}
                  style={styles.dateButton}
                >
                  {formatDate(filter.dueDateRange?.start)}
                </Button>
                {showStartDatePicker && (
                  <DateTimePicker
                    value={filter.dueDateRange?.start || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowStartDatePicker(false);
                      if (selectedDate) {
                        setFilter(prev => ({
                          ...prev,
                          dueDateRange: {
                            ...prev.dueDateRange,
                            start: selectedDate
                          }
                        }));
                      }
                    }}
                  />
                )}
              </View>
              
              <View style={styles.datePickerRow}>
                <Text>End Date: </Text>
                <Button 
                  mode="outlined" 
                  onPress={() => setShowEndDatePicker(true)}
                  style={styles.dateButton}
                >
                  {formatDate(filter.dueDateRange?.end)}
                </Button>
                {showEndDatePicker && (
                  <DateTimePicker
                    value={filter.dueDateRange?.end || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowEndDatePicker(false);
                      if (selectedDate) {
                        setFilter(prev => ({
                          ...prev,
                          dueDateRange: {
                            ...prev.dueDateRange,
                            end: selectedDate
                          }
                        }));
                      }
                    }}
                  />
                )}
              </View>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setFilter(prev => ({...prev, dueDateRange: {}}))} style={{marginRight: 8}}>Clear</Button>
            <Button onPress={() => setShowDateFilterDialog(false)}>Cancel</Button>
            <Button onPress={() => setShowDateFilterDialog(false)} mode="contained">Apply</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Task</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this task? This action cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onPress={confirmDeleteTask} mode="contained" buttonColor={colors.error}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Task Detail Modal */}
        <Modal
          visible={showTaskDetail && selectedTask !== null}
          onDismiss={() => setShowTaskDetail(false)}
          contentContainerStyle={styles.modalContent}
        >
          {selectedTask && (
            <TaskDetail
              task={selectedTask}
              onEdit={() => {
                setShowTaskDetail(false);
                navigation.navigate('EditTask', { taskId: selectedTask.id });
              }}
              onDelete={handleTaskDelete}
              onToggleCompletion={handleToggleTaskCompletion}
              onToggleSubtask={handleToggleSubtask}
              onUpdate={handleTaskUpdate}
              onBack={() => setShowTaskDetail(false)}
            />
          )}
        </Modal>
      </Portal>
      
      {/* Direct Pomodoro Timer */}
      {showPomodoro && (
        <View style={styles.pomodoroContainer}>
          <PomodoroTimer
            initialTaskId={pomodoroTaskId}
            onClose={() => setShowPomodoro(false)}
            showCloseButton={true}
          />
        </View>
      )}
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
    marginBottom: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    padding: 8,
    marginLeft: 4,
  },
  filterButtonContent: {
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterMenu: {
    marginTop: 50,
    marginRight: 10,
  },
  filterChipsContainer: {
    marginBottom: 12,
  },
  chipScrollContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
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
    flex: 1,
    margin: 0,
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateButton: {
    flex: 1,
    marginLeft: 8,
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
  pomodoroContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  }
});

export default TasksScreen;