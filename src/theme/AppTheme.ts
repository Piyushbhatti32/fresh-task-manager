import { MD3LightTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

const baseFont = {
  fontFamily: 'System',
  fontSize: 16,
  fontWeight: '400',
  letterSpacing: 0,
  lineHeight: 24,
};

export const appTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200EE',
    primaryContainer: '#E8DEF8',
    secondary: '#03DAC6',
    secondaryContainer: '#CEFAF1',
    tertiary: '#FB8C00',
    tertiaryContainer: '#FFE0B2',
    error: '#B00020',
    errorContainer: '#FFDAD6',
    background: '#F6F6F6',
    surface: '#FFFFFF',
    surfaceVariant: '#E7E0EC',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#21005E',
    onSecondary: '#000000',
    onSecondaryContainer: '#00332D',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#000000',
    onError: '#FFFFFF',
    onErrorContainer: '#410002',
    onBackground: '#1C1B1F',
    onSurface: '#1C1B1F',
    onSurfaceVariant: '#49454F',
    onSurfaceDisabled: '#1C1B1F61',
    elevation: {
      level0: 'transparent',
      level1: '#F5F5F5',
      level2: '#EEEEEE',
      level3: '#E0E0E0',
      level4: '#BDBDBD',
      level5: '#9E9E9E',
    },
  },
}; 