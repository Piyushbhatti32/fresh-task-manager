import { create } from 'zustand';
import { Task, TaskFilter } from '../types/Task';
import taskRepository from '../database/TaskRepository';
import databaseService from '../database/DatabaseService';

// Define PomodoroSettings type
type PomodoroSettings = {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  autoStartNextSession: boolean;
  autoStartBreaks: boolean;
};

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  
  // Pomodoro features
  currentPomodoro: {
    active: boolean;
    isBreak: boolean;
    timeRemaining: number;
    sessionId: string | null;
    currentSessionCount: number;
  };
  pomodoroSettings: PomodoroSettings;
  
  // Actions
  fetchTasks: (filter?: TaskFilter) => Promise<void>;
  getTaskById: (id: string) => Task | undefined;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (task: Task) => Promise<Task | undefined>;
  deleteTask: (id: string) => Promise<void>;
  
  // Task status actions
  markTaskAsCompleted: (id: string) => Promise<boolean>;
  markTaskAsInProgress: (id: string) => Promise<boolean>;
  
  // Subtask actions
  addSubtask: (taskId: string, title: string) => Promise<Task | null>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<Task | null>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<Task | null>;
  
  // Pomodoro actions
  startPomodoro: (taskId: string) => void;
  pausePomodoro: () => void;
  resumePomodoro: () => void;
  stopPomodoro: (logTime: boolean, reason: string) => void;
  completePomodoro: () => void;
  skipBreak: () => void;
  updatePomodoroSettings: (settings: PomodoroSettings) => void;
  
  // Add function to create default tasks
  createDefaultTasks: () => Promise<void>;
}

