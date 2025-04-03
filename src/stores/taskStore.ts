import { create } from 'zustand';
import { Task, TaskFilter, TaskTemplate, SubTask, Priority } from '../types/Task';
import databaseService from '../database/DatabaseService';
import taskRepository from '../database/TaskRepository';

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
  templates: TaskTemplate[];
  isInitialized: boolean;
  
  // Add initialize method
  initialize: () => Promise<void>;
  
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
  toggleTaskCompletion: (id: string) => Promise<boolean>;
  
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
  
  // Template actions
  fetchTemplates: () => Promise<void>;
  addTemplate: (template: Omit<TaskTemplate, 'id' | 'createdAt'>) => Promise<TaskTemplate>;
  updateTemplate: (id: string, template: Partial<TaskTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  createTaskFromTemplate: (template: TaskTemplate) => Promise<Task>;
  
  // Categories
  categories: string[];
  getCategories: () => string[];
  
  // Default tasks
  createDefaultTasks: () => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  templates: [],
  categories: [],
  isInitialized: false,
  
  // Pomodoro state
  currentPomodoro: {
    active: false,
    isBreak: false,
    timeRemaining: 0,
    sessionId: null,
    currentSessionCount: 0
  },
  pomodoroSettings: {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    autoStartNextSession: false,
    autoStartBreaks: false
  },

  // Task actions
  fetchTasks: async (filter?: TaskFilter) => {
    try {
      set({ isLoading: true });
      
      // Convert TaskFilter to repository filter format
      const repoFilter = {
        completed: filter?.status === 'completed' ? true : 
                  filter?.status === 'pending' ? false : undefined,
        priority: filter?.priority === 'all' ? undefined : 
                 filter?.priority as Priority | undefined,
        category: filter?.category === 'all' ? undefined : 
                 filter?.category
      };
      
      const tasks = await taskRepository.getTasks(repoFilter);
      console.log(`TaskStore - Fetched ${tasks.length} tasks from the database`);
      
      // Fix any tasks with null IDs
      const fixedTasks = tasks.map(task => {
        if (!task.id) {
          const newId = `fixed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          console.log(`Fixing task with null ID: "${task.title}" -> new ID: ${newId}`);
          return { ...task, id: newId };
        }
        return task;
      });
      
      set({ tasks: fixedTasks, isLoading: false });
    } catch (error) {
      console.error('TaskStore - Error fetching tasks:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch tasks', isLoading: false });
    }
  },

  getTaskById: (id: string) => {
    return get().tasks.find(task => task.id === id);
  },

  addTask: async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Ensure task has required fields
      if (!task.title) {
        console.error('Cannot create task without a title');
        throw new Error('Task title is required');
      }
      
      // Set loading state
      set({ isLoading: true });
      
      const taskId = await taskRepository.createTask(task);
      
      // Validate that we got a valid ID back
      if (!taskId) {
        console.error('Failed to get valid ID from repository when creating task:', task.title);
        throw new Error('Failed to generate task ID');
      }
      
      const newTask: Task = {
        ...task,
        id: taskId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log(`Created new task with ID: ${newTask.id}, Title: ${newTask.title}`);
      
      // Update state with the new task
      set(state => ({ 
        tasks: [...state.tasks, newTask],
        isLoading: false 
      }));
      
      return newTask;
    } catch (error) {
      set({ isLoading: false });
      console.error('Error creating task:', error);
      throw error;
    }
  },

  updateTask: async (task) => {
    try {
      const success = await taskRepository.updateTask(task.id, task);
      if (success) {
        set(state => ({
          tasks: state.tasks.map(t => t.id === task.id ? task : t)
        }));
        return task;
      }
      return undefined;
    } catch (error) {
      throw error;
    }
  },

  deleteTask: async (id: string) => {
    try {
      const success = await taskRepository.deleteTask(id);
      if (success) {
        set(state => ({
          tasks: state.tasks.filter(t => t.id !== id)
        }));
      }
    } catch (error) {
      throw error;
    }
  },

  // Task status actions
  markTaskAsCompleted: async (id: string) => {
    try {
      const task = get().getTaskById(id);
      if (task) {
        const updatedTask = await get().updateTask({ ...task, completed: true });
        return !!updatedTask;
      }
      return false;
    } catch (error) {
      return false;
    }
  },

  markTaskAsInProgress: async (id: string) => {
    try {
      const task = get().getTaskById(id);
      if (task) {
        const updatedTask = await get().updateTask({ ...task, completed: false });
        return !!updatedTask;
      }
      return false;
    } catch (error) {
      return false;
    }
  },

  toggleTaskCompletion: async (id: string) => {
    try {
      const task = get().getTaskById(id);
      if (task) {
        const success = await taskRepository.updateTask(id, { completed: !task.completed });
        if (success) {
          set(state => ({
            tasks: state.tasks.map(t => 
              t.id === id ? { ...t, completed: !t.completed } : t
            )
          }));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error toggling task completion:', error);
      return false;
    }
  },

  // Subtask actions
  addSubtask: async (taskId: string, title: string) => {
    try {
      const task = get().getTaskById(taskId);
      if (task) {
        const newSubtask: SubTask = {
          id: Date.now().toString(),
          title,
          completed: false,
          createdAt: new Date()
        };
        const updatedTask = {
          ...task,
          subtasks: [...(task.subtasks || []), newSubtask]
        };
        const result = await get().updateTask(updatedTask);
        return result || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  toggleSubtask: async (taskId: string, subtaskId: string) => {
    try {
      const task = get().getTaskById(taskId);
      if (task && task.subtasks) {
        const updatedSubtasks = task.subtasks.map(subtask =>
          subtask.id === subtaskId
            ? { ...subtask, completed: !subtask.completed }
            : subtask
        );
        const updatedTask = {
          ...task,
          subtasks: updatedSubtasks
        };
        const result = await get().updateTask(updatedTask);
        return result || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  deleteSubtask: async (taskId: string, subtaskId: string) => {
    try {
      const task = get().getTaskById(taskId);
      if (task && task.subtasks) {
        const updatedSubtasks = task.subtasks.filter(
          subtask => subtask.id !== subtaskId
        );
        const updatedTask = {
          ...task,
          subtasks: updatedSubtasks
        };
        const result = await get().updateTask(updatedTask);
        return result || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  // Pomodoro actions
  startPomodoro: (taskId: string) => {
    set(state => ({
      currentPomodoro: {
        ...state.currentPomodoro,
        active: true,
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

  stopPomodoro: (logTime: boolean, reason: string) => {
    set(state => ({
      currentPomodoro: {
        ...state.currentPomodoro,
        active: false,
        sessionId: null,
        timeRemaining: 0
      }
    }));
  },

  completePomodoro: () => {
    set(state => ({
      currentPomodoro: {
        ...state.currentPomodoro,
        active: false,
        sessionId: null,
        timeRemaining: 0,
        currentSessionCount: state.currentPomodoro.currentSessionCount + 1
      }
    }));
  },

  skipBreak: () => {
    set(state => ({
      currentPomodoro: {
        ...state.currentPomodoro,
        isBreak: false,
        timeRemaining: state.pomodoroSettings.workDuration * 60
      }
    }));
  },

  updatePomodoroSettings: (settings: PomodoroSettings) => {
    set({ pomodoroSettings: settings });
  },

  // Template actions
  fetchTemplates: async () => {
    try {
      set({ isLoading: true });
      
      // For now, use mock data if no templates exist
      const mockTemplates: TaskTemplate[] = [
        {
          id: '1',
          name: 'Daily Standup',
          title: 'Daily Team Meeting',
          description: 'Template for daily team standup meetings',
          priority: 'medium',
          subtasks: [
            { title: 'Review yesterday\'s progress' },
            { title: 'Discuss blockers' },
            { title: 'Plan today\'s work' }
          ],
          createdAt: new Date()
        },
        {
          id: '2',
          name: 'Bug Fix Process',
          title: 'Fix Software Bug',
          description: 'Standard process for addressing software bugs',
          priority: 'high',
          subtasks: [
            { title: 'Reproduce the issue' },
            { title: 'Check logs and identify cause' },
            { title: 'Implement fix' },
            { title: 'Write tests' },
            { title: 'Create PR' }
          ],
          createdAt: new Date(Date.now() - 86400000)
        },
        {
          id: '3',
          name: 'Weekly Report',
          title: 'Prepare Weekly Report',
          description: 'Template for preparing weekly status reports',
          priority: 'medium',
          subtasks: [
            { title: 'Gather metrics and data' },
            { title: 'Create summary' },
            { title: 'Add visualizations' },
            { title: 'Review with team' }
          ],
          createdAt: new Date(Date.now() - 172800000)
        }
      ];
      
      // In a real app, would load from database
      set({ templates: mockTemplates, isLoading: false });
    } catch (error) {
      console.error('Error fetching templates:', error);
      set({ isLoading: false, error: error instanceof Error ? error.message : 'Failed to fetch templates' });
    }
  },

  addTemplate: async (template) => {
    try {
      // Create a new template with ID
      const newTemplate: TaskTemplate = {
        ...template,
        id: Date.now().toString(),
        createdAt: new Date()
      };
      
      // Add to store
      set(state => ({ 
        templates: [...state.templates, newTemplate]
      }));
      
      return newTemplate;
    } catch (error) {
      console.error('Error adding template:', error);
      throw error;
    }
  },

  updateTemplate: async (id, updatedTemplate) => {
    try {
      // Update template in store
      set(state => ({
        templates: state.templates.map(template => 
          template.id === id ? { ...template, ...updatedTemplate } : template
        )
      }));
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  },
  
  deleteTemplate: async (id) => {
    try {
      // Delete template from store
      set(state => ({
        templates: state.templates.filter(template => template.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  },
  
  createTaskFromTemplate: async (template) => {
    try {
      const { addTask } = get();
      
      // Create subtasks with required properties
      const subtasks: SubTask[] = (template.subtasks || []).map(subtask => ({
        ...subtask,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        completed: false,
        createdAt: new Date()
      }));
      
      // Create a new task from template
      const newTask = {
        title: template.title,
        description: template.description || '',
        priority: template.priority || 'medium',
        dueDate: template.dueTimeOffset 
          ? new Date(Date.now() + template.dueTimeOffset * 86400000).toISOString() 
          : new Date(Date.now() + 86400000).toISOString(), // Default to tomorrow
        completed: false,
        subtasks,
        categoryId: template.categoryId
      };
      
      // Add task using existing addTask method
      return await addTask(newTask);
    } catch (error) {
      console.error('Error creating task from template:', error);
      throw error;
    }
  },

  // Add initialize implementation before createDefaultTasks
  initialize: async () => {
    if (get().isInitialized) return;
    
    try {
      set({ isLoading: true });
      await get().fetchTasks();
      await get().fetchTemplates();
      if (get().tasks.length === 0) {
        await get().createDefaultTasks();
      }
      set({ isInitialized: true, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to initialize store',
        isLoading: false 
      });
    }
  },
  
  // Categories
  getCategories: () => get().categories,

  // Default tasks
  createDefaultTasks: async () => {
    try {
      const defaultTasks = [
        {
          title: 'Welcome to Task Manager!',
          description: 'This is your first task. Try completing it!',
          priority: 'medium' as Priority,
          completed: false
        },
        {
          title: 'Create a new task',
          description: 'Click the + button to create a new task',
          priority: 'low' as Priority,
          completed: false
        }
      ];

      for (const task of defaultTasks) {
        await get().addTask(task);
      }
    } catch (error) {
      console.error('Error creating default tasks:', error);
    }
  },
}));