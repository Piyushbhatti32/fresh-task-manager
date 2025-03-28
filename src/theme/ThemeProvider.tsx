import React, { createContext, useState, useEffect, useContext } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeContextType, ThemeMode, ThemeName, ThemeColors } from './ThemeTypes';
import { getThemeColors, lightColors, darkColors, isSystemDarkMode } from './themes';

// Default theme settings
const defaultTheme: Theme = {
  name: 'default',
  mode: 'system',
  colors: lightColors,
};

// Create the theme context
export const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  isDark: false,
  toggleTheme: () => {},
  setThemeMode: () => {},
  setThemeName: () => {},
  customizeTheme: () => {},
});

// Custom hook to use theme
export const useTheme = () => useContext(ThemeContext);

// Theme storage keys
const THEME_MODE_KEY = '@task_manager_theme_mode';
const THEME_NAME_KEY = '@task_manager_theme_name';
const CUSTOM_THEME_KEY = '@task_manager_custom_theme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get the device color scheme
  const colorScheme = useColorScheme();
  
  // State for theme settings
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [themeName, setThemeName] = useState<ThemeName>('default');
  const [customColors, setCustomColors] = useState<Partial<ThemeColors>>({});
  
  // Compute if dark mode should be active
  const isDark = themeMode === 'system' 
    ? colorScheme === 'dark' 
    : themeMode === 'dark';
  
  // Current theme colors based on mode and name
  const currentColors = React.useMemo(() => {
    let colors = getThemeColors(themeName, isDark);
    
    // Apply custom colors if the theme is 'custom'
    if (themeName === 'custom') {
      colors = {
        ...(isDark ? darkColors : lightColors),
        ...customColors,
      };
    }
    
    return colors;
  }, [themeName, isDark, customColors]);
  
  // The complete theme object
  const theme: Theme = {
    name: themeName,
    mode: themeMode,
    colors: currentColors,
  };
  
  // Load saved theme settings on component mount
  useEffect(() => {
    const loadThemeSettings = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_MODE_KEY);
        const savedName = await AsyncStorage.getItem(THEME_NAME_KEY);
        const savedCustom = await AsyncStorage.getItem(CUSTOM_THEME_KEY);
        
        if (savedMode) {
          setThemeMode(savedMode as ThemeMode);
        }
        
        if (savedName) {
          setThemeName(savedName as ThemeName);
        }
        
        if (savedCustom) {
          setCustomColors(JSON.parse(savedCustom));
        }
      } catch (error) {
        console.error('Failed to load theme settings:', error);
      }
    };
    
    loadThemeSettings();
  }, []);
  
  // Listen for system appearance changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (themeMode === 'system') {
        // Force re-render when system theme changes
        setThemeMode('system');
      }
    });
    
    return () => {
      subscription.remove();
    };
  }, [themeMode]);
  
  // Toggle between light and dark mode
  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
    AsyncStorage.setItem(THEME_MODE_KEY, newMode);
  };
  
  // Set a specific theme mode
  const handleSetThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    AsyncStorage.setItem(THEME_MODE_KEY, mode);
  };
  
  // Set a specific theme name
  const handleSetThemeName = (name: ThemeName) => {
    setThemeName(name);
    AsyncStorage.setItem(THEME_NAME_KEY, name);
  };
  
  // Customize theme colors (for 'custom' theme)
  const customizeTheme = (colors: Partial<ThemeColors>) => {
    setCustomColors(prev => {
      const newColors = { ...prev, ...colors };
      AsyncStorage.setItem(CUSTOM_THEME_KEY, JSON.stringify(newColors));
      return newColors;
    });
    
    // Switch to custom theme if not already
    if (themeName !== 'custom') {
      setThemeName('custom');
      AsyncStorage.setItem(THEME_NAME_KEY, 'custom');
    }
  };
  
  const contextValue: ThemeContextType = {
    theme,
    isDark,
    toggleTheme,
    setThemeMode: handleSetThemeMode,
    setThemeName: handleSetThemeName,
    customizeTheme,
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}; 