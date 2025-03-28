import React from 'react';
import { StyleSheet } from "react-native";
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from "./src/navigation/AppNavigator";
import { ThemeProvider, useTheme } from "./src/theme/ThemeProvider";
import DatabaseProvider from "./src/database/DatabaseProvider";
import { customLightTheme, customDarkTheme } from './src/theme/navigationTheme';

function AppContent() {
  const { isDark, theme } = useTheme();
  
  return (
    <PaperProvider theme={isDark ? MD3DarkTheme : MD3LightTheme}>
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