// Mock data for now
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Complete React Native project',
    description: 'Finish implementing all screens and components',
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
    completed: false,
    priority: 'high',
    categoryId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Research SQLite integration',
    description: 'Learn how to use SQLite effectively with React Native',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
    completed: false,
    priority: 'medium',
    categoryId: '2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Grocery shopping',
    description: 'Buy milk, eggs, bread, and vegetables',
    dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    completed: true,
    priority: 'low',
    categoryId: '3',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  
  // Initialize Pomodoro state
  currentPomodoro: {
    active: false,
    isBreak: false,
    timeRemaining: 25 * 60, // 25 minutes in seconds
    sessionId: null,
    currentSessionCount: 0
  },
  
  pomodoroSettings: {
    workDuration: 25, // minutes
    shortBreakDuration: 5, // minutes
    longBreakDuration: 15, // minutes
    sessionsUntilLongBreak: 4,
    autoStartNextSession: false,
    autoStartBreaks: true
  },
  
  // Add function to create default tasks
  createDefaultTasks: async () => {
    try {
      const defaultTasks = [
        {
          title: 'Complete React Native project',
          description: 'Finish implementing all screens and components',
          dueDate: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
          completed: false,
          priority: 'high',
          categoryId: '1',
          progress: 0,
          subtasks: [],
          tags: ['work', 'development']
        },
        {
          title: 'Research SQLite integration',
          description: 'Learn how to use SQLite effectively with React Native',
          dueDate: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
          completed: false,
          priority: 'medium',
          categoryId: '2',
          progress: 0,
          subtasks: [],
          tags: ['research', 'development']
        },
        {
          title: 'Grocery shopping',
          description: 'Buy milk, eggs, bread, and vegetables',
          dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          completed: false,
          priority: 'low',
          categoryId: '3',
          progress: 0,
          subtasks: [],
          tags: ['personal', 'shopping']
        },
        {
          title: 'Team meeting',
          description: 'Weekly sync with the development team',
          dueDate: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          completed: false,
          priority: 'high',
          categoryId: '1',
          progress: 0,
          subtasks: [],
          tags: ['work', 'meeting']
        },
        {
          title: 'Exercise',
          description: '30 minutes of cardio and strength training',
          dueDate: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
          completed: false,
          priority: 'medium',
          categoryId: '3',
          progress: 0,
          subtasks: [],
          tags: ['personal', 'health']
        }
      ];

      for (const task of defaultTasks) {
        await get().addTask(task);
      }

      // Fetch all tasks after creating defaults
      await get().fetchTasks();
    } catch (error) {
      console.error('Error creating default tasks:', error);
    }
  },
  
  fetchTasks: async (filter?: TaskFilter) => {
    set({ isLoading: true, error: null });
    try {
      // Initialize database if it hasn't been initialized yet
      await databaseService.initDatabase();
      
      // Check if we need to create default tasks
      const existingTasks = await taskRepository.getTasks();
      if (existingTasks.length === 0) {
        await get().createDefaultTasks();
      }
      
      // Fetch from database
      const tasks = await taskRepository.getTasks({
        completed: filter?.completed,
        category: filter?.category,
        priority: filter?.priority
      });
      
      // Apply client-side filters if provided
      let filteredTasks = [...tasks];
      
      if (filter) {
        // Apply filters
        if ('searchText' in filter && filter.searchText) {
          const searchLower = (filter.searchText as string).toLowerCase();
          filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(searchLower) ||
            (task.description && task.description.toLowerCase().includes(searchLower))
          );
        }
        
        // Date filtering
        if ('startDate' in filter && filter.startDate) {
          const startDate = new Date(filter.startDate as string | number | Date);
          filteredTasks = filteredTasks.filter(task => {
            if (!task.dueDate) return false;
            return new Date(task.dueDate) >= startDate;
          });
        }
        
        if ('endDate' in filter && filter.endDate) {
          const endDate = new Date(filter.endDate as string | number | Date);
          filteredTasks = filteredTasks.filter(task => {
            if (!task.dueDate) return false;
            return new Date(task.dueDate) <= endDate;
          });
        }
      }
      
      console.log('Fetched tasks:', filteredTasks);
      set({ tasks: filteredTasks, isLoading: false });
    } catch (error) {
      console.error('Error loading tasks:', error);
      set({ error: (error as Error).message || 'Unknown error', isLoading: false });
    }
  },
  
  getTaskById: (id: string) => {
    return get().tasks.find(task => task.id === id);
  },
  
  addTask: async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      set({ isLoading: true, error: null });
      
      // Validate task data
      if (!task.title || task.title.trim() === '') {
        throw new Error('Task title is required');
      }

      // Create task in database
      const taskId = await databaseService.createTask({
        ...task,
        title: task.title.trim(),
        description: task.description?.trim() || '',
        priority: task.priority || 'low',
        completed: task.completed || false,
        categoryId: task.categoryId || 'personal',
        dueDate: task.dueDate || new Date().toISOString(),
        dueTime: task.dueTime || null,
        progress: task.progress || 0,
        recurrence: task.recurrence || null,
        reminder: task.reminder || null,
        subtasks: task.subtasks || [],
        tags: task.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Fetch updated task list
      await get().fetchTasks();

      return get().getTaskById(taskId);
    } catch (error) {
      console.error('Error adding task:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to add task' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  updateTask: async (task: Task) => {
    set({ isLoading: true });
    try {
      // Mock update for now - in real app would call API
      // Temporarily bypass type error by using any
      const taskId = task.id; // Store id separately to avoid TS errors
      const updatedTask = await (taskRepository.updateTask as any)(taskId, task);
      
      if (updatedTask) {
        set(state => ({
          tasks: state.tasks.map(t => 
            t.id === task.id ? (updatedTask as unknown as Task) : t
          ),
          isLoading: false
        }));
      }
      
      return updatedTask as unknown as Task | undefined;
    } catch (error) {
      set({ error: (error as Error).message || 'Unknown error', isLoading: false });
      throw error;
    }
  },
  
  deleteTask: async (id: string) => {
    set({ isLoading: true });
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message || 'Unknown error', isLoading: false });
      throw error;
    }
  },
  
  markTaskAsCompleted: async (id: string) => {
    try {
      const task = get().tasks.find(t => t.id === id);
      if (!task) return false;
      
      const updatedTask = { ...task, completed: true };
      await get().updateTask(updatedTask);
      return true;
    } catch (error) {
      return false;
    }
  },
  
  markTaskAsInProgress: async (id: string) => {
    try {
      const task = get().tasks.find(t => t.id === id);
      if (!task) return false;
      
      const updatedTask = { ...task, completed: false };
      await get().updateTask(updatedTask);
      return true;
    } catch (error) {
      return false;
    }
  },
  
  startPomodoro: (taskId) => {
    set(state => ({
      currentPomodoro: {
        ...state.currentPomodoro,
        active: true,
        isBreak: false,
        sessionId: taskId,
        timeRemaining: state.pomodoroSettings.workDuration * 60
      }
    }));
  },
  
  pausePomodoro: () => {
    set(state => ({
      currentPomodoro: {
        ...state.currentPomodoro,
        active: false
      }
    }));
  },
  
  resumePomodoro: () => {
    set(state => ({
      currentPomodoro: {
        ...state.currentPomodoro,
        active: true
      }
    }));
  },
  
  stopPomodoro: (logTime, reason) => {
    set(state => ({
      currentPomodoro: {
        active: false,
        isBreak: false,
        timeRemaining: state.pomodoroSettings.workDuration * 60,
        sessionId: null,
        currentSessionCount: 0
      }
    }));
  },
  
  completePomodoro: () => {
    const state = get();
    const taskId = state.currentPomodoro.sessionId;
    
    // Start break
    set(state => ({
      currentPomodoro: {
        ...state.currentPomodoro,
        isBreak: true,
        active: true,
        timeRemaining: state.currentPomodoro.currentSessionCount >= state.pomodoroSettings.sessionsUntilLongBreak - 1
          ? state.pomodoroSettings.longBreakDuration * 60
          : state.pomodoroSettings.shortBreakDuration * 60,
        currentSessionCount: (state.currentPomodoro.currentSessionCount + 1) % state.pomodoroSettings.sessionsUntilLongBreak
      }
    }));
  },
  
  skipBreak: () => {
    set(state => ({
      currentPomodoro: {
        ...state.currentPomodoro,
        isBreak: false,
        active: false,
        timeRemaining: state.pomodoroSettings.workDuration * 60
      }
    }));
  },
  
  updatePomodoroSettings: (settings) => {
    set({ pomodoroSettings: settings });
  },
  
  // Add subtask to a task
  addSubtask: async (taskId, title) => {
    try {
      const { tasks } = get();
      const task = tasks.find(t => t.id === taskId);
      
      if (!task) return null;
      
      const newSubtask = {
        id: Math.random().toString(),
        title,
        completed: false,
        createdAt: new Date()
      };
      
      const updatedTask = {
        ...task,
        subtasks: [...(task.subtasks || []), newSubtask],
        updatedAt: new Date().toISOString()
      };
      
      set({
        tasks: tasks.map(t => t.id === taskId ? updatedTask : t)
      });
      
      return updatedTask;
    } catch (error) {
      console.error('Error adding subtask:', error);
      return null;
    }
  },
  
  // Toggle subtask completion status
  toggleSubtask: async (taskId, subtaskId) => {
    try {
      const { tasks } = get();
      const task = tasks.find(t => t.id === taskId);
      
      if (!task || !task.subtasks) return null;
      
      const updatedTask = {
        ...task,
        subtasks: task.subtasks.map(st => 
          st.id === subtaskId 
            ? { ...st, completed: !st.completed, updatedAt: new Date() }
            : st
        ),
        updatedAt: new Date().toISOString()
      };
      
      set({
        tasks: tasks.map(t => t.id === taskId ? updatedTask : t)
      });
      
      return updatedTask;
    } catch (error) {
      console.error('Error toggling subtask:', error);
      return null;
    }
  },
  
  // Delete a subtask
  deleteSubtask: async (taskId, subtaskId) => {
    try {
      const { tasks } = get();
      const task = tasks.find(t => t.id === taskId);
      
      if (!task || !task.subtasks) return null;
      
      const updatedTask = {
        ...task,
        subtasks: task.subtasks.filter(st => st.id !== subtaskId),
        updatedAt: new Date().toISOString()
      };
      
      set({
        tasks: tasks.map(t => t.id === taskId ? updatedTask : t)
      });
      
      return updatedTask;
    } catch (error) {
      console.error('Error deleting subtask:', error);
      return null;
    }
  }
})); 