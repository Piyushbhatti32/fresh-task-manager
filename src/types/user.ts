export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  language: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  createdAt: Date;
  lastLogin: Date;
  settings: UserSettings;
}

export interface UserProfileUpdate {
  displayName?: string | null;
  photoURL?: string | null;
  emailVerified?: boolean;
  lastLogin?: Date;
  settings?: Partial<UserSettings>;
} 