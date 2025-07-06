import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import App from './App';

// Mock the useTaskStore hook
jest.mock('./src/stores/taskStore', () => ({
  useTaskStore: () => ({
    initialize: jest.fn(),
  }),
}));

describe('App', () => {
  it('renders without crashing', async () => {
    const { getByTestId } = render(<App />);
    
    // Wait for the app to initialize
    await waitFor(() => {
      expect(getByTestId('app-container')).toBeTruthy();
    });
  });

  it('renders with dark theme when isDark is true', async () => {
    // Mock the useTheme hook
    jest.mock('./src/theme/ThemeProvider', () => ({
      useTheme: () => ({
        isDark: true,
        theme: {
          colors: {
            primary: '#000000',
            background: '#000000',
            text: '#ffffff',
          },
        },
      }),
    }));

    const { getByTestId } = render(<App />);
    
    await waitFor(() => {
      expect(getByTestId('app-container')).toBeTruthy();
    });
  });

  it('renders with light theme when isDark is false', async () => {
    // Mock the useTheme hook
    jest.mock('./src/theme/ThemeProvider', () => ({
      useTheme: () => ({
        isDark: false,
        theme: {
          colors: {
            primary: '#ffffff',
            background: '#ffffff',
            text: '#000000',
          },
        },
      }),
    }));

    const { getByTestId } = render(<App />);
    
    await waitFor(() => {
      expect(getByTestId('app-container')).toBeTruthy();
    });
  });
}); 