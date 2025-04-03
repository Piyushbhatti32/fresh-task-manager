export type Priority = 'high' | 'medium' | 'low';

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'none';

export interface RecurrencePattern {
  type: RecurrenceType;
  interval: number; // every X days/weeks/months/years
  endDate?: Date; // optional end date for recurring tasks
  daysOfWeek?: number[]; // for weekly recurrence (0 = Sunday, 6 = Saturday)
}

export interface ReminderOption {
  value: number; // minutes before due time
  label: string; // display name (e.g., "15 minutes before")
}

export interface Comment {
  id: string;
  text: string;
  createdAt: Date;
  user?: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  color: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PomodoroSession {
  id: string;
  taskId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  completed: boolean;
  interrupted?: boolean;
  notes?: string;
}

export interface PomodoroSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartNextSession: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: Priority;
  completed: boolean;
  categoryId?: string;
  createdAt: string;
  updatedAt: string;
  dueTime?: string; // Format: HH:MM
  attachments?: string[]; // URLs or file paths
  location?: string;
  isMeeting?: boolean;
  comments?: Comment[];
  recurrence?: RecurrencePattern;
  reminder?: number; // minutes before due time
  notificationId?: string; // to track scheduled notifications
  subtasks?: SubTask[]; // array of subtasks
  progress?: number; // percentage of completed subtasks (0-100)
  pomodoroSessions?: PomodoroSession[]; // track pomodoro sessions for this task
  totalPomodoroTime?: number; // total time spent on task in minutes
  completedPomodoros?: number; // number of completed pomodoro sessions
  tags?: string[]; // array of tag names
  notes?: Array<{
    id: string;
    content: string;
    createdAt: string;
  }>; // array of task notes
}

export interface TaskTemplate {
  id: string;
  name: string; // Template name for display purposes
  description?: string;
  createdAt: Date;
  icon?: string;
  // Task properties to copy when creating from template
  title: string;
  taskDescription?: string;
  priority: Priority;
  categoryId?: string;
  dueTimeOffset?: number; // days from creation date (e.g., 7 = due in a week)
  dueTime?: string;
  reminder?: number;
  subtasks?: Omit<SubTask, 'id' | 'createdAt' | 'completed'>[];
  location?: string;
  isMeeting?: boolean;
  recurrence?: RecurrencePattern;
}

export interface TaskFilter {
  status?: 'all' | 'pending' | 'completed';
  priority?: Priority | 'all';
  category?: string | 'all';
  dueDate?: 'today' | 'week' | 'overdue' | 'all';
} 