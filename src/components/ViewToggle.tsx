import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export type ViewMode = 'list' | 'grid' | 'timeline';

interface ViewToggleProps {
  mode: ViewMode;
  onToggle: (mode: ViewMode) => void;
}

export default function ViewToggle({ mode, onToggle }: ViewToggleProps) {
  const { theme } = useTheme();

  // Create list icon (three lines)
  const renderListIcon = () => {
    return (
      <View style={[styles.iconContainer, { opacity: mode === 'list' ? 1 : 0.5 }]}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.listLine,
              {
                backgroundColor: mode === 'list' ? theme.colors.primary : theme.colors.text,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  // Create grid icon (four squares)
  const renderGridIcon = () => {
    return (
      <View
        style={[
          styles.iconContainer,
          styles.gridContainer,
          { opacity: mode === 'grid' ? 1 : 0.5 },
        ]}
      >
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.gridSquare,
              {
                backgroundColor: mode === 'grid' ? theme.colors.primary : theme.colors.text,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          mode === 'list' && {
            backgroundColor: theme.colors.primaryContainer,
          },
        ]}
        onPress={() => onToggle('list')}
        activeOpacity={0.7}
      >
        {renderListIcon()}
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.button,
          mode === 'grid' && {
            backgroundColor: theme.colors.primaryContainer,
          },
        ]}
        onPress={() => onToggle('grid')}
        activeOpacity={0.7}
      >
        {renderGridIcon()}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'space-between',
  },
  listLine: {
    height: 4,
    width: '100%',
    borderRadius: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridSquare: {
    height: 8,
    width: 8,
    margin: 1,
    borderRadius: 1,
  },
}); 