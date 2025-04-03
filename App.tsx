import React, { useEffect } from 'react';
import { StyleSheet } from "react-native";
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from "./src/navigation/AppNavigator";
import { ThemeProvider, useTheme } from "./src/theme/ThemeProvider";
import DatabaseProvider from "./src/database/DatabaseProvider";
import { customLightTheme, customDarkTheme } from './src/theme/navigationTheme';
import { useTaskStore } from './src/stores/taskStore';

function AppContent() {
  const { isDark, theme } = useTheme();
  const { initialize } = useTaskStore();
  
  // Create a combined theme for react-native-paper
  const paperTheme = isDark 
    ? { ...MD3DarkTheme, colors: { ...MD3DarkTheme.colors, ...theme.colors } }
    : { ...MD3LightTheme, colors: { ...MD3LightTheme.colors, ...theme.colors } };
  
  useEffect(() => {
    // Initialize the store when the app starts
    initialize();
  }, []);
  
  return (
    <PaperProvider theme={paperTheme}>
      <NavigationContainer theme={isDark ? customDarkTheme : customLightTheme}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <DatabaseProvider>
          <AppNavigator />
        </DatabaseProvider>
      </NavigationContainer>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
