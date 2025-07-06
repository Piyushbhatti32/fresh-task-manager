import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Keyboard,
  Platform,
  Text,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onSearch?: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function SearchBar({
  value,
  onChangeText,
  onSearch,
  placeholder = 'Search tasks...',
  autoFocus = false,
}: SearchBarProps) {
  const { theme, isDark } = useTheme();
  const [searchText, setSearchText] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);

  // Update internal state when value prop changes
  useEffect(() => {
    if (value !== undefined && value !== searchText) {
      setSearchText(value);
    }
  }, [value]);

  // Handle search submission
  const handleSubmitEditing = () => {
    if (onSearch) onSearch(searchText);
    Keyboard.dismiss();
  };

  // Handle clear button press
  const handleClear = () => {
    setSearchText('');
    if (onChangeText) onChangeText('');
    if (onSearch) onSearch('');
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
  };

  // Update search as text changes
  const handleChangeText = (text: string) => {
    setSearchText(text);
    if (onChangeText) onChangeText(text);
    if (onSearch) onSearch(text);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: isFocused ? theme.colors.primary : (theme.colors.outline || theme.colors.text + '40'),
          shadowColor: isDark ? '#000' : 'rgba(0,0,0,0.2)',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: isFocused ? 3 : 1,
        },
      ]}
    >
      <View style={styles.searchIcon}>
        <Text>🔍</Text>
      </View>
      <TextInput
        style={[
          styles.input,
          { color: theme.colors.text },
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text + '60'}
        value={searchText}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmitEditing}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoFocus={autoFocus}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {searchText.length > 0 && Platform.OS === 'android' && (
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Text style={{ fontSize: 16, color: theme.colors.text, opacity: 0.6 }}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 3px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 8,
  },
}); 