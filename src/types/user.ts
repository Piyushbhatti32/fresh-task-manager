export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  lastLogin: Date;
  isEmailVerified: boolean;
  isAnonymous: boolean;
  settings: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: string;
    taskView: 'list' | 'calendar' | 'board';
    defaultTaskDuration: number; // in minutes
    workHours: {
      start: string; // HH:mm format
      end: string;   // HH:mm format
      timezone: string;
    };
    taskReminders: {
      enabled: boolean;
      defaultReminderTime: number; // minutes before task
    };
    privacy: {
      showCompletedTasks: boolean;
      showTaskProgress: boolean;
    };
    accessibility: {
      fontSize: 'small' | 'medium' | 'large';
      highContrast: boolean;
      reducedMotion: boolean;
    };
  };
} 