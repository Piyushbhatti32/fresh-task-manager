import React from 'react';
import { DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { 
  MD3DarkTheme, 
  adaptNavigationTheme, 
  Provider as PaperProvider,
} from 'react-native-paper';
import { StatusBar } from 'react-native';

// Define our custom dark theme with AMOLED black and blue accents
const darkTheme = {
  ...MD3DarkTheme,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,
    // Pure black for AMOLED screens
    background: '#000000',
    // Slightly lighter black for cards and surfaces
    surface: '#0A0A0A', 
    surfaceVariant: '#121212',
    // Bright blue accents
    primary: '#0066FF',
    primaryContainer: '#003D99',
    secondary: '#3D9AFF',
    secondaryContainer: '#0055DD',
    // Text colors
    onBackground: '#FFFFFF',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#CCCCCC',
    // Status colors - adjusted for visibility on dark background
    error: '#FF5252',
    onError: '#FFFFFF',
    outline: '#444444',
    outlineVariant: '#222222',
  },
};

// Adapt the theme for navigation
const { DarkTheme } = adaptNavigationTheme({
  reactNavigationDark: NavigationDefaultTheme,
});

const CombinedDarkTheme = {
  ...darkTheme,
  ...DarkTheme,
  colors: {
    ...darkTheme.colors,
    ...DarkTheme.colors,
  },
};

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <PaperProvider theme={darkTheme}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#000000" 
        translucent={false}
      />
      {children}
    </PaperProvider>
  );
}

// Export the themes for use in App.tsx and StyleSheets
export const appTheme = darkTheme;
export const navigationTheme = CombinedDarkTheme; 