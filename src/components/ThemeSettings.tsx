import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { ThemeName, ThemeMode } from '../theme/ThemeTypes';

interface ThemeSettingsProps {
  visible: boolean;
  onClose: () => void;
}

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ visible, onClose }) => {
  const { theme, isDark, toggleTheme, setThemeMode, setThemeName } = useTheme();
  const [activeTab, setActiveTab] = useState<'mode' | 'theme'>('mode');

  // Theme mode options
  const themeModes: { label: string; value: ThemeMode }[] = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'System', value: 'system' },
  ];

  // Theme color options
  const themeOptions: { label: string; value: ThemeName; color: string }[] = [
    { label: 'Default', value: 'default', color: '#3498db' },
    { label: 'Blue', value: 'blue', color: '#1565c0' },
    { label: 'Green', value: 'green', color: '#2e7d32' },
    { label: 'Purple', value: 'purple', color: '#7b1fa2' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[
        styles.modalContainer,
        { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)' }
      ]}>
        <View style={[
          styles.modalContent,
          { 
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          }
        ]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Appearance Settings
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: theme.colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'mode' && [styles.activeTab, { borderColor: theme.colors.primary }]
              ]}
              onPress={() => setActiveTab('mode')}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: theme.colors.text },
                  activeTab === 'mode' && { color: theme.colors.primary }
                ]}
              >
                Theme Mode
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'theme' && [styles.activeTab, { borderColor: theme.colors.primary }]
              ]}
              onPress={() => setActiveTab('theme')}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: theme.colors.text },
                  activeTab === 'theme' && { color: theme.colors.primary }
                ]}
              >
                Color Theme
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {activeTab === 'mode' && (
              <View style={styles.section}>
                <View style={styles.toggleContainer}>
                  <Text style={[styles.toggleText, { color: theme.colors.text }]}>
                    Dark Mode
                  </Text>
                  <Switch
                    value={isDark}
                    onValueChange={toggleTheme}
                    trackColor={{ false: '#767577', true: theme.colors.primary }}
                    thumbColor={isDark ? theme.colors.card : '#f4f3f4'}
                  />
                </View>

                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Theme Mode
                </Text>
                <View style={styles.optionsContainer}>
                  {themeModes.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        { borderColor: theme.colors.border },
                        theme.mode === option.value && {
                          borderColor: theme.colors.primary,
                          backgroundColor: isDark
                            ? 'rgba(52, 152, 219, 0.2)'
                            : 'rgba(52, 152, 219, 0.1)',
                        },
                      ]}
                      onPress={() => setThemeMode(option.value)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          { color: theme.colors.text },
                          theme.mode === option.value && { color: theme.colors.primary },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {activeTab === 'theme' && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Color Themes
                </Text>
                <View style={styles.colorOptionsContainer}>
                  {themeOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.colorOption,
                        { borderColor: theme.colors.border },
                        theme.name === option.value && {
                          borderColor: theme.colors.primary,
                          backgroundColor: isDark
                            ? 'rgba(52, 152, 219, 0.2)'
                            : 'rgba(52, 152, 219, 0.1)',
                        },
                      ]}
                      onPress={() => setThemeName(option.value)}
                    >
                      <View
                        style={[
                          styles.colorSwatch,
                          { backgroundColor: option.color },
                        ]}
                      />
                      <Text
                        style={[
                          styles.colorOptionText,
                          { color: theme.colors.text },
                          theme.name === option.value && { color: theme.colors.primary },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: theme.colors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 20,
  },
  toggleText: {
    fontSize: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  optionButton: {
    flex: 1,
    margin: 5,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: '30%',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  colorOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  colorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    margin: 5,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: '45%',
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 10,
  },
  colorOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  doneButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ThemeSettings; 