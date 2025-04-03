export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  inactive: string;
  placeholder: string;
  highlight: string;
  cardBackground: string;
  shadowColor: string;
  surface: string;
  surfaceVariant: string;
  outline: string;
}

export type ThemeName = 'default' | 'blue' | 'green' | 'purple' | 'custom';

export interface Theme {
  name: ThemeName;
  mode: ThemeMode;
  colors: ThemeColors;
}

export interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  setThemeName: (name: ThemeName) => void;
  customizeTheme: (colors: Partial<ThemeColors>) => void;
} 