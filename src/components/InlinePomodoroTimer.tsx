import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Vibration
} from 'react-native';
import { useTaskStore } from '../stores/taskStore';
import { Task } from '../types/Task';
import { useTheme } from '../theme/ThemeProvider';
import { AntDesign } from '@expo/vector-icons';

export interface InlinePomodoroTimerProps {
  initialTaskId?: string;
  onMinimize: () => void;
}

const InlinePomodoroTimer: React.FC<InlinePomodoroTimerProps> = ({
  initialTaskId,
  onMinimize
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
              ...(state.currentPomodoro || {}),
              timeRemaining: state.currentPomodoro?.timeRemaining - 1
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
    skipBreak();
    
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
    if (!selectedTaskId && tasks.length > 0) {
      // Just pick the first task if none selected
      setSelectedTaskId(tasks[0].id);
      startPomodoro(tasks[0].id);
    } else if (selectedTaskId) {
      startPomodoro(selectedTaskId);
    }
  };
  
  const handlePause = () => {
    pausePomodoro();
  };
  
  const handleResume = () => {
    resumePomodoro();
  };
  
  const handleStop = () => {
    stopPomodoro(true, "Manually stopped");
  };
  
  const handleSkipBreak = () => {
    skipBreak();
  };
  
  // Select a different task
  const selectNextTask = () => {
    if (tasks.length === 0) return;
    
    if (!selectedTaskId) {
      setSelectedTaskId(tasks[0].id);
      return;
    }
    
    const currentIndex = tasks.findIndex(t => t.id === selectedTaskId);
    const nextIndex = (currentIndex + 1) % tasks.length;
    setSelectedTaskId(tasks[nextIndex].id);
  };

  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDark ? '#222' : '#f5f5f5' }
    ]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Pomodoro Timer
        </Text>
        {onMinimize && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onMinimize}
            activeOpacity={0.7}
          >
            <AntDesign name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Task display */}
      <TouchableOpacity 
        style={[
          styles.taskButton,
          { backgroundColor: isDark ? '#333' : '#fff' }
        ]}
        onPress={selectNextTask}
      >
        <Text style={[styles.taskButtonLabel, { color: theme.colors.secondary }]}>
          Current Task:
        </Text>
        <Text style={[styles.taskButtonText, { color: theme.colors.text }]}>
          {selectedTask ? selectedTask.title : 'Select a task'}
        </Text>
      </TouchableOpacity>
      
      {/* Timer display */}
      <View style={[
        styles.timerDisplay,
        {
          backgroundColor: isDark ? '#333' : '#fff',
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
          Session {currentPomodoro?.currentSessionCount} of {pomodoroSettings?.sessionsUntilLongBreak}
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
      
      {/* Stats */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  taskButton: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  taskButtonLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  taskButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
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
    textAlign: 'center',
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
});

export default InlinePomodoroTimer; 