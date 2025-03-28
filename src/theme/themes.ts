import { ThemeColors, ThemeName } from './ThemeTypes';
import { Appearance } from 'react-native';

// Default light theme colors
export const lightColors: ThemeColors = {
  primary: '#3498db',
  secondary: '#2ecc71',
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#333333',
  border: '#e1e1e1',
  notification: '#ff3b30',
  success: '#28a745',
  error: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
  inactive: '#a5a5a5',
  placeholder: '#a0a0a0',
  highlight: '#f0f0f0',
  cardBackground: '#ffffff',
  shadowColor: '#000000',
};

// Default dark theme colors
export const darkColors: ThemeColors = {
  primary: '#2980b9',
  secondary: '#27ae60',
  background: '#121212',
  card: '#1e1e1e',
  text: '#f5f5f5',
  border: '#2c2c2c',
  notification: '#ff453a',
  success: '#34c759',
  error: '#ff3b30',
  warning: '#ffcc00',
  info: '#5ac8fa',
  inactive: '#666666',
  placeholder: '#666666',
  highlight: '#2c2c2c',
  cardBackground: '#2a2a2a',
  shadowColor: '#000000',
};

// Blue theme
export const blueColors: {
  light: ThemeColors;
  dark: ThemeColors;
} = {
  light: {
    ...lightColors,
    primary: '#1565c0',
    secondary: '#0288d1',
    highlight: '#e3f2fd',
  },
  dark: {
    ...darkColors,
    primary: '#42a5f5',
    secondary: '#29b6f6',
    highlight: '#0d47a1',
  },
};

// Green theme
export const greenColors: {
  light: ThemeColors;
  dark: ThemeColors;
} = {
  light: {
    ...lightColors,
    primary: '#2e7d32',
    secondary: '#388e3c',
    highlight: '#e8f5e9',
  },
  dark: {
    ...darkColors,
    primary: '#66bb6a',
    secondary: '#81c784',
    highlight: '#1b5e20',
  },
};

// Purple theme
export const purpleColors: {
  light: ThemeColors;
  dark: ThemeColors;
} = {
  light: {
    ...lightColors,
    primary: '#7b1fa2',
    secondary: '#9c27b0',
    highlight: '#f3e5f5',
  },
  dark: {
    ...darkColors,
    primary: '#ba68c8',
    secondary: '#ce93d8',
    highlight: '#4a148c',
  },
};

// Get colors for a specific theme and mode
export const getThemeColors = (
  themeName: ThemeName,
  isDark: boolean
): ThemeColors => {
  switch (themeName) {
    case 'blue':
      return isDark ? blueColors.dark : blueColors.light;
    case 'green':
      return isDark ? greenColors.dark : greenColors.light;
    case 'purple':
      return isDark ? purpleColors.dark : purpleColors.light;
    case 'custom':
      // Custom colors will be handled separately
      return isDark ? darkColors : lightColors;
    default:
      return isDark ? darkColors : lightColors;
  }
};

// Detect if the device prefers dark mode
export const isSystemDarkMode = (): boolean => {
  return Appearance.getColorScheme() === 'dark';
}; 