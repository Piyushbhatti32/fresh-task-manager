import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  ScrollView
} from 'react-native';
import { useTaskStore } from '../stores/taskStore';
import { PomodoroSettings as PomodoroSettingsType } from '../types/Task';
import { useTheme } from '../theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';

interface PomodoroSettingsProps {
  isVisible: boolean;
  onClose: () => void;
}

const PomodoroSettings: React.FC<PomodoroSettingsProps> = ({
  isVisible,
  onClose
}) => {
  const { theme, isDark } = useTheme();
  const { pomodoroSettings, updatePomodoroSettings } = useTaskStore();
  
  // Local state for settings
  const [workDuration, setWorkDuration] = useState(pomodoroSettings.workDuration.toString());
  const [shortBreakDuration, setShortBreakDuration] = useState(pomodoroSettings.shortBreakDuration.toString());
  const [longBreakDuration, setLongBreakDuration] = useState(pomodoroSettings.longBreakDuration.toString());
  const [sessionsUntilLongBreak, setSessionsUntilLongBreak] = useState(pomodoroSettings.sessionsUntilLongBreak.toString());
  const [autoStartBreaks, setAutoStartBreaks] = useState(pomodoroSettings.autoStartBreaks);
  const [autoStartNextSession, setAutoStartNextSession] = useState(pomodoroSettings.autoStartNextSession);

  // Initialize settings from store
  useEffect(() => {
    setWorkDuration(pomodoroSettings.workDuration.toString());
    setShortBreakDuration(pomodoroSettings.shortBreakDuration.toString());
    setLongBreakDuration(pomodoroSettings.longBreakDuration.toString());
    setSessionsUntilLongBreak(pomodoroSettings.sessionsUntilLongBreak.toString());
    setAutoStartBreaks(pomodoroSettings.autoStartBreaks);
    setAutoStartNextSession(pomodoroSettings.autoStartNextSession);
  }, [pomodoroSettings, isVisible]);

  // Helper to ensure numeric input
  const handleNumericInput = (value: string, setter: (value: string) => void) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setter(numericValue);
  };

  // Save settings
  const handleSave = () => {
    // Validate inputs
    const workDurationNum = parseInt(workDuration, 10) || 25;
    const shortBreakDurationNum = parseInt(shortBreakDuration, 10) || 5;
    const longBreakDurationNum = parseInt(longBreakDuration, 10) || 15;
    const sessionsNum = parseInt(sessionsUntilLongBreak, 10) || 4;
    
    const updatedSettings: PomodoroSettingsType = {
      workDuration: Math.max(1, Math.min(120, workDurationNum)), // Between 1 and 120 minutes
      shortBreakDuration: Math.max(1, Math.min(30, shortBreakDurationNum)), // Between 1 and 30 minutes
      longBreakDuration: Math.max(5, Math.min(60, longBreakDurationNum)), // Between 5 and 60 minutes
      sessionsUntilLongBreak: Math.max(1, Math.min(10, sessionsNum)), // Between 1 and 10 sessions
      autoStartBreaks,
      autoStartNextSession
    };
    
    updatePomodoroSettings(updatedSettings);
    onClose();
  };

  // Reset to defaults
  const handleReset = () => {
    setWorkDuration('25');
    setShortBreakDuration('5');
    setLongBreakDuration('15');
    setSessionsUntilLongBreak('4');
    setAutoStartBreaks(true);
    setAutoStartNextSession(false);
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[
        styles.modalOverlay,
        { backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)' }
      ]}>
        <View style={[
          styles.container,
          { backgroundColor: isDark ? '#222' : '#fff' }
        ]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Pomodoro Settings
            </Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.settingGroup}>
              <Text style={[styles.settingGroupTitle, { color: theme.colors.text }]}>
                Time Settings (minutes)
              </Text>
              
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  Work Duration
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: isDark ? '#333' : '#f5f5f5',
                      color: theme.colors.text,
                      borderColor: isDark ? '#444' : '#ddd'
                    }
                  ]}
                  value={workDuration}
                  onChangeText={(value) => handleNumericInput(value, setWorkDuration)}
                  keyboardType="numeric"
                  maxLength={3}
                  placeholder="25"
                  placeholderTextColor={isDark ? '#aaa' : '#999'}
                />
              </View>
              
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  Short Break Duration
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: isDark ? '#333' : '#f5f5f5',
                      color: theme.colors.text,
                      borderColor: isDark ? '#444' : '#ddd'
                    }
                  ]}
                  value={shortBreakDuration}
                  onChangeText={(value) => handleNumericInput(value, setShortBreakDuration)}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="5"
                  placeholderTextColor={isDark ? '#aaa' : '#999'}
                />
              </View>
              
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  Long Break Duration
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: isDark ? '#333' : '#f5f5f5',
                      color: theme.colors.text,
                      borderColor: isDark ? '#444' : '#ddd'
                    }
                  ]}
                  value={longBreakDuration}
                  onChangeText={(value) => handleNumericInput(value, setLongBreakDuration)}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="15"
                  placeholderTextColor={isDark ? '#aaa' : '#999'}
                />
              </View>
              
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  Sessions Until Long Break
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: isDark ? '#333' : '#f5f5f5',
                      color: theme.colors.text,
                      borderColor: isDark ? '#444' : '#ddd'
                    }
                  ]}
                  value={sessionsUntilLongBreak}
                  onChangeText={(value) => handleNumericInput(value, setSessionsUntilLongBreak)}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="4"
                  placeholderTextColor={isDark ? '#aaa' : '#999'}
                />
              </View>
            </View>
            
            <View style={styles.settingGroup}>
              <Text style={[styles.settingGroupTitle, { color: theme.colors.text }]}>
                Automation
              </Text>
              
              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                    Auto-start Breaks
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.secondary }]}>
                    Automatically start breaks after work sessions
                  </Text>
                </View>
                <Switch
                  value={autoStartBreaks}
                  onValueChange={setAutoStartBreaks}
                  trackColor={{ 
                    false: isDark ? '#444' : '#ddd', 
                    true: theme.colors.primary 
                  }}
                  thumbColor={isDark ? '#fff' : '#fff'}
                />
              </View>
              
              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                    Auto-start Next Session
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.secondary }]}>
                    Automatically start new work session after breaks
                  </Text>
                </View>
                <Switch
                  value={autoStartNextSession}
                  onValueChange={setAutoStartNextSession}
                  trackColor={{ 
                    false: isDark ? '#444' : '#ddd', 
                    true: theme.colors.primary 
                  }}
                  thumbColor={isDark ? '#fff' : '#fff'}
                />
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.resetButton,
                { borderColor: theme.colors.error }
              ]}
              onPress={handleReset}
            >
              <Text style={[styles.buttonText, { color: theme.colors.error }]}>
                Reset
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                { backgroundColor: theme.colors.primary }
              ]}
              onPress={handleSave}
            >
              <Text style={[styles.buttonText, { color: '#fff' }]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 450,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
    maxHeight: 400,
  },
  settingGroup: {
    marginBottom: 24,
  },
  settingGroupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    flex: 1,
  },
  input: {
    height: 40,
    width: 80,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    textAlign: 'center',
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabelContainer: {
    flex: 1,
    paddingRight: 16,
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  saveButton: {
    marginLeft: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PomodoroSettings; 