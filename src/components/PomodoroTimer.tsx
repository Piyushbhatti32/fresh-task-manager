import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  Vibration,
  Animated,
  Easing,
  ScrollView
} from 'react-native';
import { useTaskStore } from '../stores/taskStore';
import { Task } from '../types/Task';
import { useTheme } from '../theme/ThemeProvider';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { formatTime } from '../utils/timeUtils';

interface PomodoroTimerProps {
  onClose?: () => void;
  initialTaskId?: string;
  showCloseButton?: boolean;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  onClose,
  initialTaskId,
  showCloseButton = true
}) => {
  const { theme, isDark } = useTheme();
  const {
    tasks,
    currentPomodoro,
    pomodoroSettings,
    startPomodoro,
    pausePomodoro,
    resumePomodoro,
    stopPomodoro,
    completePomodoro,
    skipBreak
  } = useTaskStore();

  // State
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialTaskId || null);
  const [interruptionNote, setInterruptionNote] = useState('');
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [showInterruptionDialog, setShowInterruptionDialog] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  // Animation refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  
  // Computed values
  const selectedTask = selectedTaskId 
    ? tasks.find(t => t.id === selectedTaskId) 
    : null;
  
  const formattedTime = formatTime(currentPomodoro.timeRemaining);
  
  const isActive = currentPomodoro.active;
  const isBreak = currentPomodoro.isBreak;
  
  const timerTitle = isBreak 
    ? (currentPomodoro.timeRemaining > pomodoroSettings.shortBreakDuration * 60 
        ? 'Long Break' 
        : 'Short Break') 
    : 'Work Session';
  
  // Color scheme based on current state
  const timerColor = isBreak ? theme.colors.success : theme.colors.primary;
  
  // Calculate progress percentage for the circular indicator
  const totalDuration = isBreak 
    ? (currentPomodoro.timeRemaining > pomodoroSettings.shortBreakDuration * 60 
        ? pomodoroSettings.longBreakDuration * 60 
        : pomodoroSettings.shortBreakDuration * 60)
    : pomodoroSettings.workDuration * 60;
    
  const progress = (totalDuration - currentPomodoro.timeRemaining) / totalDuration;
  
  // SVG circle properties
  const circleRadius = 120;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const staticStrokeDashoffset = circleCircumference * (1 - progress);
  
  // Animated stroke dash offset for the progress circle
  const animatedStrokeDashoffset = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [circleCircumference, 0],
  });
  
  // Update progress animation
  useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
      easing: Easing.linear
    }).start();
    
    // Add pulse animation when under 1 minute
    if (currentPomodoro.timeRemaining <= 60 && isActive) {
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease)
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease)
        })
      ]).start(() => {
        if (currentPomodoro.timeRemaining <= 60 && isActive) {
          // Only restart if still active and under 1 minute
          pulseAnimation.setValue(1);
        }
      });
    }
  }, [currentPomodoro.timeRemaining, isActive]);
  
  // Set up timer
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (currentPomodoro.timeRemaining <= 1) {
          // Timer complete
          if (isBreak) {
            // Break complete
            handleBreakComplete();
          } else {
            // Work session complete
            handleSessionComplete();
          }
        } else {
          // Decrement timer
          useTaskStore.setState((state) => ({
            currentPomodoro: {
              ...state.currentPomodoro,
              timeRemaining: state.currentPomodoro.timeRemaining - 1
            }
          }));
        }
      }, 1000);
    } else if (timerRef.current) {
      // Clear timer when not active
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Clean up timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, currentPomodoro.timeRemaining, isBreak]);
  
  // Update selected task when initialTaskId changes
  useEffect(() => {
    if (initialTaskId) {
      setSelectedTaskId(initialTaskId);
    }
  }, [initialTaskId]);
  
  // Clear state when component unmounts
  useEffect(() => {
    return () => {
      if (!currentPomodoro.active) {
        stopPomodoro(false, '');
      }
    };
  }, []);
  
  // Handle timer completion
  const handleSessionComplete = () => {
    // Vibrate device to notify user
    if (Platform.OS !== 'web' && soundEnabled) {
      Vibration.vibrate([500, 200, 500]);
    }
    
    // Mark session as complete
    completePomodoro();
  };
  
  const handleBreakComplete = () => {
    // Vibrate device to notify user
    if (Platform.OS !== 'web' && soundEnabled) {
      Vibration.vibrate([300, 100, 300]);
    }
    
    // Reset timer state
    stopPomodoro(false, '');
    
    // Auto-start next session if setting is enabled
    if (pomodoroSettings.autoStartNextSession && selectedTaskId) {
      startPomodoro(selectedTaskId);
    }
  };
  
  // Timer control actions
  const handleStart = () => {
    if (!selectedTaskId) {
      setShowTaskSelector(true);
      return;
    }
    
    startPomodoro(selectedTaskId);
  };
  
  const handlePause = () => {
    pausePomodoro();
  };
  
  const handleResume = () => {
    resumePomodoro();
  };
  
  const handleStop = () => {
    setShowInterruptionDialog(true);
  };
  
  const handleConfirmStop = () => {
    stopPomodoro(true, interruptionNote);
    setInterruptionNote('');
    setShowInterruptionDialog(false);
  };
  
  const handleSkipBreak = () => {
    skipBreak();
    
    // If auto start is not enabled and we have a selected task, start a new session
    if (!pomodoroSettings.autoStartNextSession && selectedTaskId) {
      startPomodoro(selectedTaskId);
    }
  };
  
  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowTaskSelector(false);
    
    // If not already in a session, start one
    if (!currentPomodoro.active) {
      startPomodoro(taskId);
    }
  };
  
  const handleClose = () => {
    // Ensure we stop the timer if active
    if (currentPomodoro.active) {
      stopPomodoro(false, '');
    }
    
    // Make sure we call the onClose prop consistently
    if (onClose) {
      onClose();
    }
  };
  
  // Render task options for selector
  const renderTaskOptions = () => {
    const activeTasks = tasks.filter(task => !task.completed);
    
    if (activeTasks.length === 0) {
      return (
        <View style={styles.emptyTasksContainer}>
          <Text style={[styles.emptyTasksText, { color: theme.colors.text }]}>
            No active tasks available. Create a task first.
          </Text>
        </View>
      );
    }
    
    return activeTasks.map(task => (
      <TouchableOpacity
        key={task.id}
        style={[
          styles.taskOption,
          { backgroundColor: isDark ? '#333' : '#f5f5f5' },
          selectedTaskId === task.id && { 
            backgroundColor: isDark ? '#2c3e50' : '#e1f5fe',
            borderColor: theme.colors.primary,
            borderWidth: 1
          }
        ]}
        onPress={() => handleTaskSelect(task.id)}
      >
        <View style={[
          styles.priorityIndicator, 
          { 
            backgroundColor: 
              task.priority === 'high' ? theme.colors.error :
              task.priority === 'medium' ? theme.colors.warning :
              theme.colors.success
          }
        ]} />
        
        <View style={styles.taskOptionContent}>
          <Text 
            style={[styles.taskTitle, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          
          {selectedTaskId === task.id && (
            <View style={styles.selectedIndicator}>
              <MaterialIcons name="check-circle" size={20} color={theme.colors.primary} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    ));
  };
  
  // Add keydown event handler for Escape key to close the timer
  useEffect(() => {
    // Define the handler function
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    // Add the event listener
    if (Platform.OS === 'web') {
      document.addEventListener('keydown', handleKeyDown);
    }

    // Return cleanup function
    return () => {
      if (Platform.OS === 'web') {
        document.removeEventListener('keydown', handleKeyDown);
      }
      
      // Stop the timer if active when component unmounts
      if (currentPomodoro.active) {
        stopPomodoro(false, '');
      }
    };
  }, [currentPomodoro.active, stopPomodoro]);
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[
          styles.pomodoroContainer,
          { 
            backgroundColor: isDark ? '#222' : '#fff',
            shadowColor: isDark ? '#000' : '#888',
          }
        ]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Pomodoro Timer
            </Text>
            
            <View style={styles.headerControls}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setSoundEnabled(!soundEnabled)}
                accessibilityLabel={soundEnabled ? "Disable sound" : "Enable sound"}
              >
                <MaterialIcons 
                  name={soundEnabled ? "volume-up" : "volume-off"} 
                  size={24} 
                  color={theme.colors.text} 
                />
              </TouchableOpacity>
              
              {showCloseButton && (
                <TouchableOpacity
                  style={[styles.iconButton, { marginLeft: 8 }]}
                  onPress={handleClose}
                >
                  <MaterialIcons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* Task Selection */}
          <TouchableOpacity
            style={[
              styles.taskSelector,
              { backgroundColor: isDark ? '#333' : '#f5f5f5' }
            ]}
            onPress={() => setShowTaskSelector(true)}
          >
            <MaterialIcons 
              name="assignment" 
              size={20} 
              color={theme.colors.primary} 
              style={styles.taskSelectorIcon}
            />
            
            <Text 
              style={[
                styles.taskSelectorText, 
                { color: theme.colors.text },
                !selectedTask && { color: theme.colors.placeholder || '#999' }
              ]}
              numberOfLines={1}
            >
              {selectedTask ? selectedTask.title : 'Select a task to focus on'}
            </Text>
            
            <MaterialIcons 
              name="keyboard-arrow-down" 
              size={20} 
              color={theme.colors.text} 
            />
          </TouchableOpacity>
          
          {/* Timer Display with Circular Progress */}
          <Animated.View 
            style={[
              styles.timerContainer,
              { transform: [{ scale: pulseAnimation }] }
            ]}
          >
            <View style={styles.circularProgress}>
              {/* Background Circle */}
              <View style={[
                styles.circleBackground,
                { borderColor: isDark ? '#444' : '#eee' }
              ]} />
              
              {/* Progress Arc */}
              <Svg width={250} height={250} style={styles.circleProgress}>
                <Circle
                  cx={125}
                  cy={125}
                  r={120}
                  stroke={timerColor}
                  strokeWidth={10}
                  fill="transparent"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={staticStrokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90, 125, 125)"
                />
              </Svg>
              
              {/* Timer Text */}
              <View style={styles.timerTextContainer}>
                <Text style={[styles.timerTypeText, { color: theme.colors.text }]}>
                  {timerTitle}
                </Text>
                
                <Text style={[styles.timerText, { color: timerColor }]}>
                  {formattedTime}
                </Text>
                
                <Text style={[styles.sessionCountText, { color: theme.colors.secondary || '#999' }]}>
                  Session {currentPomodoro.currentSessionCount} of {pomodoroSettings.sessionsUntilLongBreak}
                </Text>
              </View>
            </View>
          </Animated.View>
          
          {/* Controls */}
          <View style={styles.controlsContainer}>
            {isActive ? (
              <View style={styles.activeControls}>
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    { backgroundColor: theme.colors.error }
                  ]}
                  onPress={handleStop}
                >
                  <MaterialIcons name="stop" size={24} color="#fff" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    styles.mainControlButton,
                    { backgroundColor: isActive ? theme.colors.warning : theme.colors.primary }
                  ]}
                  onPress={isActive ? handlePause : isBreak ? handleSkipBreak : handleStart}
                >
                  <MaterialIcons 
                    name={isActive ? "pause" : "play-arrow"} 
                    size={32} 
                    color="#fff" 
                  />
                </TouchableOpacity>
                
                {isBreak && (
                  <TouchableOpacity
                    style={[
                      styles.controlButton,
                      { backgroundColor: theme.colors.primary }
                    ]}
                    onPress={handleSkipBreak}
                  >
                    <MaterialIcons name="skip-next" size={24} color="#fff" />
                  </TouchableOpacity>
                )}
                
                {!isBreak && !isActive && (
                  <TouchableOpacity
                    style={[
                      styles.controlButton,
                      { backgroundColor: theme.colors.secondary || '#666' }
                    ]}
                    onPress={() => setShowSettings(true)}
                  >
                    <MaterialIcons name="settings" size={24} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.startButton,
                  { backgroundColor: theme.colors.primary }
                ]}
                onPress={currentPomodoro.sessionId ? handleResume : handleStart}
              >
                <MaterialIcons 
                  name={currentPomodoro.sessionId ? "play-arrow" : "play-circle-filled"} 
                  size={24} 
                  color="#fff" 
                />
                <Text style={styles.startButtonText}>
                  {currentPomodoro.sessionId ? 'Resume Session' : 'Start Session'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Session Progress */}
          {selectedTask && selectedTask.completedPomodoros !== undefined && selectedTask.completedPomodoros > 0 && (
            <View style={styles.statsContainer}>
              <Text style={[styles.statsTitle, { color: theme.colors.text }]}>
                Task Progress
              </Text>
              
              <View style={styles.statsRow}>
                <View style={[
                  styles.statCard, 
                  { backgroundColor: isDark ? '#333' : '#f5f5f5' }
                ]}>
                  <FontAwesome5 name="hourglass-half" size={18} color={theme.colors.primary} />
                  <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                    {selectedTask.completedPomodoros}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.text }]}>
                    Pomodoros
                  </Text>
                </View>
                
                <View style={[
                  styles.statCard, 
                  { backgroundColor: isDark ? '#333' : '#f5f5f5' }
                ]}>
                  <FontAwesome5 name="stopwatch" size={18} color={theme.colors.success} />
                  <Text style={[styles.statValue, { color: theme.colors.success }]}>
                    {selectedTask.totalPomodoroTime || 0}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.text }]}>
                    Minutes
                  </Text>
                </View>
              </View>
            </View>
          )}
          
          {/* Pomodoro Information */}
          <View style={styles.infoContainer}>
            <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
              What is the Pomodoro Technique?
            </Text>
            
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              The Pomodoro Technique is a time management method developed by Francesco Cirillo in the late 1980s. It uses a timer to break work into intervals, traditionally 25 minutes in length, separated by short breaks.
            </Text>
            
            <Text style={[styles.infoSubtitle, { color: theme.colors.text }]}>
              Benefits:
            </Text>
            
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <MaterialIcons name="check-circle" size={18} color={theme.colors.primary} style={styles.benefitIcon} />
                <Text style={[styles.benefitText, { color: theme.colors.text }]}>
                  Improved focus and concentration
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <MaterialIcons name="check-circle" size={18} color={theme.colors.primary} style={styles.benefitIcon} />
                <Text style={[styles.benefitText, { color: theme.colors.text }]}>
                  Reduced mental fatigue
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <MaterialIcons name="check-circle" size={18} color={theme.colors.primary} style={styles.benefitIcon} />
                <Text style={[styles.benefitText, { color: theme.colors.text }]}>
                  Increased productivity and work quality
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <MaterialIcons name="check-circle" size={18} color={theme.colors.primary} style={styles.benefitIcon} />
                <Text style={[styles.benefitText, { color: theme.colors.text }]}>
                  Better planning and time estimation
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <MaterialIcons name="check-circle" size={18} color={theme.colors.primary} style={styles.benefitIcon} />
                <Text style={[styles.benefitText, { color: theme.colors.text }]}>
                  Reduced procrastination
                </Text>
              </View>
            </View>
            
            <Text style={[styles.infoSubtitle, { color: theme.colors.text }]}>
              Why use it?
            </Text>
            
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              The technique works with your brain's natural rhythms, leveraging focused work periods and regular breaks to maintain high productivity. By breaking work into manageable chunks, you can avoid burnout and maintain a sustainable pace throughout the day.
            </Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Task Selector Modal */}
      <Modal
        visible={showTaskSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTaskSelector(false)}
      >
        <View style={[
          styles.modalOverlay,
          { backgroundColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)' }
        ]}>
          <View style={[
            styles.taskSelectorModal,
            { 
              backgroundColor: isDark ? '#222' : '#fff',
              shadowColor: isDark ? '#000' : '#888'
            }
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Select a Task
              </Text>
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowTaskSelector(false)}
              >
                <MaterialIcons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.taskOptionsContainer}>
              {renderTaskOptions()}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Interruption Dialog */}
      <Modal
        visible={showInterruptionDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInterruptionDialog(false)}
      >
        <View style={[
          styles.modalOverlay,
          { backgroundColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)' }
        ]}>
          <View style={[
            styles.interruptionDialog,
            { 
              backgroundColor: isDark ? '#222' : '#fff',
              shadowColor: isDark ? '#000' : '#888'
            }
          ]}>
            <Text style={[styles.dialogTitle, { color: theme.colors.text }]}>
              Stop Pomodoro Session?
            </Text>
            
            <Text style={[styles.dialogMessage, { color: theme.colors.secondary || '#666' }]}>
              {isActive ? 
                'Your focus session is still running. Why are you stopping?' : 
                'Do you want to close the timer?'}
            </Text>
            
            {isActive && (
              <TextInput
                style={[
                  styles.interruptionInput,
                  { 
                    backgroundColor: isDark ? '#333' : '#f5f5f5',
                    color: theme.colors.text,
                    borderColor: isDark ? '#444' : '#ddd'
                  }
                ]}
                placeholder="Note (optional)"
                placeholderTextColor={theme.colors.placeholder || '#999'}
                value={interruptionNote}
                onChangeText={setInterruptionNote}
                multiline
              />
            )}
            
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={[
                  styles.dialogButton,
                  { backgroundColor: isDark ? '#333' : '#f5f5f5' }
                ]}
                onPress={() => setShowInterruptionDialog(false)}
              >
                <Text style={[styles.dialogButtonText, { color: theme.colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.dialogButton,
                  { backgroundColor: theme.colors.error }
                ]}
                onPress={isActive ? handleConfirmStop : handleClose}
              >
                <Text style={[styles.dialogButtonText, { color: '#fff' }]}>
                  {isActive ? 'Stop' : 'Close'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  pomodoroContainer: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  taskSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  taskSelectorIcon: {
    marginRight: 8,
  },
  taskSelectorText: {
    flex: 1,
    fontSize: 16,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  circularProgress: {
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circleBackground: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 10,
    position: 'absolute',
  },
  circleProgress: {
    position: 'absolute',
  },
  timerTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerTypeText: {
    fontSize: 18,
    marginBottom: 4,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  sessionCountText: {
    fontSize: 14,
    marginTop: 4,
  },
  controlsContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  activeControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  mainControlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '45%',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  taskSelectorModal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 16,
    maxHeight: '80%',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 5,
  },
  taskOptionsContainer: {
    maxHeight: 400,
  },
  taskOption: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  priorityIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 8,
  },
  taskOptionContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 16,
    flex: 1,
  },
  selectedIndicator: {
    marginLeft: 8,
  },
  emptyTasksContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyTasksText: {
    fontSize: 16,
    textAlign: 'center',
  },
  interruptionDialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dialogMessage: {
    fontSize: 16,
    marginBottom: 16,
  },
  interruptionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    height: 100,
    textAlignVertical: 'top',
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  dialogButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  dialogButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoContainer: {
    marginTop: 20,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  benefitsList: {
    marginLeft: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitIcon: {
    marginRight: 8,
  },
  benefitText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default PomodoroTimer; 