import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  Vibration
} from 'react-native';
import useTaskStore from '../stores/taskStore';
import { Task } from '../types/Task';
import { useTheme } from '../theme/ThemeProvider';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface PomodoroTimerProps {
  isVisible: boolean;
  onClose: () => void;
  initialTaskId?: string;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  isVisible,
  onClose,
  initialTaskId
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
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
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
    if (Platform.OS !== 'web') {
      Vibration.vibrate([500, 200, 500]);
    }
    
    // Mark session as complete
    completePomodoro();
  };
  
  const handleBreakComplete = () => {
    // Vibrate device to notify user
    if (Platform.OS !== 'web') {
      Vibration.vibrate([300, 100, 300]);
    }
    
    // Reset timer state
    stopPomodoro(false, '');
    
    // Auto-start next session if setting is enabled
    if (pomodoroSettings.autoStartNextSession && selectedTaskId) {
      startPomodoro(selectedTaskId);
    }
  };
  
  // Format seconds into MM:SS
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
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
    if (currentPomodoro.active) {
      // If active, confirm before closing
      setShowInterruptionDialog(true);
    } else {
      // Otherwise, just close
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
          
          {task.completedPomodoros ? (
            <Text style={[styles.pomodoroCount, { color: theme.colors.secondary }]}>
              {task.completedPomodoros} pomodoros completed
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    ));
  };
  
  return (
    <View style={[
      styles.timerContainer,
      { backgroundColor: isDark ? '#222' : '#fff' }
    ]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Pomodoro Timer
        </Text>
      </View>
      
      {/* Task selector */}
      {!showTaskSelector ? (
        <TouchableOpacity 
          style={[
            styles.taskSelector,
            { backgroundColor: isDark ? '#333' : '#f5f5f5' }
          ]}
          onPress={() => setShowTaskSelector(true)}
          disabled={currentPomodoro.active}
        >
          <Text style={[styles.taskSelectorText, { color: theme.colors.text }]}>
            {selectedTask ? selectedTask.title : 'Select a task to focus on'}
          </Text>
          {!currentPomodoro.active && (
            <MaterialIcons name="arrow-drop-down" size={24} color={theme.colors.text} />
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.taskSelectorContainer}>
          <View style={styles.taskSelectorHeader}>
            <Text style={[styles.taskSelectorTitle, { color: theme.colors.text }]}>
              Select a task
            </Text>
            <TouchableOpacity 
              style={styles.closeTaskSelector}
              onPress={() => setShowTaskSelector(false)}
            >
              <Ionicons name="close" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.taskOptionsList}>
            {renderTaskOptions()}
          </View>
        </View>
      )}
      
      {/* Timer display */}
      <View style={[
        styles.timerDisplay,
        {
          backgroundColor: isDark ? '#333' : '#f5f5f5',
          borderColor: isBreak ? theme.colors.success : theme.colors.primary
        }
      ]}>
        <Text style={[styles.timerType, { color: theme.colors.text }]}>
          {timerTitle}
        </Text>
        <Text style={[
          styles.timer, 
          { 
            color: isBreak ? theme.colors.success : theme.colors.primary
          }
        ]}>
          {formattedTime}
        </Text>
        <Text style={[styles.sessionCount, { color: theme.colors.secondary }]}>
          Session {currentPomodoro.currentSessionCount} of {pomodoroSettings.sessionsUntilLongBreak}
        </Text>
      </View>
      
      {/* Timer controls */}
      <View style={styles.controls}>
        {!isActive ? (
          <TouchableOpacity
            style={[
              styles.controlButton,
              styles.primaryButton,
              { backgroundColor: theme.colors.primary }
            ]}
            onPress={currentPomodoro.sessionId ? handleResume : handleStart}
          >
            <Text style={[styles.controlButtonText, { color: '#fff' }]}>
              {currentPomodoro.sessionId ? 'Resume' : 'Start'}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.controlButton,
                { backgroundColor: theme.colors.warning }
              ]}
              onPress={handlePause}
            >
              <Text style={[styles.controlButtonText, { color: '#fff' }]}>Pause</Text>
            </TouchableOpacity>
            
            {isBreak ? (
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  { backgroundColor: theme.colors.secondary }
                ]}
                onPress={handleSkipBreak}
              >
                <Text style={[styles.controlButtonText, { color: '#fff' }]}>Skip Break</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  { backgroundColor: theme.colors.error }
                ]}
                onPress={handleStop}
              >
                <Text style={[styles.controlButtonText, { color: '#fff' }]}>Stop</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
      
      {/* Stats section */}
      {selectedTask && selectedTask.completedPomodoros ? (
        <View style={styles.statsSection}>
          <Text style={[styles.statsTitle, { color: theme.colors.text }]}>
            Task Statistics
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {selectedTask.completedPomodoros}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.secondary }]}>
                Completed
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {selectedTask.totalPomodoroTime || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.secondary }]}>
                Minutes
              </Text>
            </View>
          </View>
        </View>
      ) : null}
      
      {/* Interruption Dialog */}
      <Modal
        visible={showInterruptionDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInterruptionDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.dialogContainer,
            { backgroundColor: isDark ? '#333' : '#fff' }
          ]}>
            <Text style={[styles.dialogTitle, { color: theme.colors.text }]}>
              Stop Session
            </Text>
            <Text style={[styles.dialogText, { color: theme.colors.text }]}>
              Are you sure you want to stop this Pomodoro session? Any time tracked will still be saved.
            </Text>
            
            <TextInput
              style={[
                styles.noteInput,
                { 
                  backgroundColor: isDark ? '#444' : '#f5f5f5',
                  color: theme.colors.text,
                  borderColor: isDark ? '#555' : '#ddd'
                }
              ]}
              placeholder="Add a note about the interruption (optional)"
              placeholderTextColor={isDark ? '#aaa' : '#999'}
              value={interruptionNote}
              onChangeText={setInterruptionNote}
              multiline
            />
            
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={[
                  styles.dialogButton,
                  { borderColor: theme.colors.text }
                ]}
                onPress={() => setShowInterruptionDialog(false)}
              >
                <Text style={{ color: theme.colors.text }}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.dialogButton,
                  styles.dialogConfirmButton,
                  { backgroundColor: theme.colors.error }
                ]}
                onPress={handleConfirmStop}
              >
                <Text style={[styles.dialogConfirmText, { color: '#fff' }]}>Stop Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  timerContainer: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  taskSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  taskSelectorText: {
    fontSize: 16,
    fontWeight: '500',
  },
  taskSelectorContainer: {
    marginBottom: 20,
  },
  taskSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskSelectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeTaskSelector: {
    padding: 4,
  },
  taskOptionsList: {
    maxHeight: 200,
  },
  emptyTasksContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyTasksText: {
    textAlign: 'center',
    fontSize: 16,
  },
  taskOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  taskOptionContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  pomodoroCount: {
    fontSize: 12,
  },
  timerDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
  },
  timerType: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  timer: {
    fontSize: 64,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  sessionCount: {
    fontSize: 14,
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  controlButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryButton: {
    paddingVertical: 16,
    minWidth: 180,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsSection: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dialogContainer: {
    width: '80%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  dialogText: {
    fontSize: 16,
    marginBottom: 16,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  dialogButton: {
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
  },
  dialogConfirmButton: {
    borderWidth: 0,
  },
  dialogConfirmText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default PomodoroTimer; 