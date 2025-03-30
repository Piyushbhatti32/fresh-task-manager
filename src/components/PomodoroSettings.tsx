import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  Animated,
  TextInput,
  Platform
} from 'react-native';
import { useTaskStore } from '../stores/taskStore';
import { PomodoroSettings as PomodoroSettingsType } from '../types/Task';
import { useTheme } from '../theme/ThemeProvider';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

interface PomodoroSettingsProps {
  isVisible: boolean;
  onClose: () => void;
}

const PomodoroSettings: React.FC<PomodoroSettingsProps> = ({ isVisible, onClose }) => {
  const { theme, isDark } = useTheme();
  const { pomodoroSettings, updatePomodoroSettings } = useTaskStore();
  
  // Local state to track settings changes
  const [workDuration, setWorkDuration] = useState(pomodoroSettings.workDuration);
  const [shortBreakDuration, setShortBreakDuration] = useState(pomodoroSettings.shortBreakDuration);
  const [longBreakDuration, setLongBreakDuration] = useState(pomodoroSettings.longBreakDuration);
  const [sessionsUntilLongBreak, setSessionsUntilLongBreak] = useState(pomodoroSettings.sessionsUntilLongBreak);
  const [autoStartBreaks, setAutoStartBreaks] = useState(pomodoroSettings.autoStartBreaks);
  const [autoStartNextSession, setAutoStartNextSession] = useState(pomodoroSettings.autoStartNextSession);
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  // Fade in animation when modal opens
  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);
  
  // Reset local state when settings change
  useEffect(() => {
    setWorkDuration(pomodoroSettings.workDuration);
    setShortBreakDuration(pomodoroSettings.shortBreakDuration);
    setLongBreakDuration(pomodoroSettings.longBreakDuration);
    setSessionsUntilLongBreak(pomodoroSettings.sessionsUntilLongBreak);
    setAutoStartBreaks(pomodoroSettings.autoStartBreaks);
    setAutoStartNextSession(pomodoroSettings.autoStartNextSession);
  }, [pomodoroSettings]);
  
  // Input validation
  const validateNumericInput = (value: string, min: number, max: number, setter: (val: number) => void) => {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
      setter(parsed);
    }
  };
  
  // Save settings
  const handleSave = () => {
    const newSettings: PomodoroSettingsType = {
      workDuration,
      shortBreakDuration,
      longBreakDuration,
      sessionsUntilLongBreak,
      autoStartBreaks,
      autoStartNextSession
    };
    
    updatePomodoroSettings(newSettings);
    onClose();
  };
  
  // Reset to defaults
  const handleResetDefaults = () => {
    setWorkDuration(25);
    setShortBreakDuration(5);
    setLongBreakDuration(15);
    setSessionsUntilLongBreak(4);
    setAutoStartBreaks(true);
    setAutoStartNextSession(false);
  };
  
  // Format minutes for display
  const formatMinutes = (minutes: number) => {
    return `${minutes} min`;
  };
  
  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[
        styles.modalContainer,
        { backgroundColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)' }
      ]}>
        <Animated.View 
          style={[
            styles.settingsContainer,
            { 
              backgroundColor: isDark ? '#222' : '#fff',
              shadowColor: isDark ? '#000' : '#888',
              opacity: fadeAnim,
              transform: [{ 
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })
              }]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Pomodoro Settings
            </Text>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <MaterialIcons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.settingsScroll}>
            {/* Timer Durations */}
            <View style={styles.settingsSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Timer Durations
              </Text>
              
              {/* Work Duration */}
              <View style={styles.settingItem}>
                <View style={styles.settingLabelContainer}>
                  <MaterialIcons 
                    name="timer" 
                    size={20} 
                    color={theme.colors.primary} 
                    style={styles.settingIcon} 
                  />
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                    Work Session
                  </Text>
                </View>
                
                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={5}
                    maximumValue={60}
                    step={1}
                    value={workDuration}
                    onValueChange={setWorkDuration}
                    minimumTrackTintColor={theme.colors.primary}
                    maximumTrackTintColor={isDark ? '#444' : '#e0e0e0'}
                    thumbTintColor={theme.colors.primary}
                  />
                  
                  <View style={styles.valueContainer}>
                    <TextInput
                      style={[
                        styles.valueInput,
                        { 
                          color: theme.colors.text,
                          backgroundColor: isDark ? '#333' : '#f5f5f5',
                          borderColor: isDark ? '#444' : '#e0e0e0'
                        }
                      ]}
                      value={workDuration.toString()}
                      onChangeText={(value) => validateNumericInput(value, 5, 60, setWorkDuration)}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text style={[styles.valueUnit, { color: theme.colors.text }]}>min</Text>
                  </View>
                </View>
              </View>
              
              {/* Short Break Duration */}
              <View style={styles.settingItem}>
                <View style={styles.settingLabelContainer}>
                  <MaterialIcons 
                    name="coffee" 
                    size={20} 
                    color={theme.colors.success} 
                    style={styles.settingIcon} 
                  />
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                    Short Break
                  </Text>
                </View>
                
                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={1}
                    maximumValue={15}
                    step={1}
                    value={shortBreakDuration}
                    onValueChange={setShortBreakDuration}
                    minimumTrackTintColor={theme.colors.success}
                    maximumTrackTintColor={isDark ? '#444' : '#e0e0e0'}
                    thumbTintColor={theme.colors.success}
                  />
                  
                  <View style={styles.valueContainer}>
                    <TextInput
                      style={[
                        styles.valueInput,
                        { 
                          color: theme.colors.text,
                          backgroundColor: isDark ? '#333' : '#f5f5f5',
                          borderColor: isDark ? '#444' : '#e0e0e0'
                        }
                      ]}
                      value={shortBreakDuration.toString()}
                      onChangeText={(value) => validateNumericInput(value, 1, 15, setShortBreakDuration)}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text style={[styles.valueUnit, { color: theme.colors.text }]}>min</Text>
                  </View>
                </View>
              </View>
              
              {/* Long Break Duration */}
              <View style={styles.settingItem}>
                <View style={styles.settingLabelContainer}>
                  <MaterialIcons 
                    name="weekend" 
                    size={20} 
                    color={theme.colors.warning} 
                    style={styles.settingIcon} 
                  />
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                    Long Break
                  </Text>
                </View>
                
                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={5}
                    maximumValue={30}
                    step={1}
                    value={longBreakDuration}
                    onValueChange={setLongBreakDuration}
                    minimumTrackTintColor={theme.colors.warning}
                    maximumTrackTintColor={isDark ? '#444' : '#e0e0e0'}
                    thumbTintColor={theme.colors.warning}
                  />
                  
                  <View style={styles.valueContainer}>
                    <TextInput
                      style={[
                        styles.valueInput,
                        { 
                          color: theme.colors.text,
                          backgroundColor: isDark ? '#333' : '#f5f5f5',
                          borderColor: isDark ? '#444' : '#e0e0e0'
                        }
                      ]}
                      value={longBreakDuration.toString()}
                      onChangeText={(value) => validateNumericInput(value, 5, 30, setLongBreakDuration)}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text style={[styles.valueUnit, { color: theme.colors.text }]}>min</Text>
                  </View>
                </View>
              </View>
              
              {/* Sessions Until Long Break */}
              <View style={styles.settingItem}>
                <View style={styles.settingLabelContainer}>
                  <MaterialIcons 
                    name="repeat" 
                    size={20} 
                    color={theme.colors.secondary || '#999'} 
                    style={styles.settingIcon} 
                  />
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                    Sessions Until Long Break
                  </Text>
                </View>
                
                <View style={styles.valueInputContainer}>
                  <TouchableOpacity
                    style={[
                      styles.counterButton,
                      { 
                        backgroundColor: isDark ? '#333' : '#f0f0f0',
                        opacity: sessionsUntilLongBreak <= 1 ? 0.5 : 1
                      }
                    ]}
                    onPress={() => sessionsUntilLongBreak > 1 && setSessionsUntilLongBreak(sessionsUntilLongBreak - 1)}
                    disabled={sessionsUntilLongBreak <= 1}
                  >
                    <MaterialIcons name="remove" size={20} color={theme.colors.text} />
                  </TouchableOpacity>
                  
                  <TextInput
                    style={[
                      styles.counterInput,
                      { 
                        color: theme.colors.text,
                        backgroundColor: isDark ? '#333' : '#f5f5f5',
                        borderColor: isDark ? '#444' : '#e0e0e0'
                      }
                    ]}
                    value={sessionsUntilLongBreak.toString()}
                    onChangeText={(value) => validateNumericInput(value, 1, 10, setSessionsUntilLongBreak)}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  
                  <TouchableOpacity
                    style={[
                      styles.counterButton,
                      { 
                        backgroundColor: isDark ? '#333' : '#f0f0f0',
                        opacity: sessionsUntilLongBreak >= 10 ? 0.5 : 1
                      }
                    ]}
                    onPress={() => sessionsUntilLongBreak < 10 && setSessionsUntilLongBreak(sessionsUntilLongBreak + 1)}
                    disabled={sessionsUntilLongBreak >= 10}
                  >
                    <MaterialIcons name="add" size={20} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            {/* Automation Settings */}
            <View style={styles.settingsSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Automation
              </Text>
              
              {/* Auto Start Breaks */}
              <View style={styles.switchItem}>
                <View style={styles.switchLabelContainer}>
                  <MaterialIcons 
                    name="play-circle-outline" 
                    size={20} 
                    color={theme.colors.success} 
                    style={styles.settingIcon} 
                  />
                  <View>
                    <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                      Auto-start Breaks
                    </Text>
                    <Text style={[styles.settingDescription, { color: theme.colors.secondary || '#999' }]}>
                      Automatically start break when work session ends
                    </Text>
                  </View>
                </View>
                
                <Switch
                  value={autoStartBreaks}
                  onValueChange={setAutoStartBreaks}
                  trackColor={{ 
                    false: isDark ? '#444' : '#e0e0e0', 
                    true: theme.colors.success 
                  }}
                  thumbColor={
                    Platform.OS === 'ios' 
                      ? undefined 
                      : autoStartBreaks 
                        ? isDark ? '#fff' : '#fff'
                        : isDark ? '#999' : '#ccc'
                  }
                />
              </View>
              
              {/* Auto Start Next Session */}
              <View style={styles.switchItem}>
                <View style={styles.switchLabelContainer}>
                  <MaterialIcons 
                    name="fast-forward" 
                    size={20} 
                    color={theme.colors.primary} 
                    style={styles.settingIcon} 
                  />
                  <View>
                    <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                      Auto-start Next Session
                    </Text>
                    <Text style={[styles.settingDescription, { color: theme.colors.secondary || '#999' }]}>
                      Automatically start next work session after break
                    </Text>
                  </View>
                </View>
                
                <Switch
                  value={autoStartNextSession}
                  onValueChange={setAutoStartNextSession}
                  trackColor={{ 
                    false: isDark ? '#444' : '#e0e0e0', 
                    true: theme.colors.primary 
                  }}
                  thumbColor={
                    Platform.OS === 'ios' 
                      ? undefined 
                      : autoStartNextSession 
                        ? isDark ? '#fff' : '#fff'
                        : isDark ? '#999' : '#ccc'
                  }
                />
              </View>
            </View>
          </ScrollView>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.resetButton,
                { borderColor: isDark ? '#444' : '#e0e0e0' }
              ]}
              onPress={handleResetDefaults}
            >
              <Text style={[styles.resetButtonText, { color: theme.colors.text }]}>
                Reset Defaults
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: theme.colors.primary }
              ]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>
                Save Settings
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  settingsContainer: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  settingsScroll: {
    maxHeight: 500,
  },
  settingsSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    marginBottom: 20,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingIcon: {
    marginRight: 8,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  slider: {
    flex: 1,
    height: 40,
    marginRight: 16,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 70,
  },
  valueInput: {
    width: 40,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 16,
  },
  valueUnit: {
    marginLeft: 4,
    fontSize: 16,
  },
  valueInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterInput: {
    width: 40,
    marginHorizontal: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 16,
  },
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  resetButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 12,
  },
  resetButtonText: {
    fontSize: 16,
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default PomodoroSettings; 