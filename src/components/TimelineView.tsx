import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated
} from 'react-native';
import { format, addDays, isToday, isTomorrow, isYesterday, isAfter, isSameDay, isBefore } from 'date-fns';
import { useTaskStore } from '../stores/taskStore';
import { useTheme } from '../theme/ThemeProvider';
import { Task } from '../types/Task';
import { MaterialIcons } from '@expo/vector-icons';
import { TaskCard } from './TaskCard';

interface TimelineViewProps {
  onTaskPress?: (taskId: string) => void;
  onToggleCompletion?: (taskId: string) => void;
  days?: number;
  tasks: Task[];
  onStartPomodoro: (taskId: string) => void;
}

export default function TimelineView({ 
  onTaskPress, 
  onToggleCompletion,
  days = 14,  // Show 2 weeks by default
  tasks,
  onStartPomodoro
}: TimelineViewProps) {
  const { theme, isDark } = useTheme();
  const [timelineTasks, setTimelineTasks] = useState<Record<string, Task[]>>({});
  const [dateRange, setDateRange] = useState<Date[]>([]);
  const [expandedDates, setExpandedDates] = useState<string[]>([]);
  const fadeAnim = useState(new Animated.Value(0))[0];
  
  // Create task grouping as a top-level useMemo
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    
    tasks.forEach((task: Task) => {
      // Skip tasks without a due date
      if (!task.dueDate) return;
      
      try {
        // Ensure dueDate is a valid Date object
        const taskDate = new Date(task.dueDate);
        
        // Skip if invalid date
        if (isNaN(taskDate.getTime())) return;
        
        const dateKey = format(taskDate, 'yyyy-MM-dd');
        
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        
        grouped[dateKey].push(task);
      } catch (error) {
        console.error('Error processing task date:', error);
        return;
      }
    });
    
    // Sort dates chronologically
    return Object.keys(grouped)
      .sort((a, b) => {
        try {
          const dateA = new Date(a);
          const dateB = new Date(b);
          
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
            return 0;
          }
          
          return dateA.getTime() - dateB.getTime();
        } catch (error) {
          console.error('Error sorting dates:', error);
          return 0;
        }
      })
      .reduce((result, key) => {
        // Sort tasks by priority and completion status
        const sortedTasks = [...grouped[key]].sort((a, b) => {
          // First sort by completion status
          if (a.completed && !b.completed) return 1;
          if (!a.completed && b.completed) return -1;
          
          // Then by priority
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          const priorityDiff = priorityOrder[a.priority || 'low'] - priorityOrder[b.priority || 'low'];
          if (priorityDiff !== 0) return priorityDiff;
          
          // Then by title
          return a.title.localeCompare(b.title);
        });
        
        result[key] = sortedTasks;
        return result;
      }, {} as Record<string, Task[]>);
  }, [tasks]);
  
  // Initialize date range and set timeline tasks
  useEffect(() => {
    // Create date range centered around today
    const dates: Date[] = [];
    const today = new Date();
    
    // Add dates - past, today, and future
    const pastDays = Math.floor(days / 3);
    const futureDays = days - pastDays - 1;
    
    // Add past dates
    for (let i = -pastDays; i < 0; i++) {
      dates.push(addDays(today, i));
    }
    
    // Add today
    dates.push(today);
    
    // Add future dates
    for (let i = 1; i <= futureDays; i++) {
      dates.push(addDays(today, i));
    }
    
    setDateRange(dates);
    
    // Automatically expand today's date
    const todayKey = format(today, 'yyyy-MM-dd');
    setExpandedDates([todayKey]);
    
    setTimelineTasks(tasksByDate);
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start();
  }, [days, tasksByDate]);
  
  // Format date for display
  const formatDate = (date: Date): string => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEE, MMM d');
  };
  
  // Handle toggling a date section (expand/collapse)
  const toggleDateExpansion = (dateKey: string) => {
    setExpandedDates(prev => 
      prev.includes(dateKey)
        ? prev.filter(date => date !== dateKey)
        : [...prev, dateKey]
    );
  };
  
  // Handle task completion toggle
  const handleToggleTask = (taskId: string) => {
    if (onToggleCompletion) {
      onToggleCompletion(taskId);
    }
  };
  
  // Determine the date section color based on its relation to today
  const getDateSectionColor = (date: Date) => {
    const today = new Date();
    
    if (isToday(date)) {
      return theme.colors.primary;
    } else if (isBefore(date, today)) {
      return theme.colors.error; // Past dates
    } else {
      return theme.colors.success; // Future dates
    }
  };
  
  // Render a task item
  const renderTaskItem = (task: Task, dateKey: string) => {
    const priorityColors = {
      high: theme.colors.error,
      medium: theme.colors.warning,
      low: theme.colors.success
    };
    
    return (
      <TaskCard
        key={task.id}
        task={task}
        onPress={() => onTaskPress && onTaskPress(task.id)}
        onStartPomodoro={() => onStartPomodoro(task.id)}
      />
    );
  };
  
  // Render a day's timeline
  const renderDayTimeline = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const tasksForDate = timelineTasks[dateKey] || [];
    const isExpanded = expandedDates.includes(dateKey);
    const dateColor = getDateSectionColor(date);
    
    // If no tasks and not today, don't show this date
    if (tasksForDate.length === 0 && !isToday(date)) {
      return null;
    }
    
    return (
      <View 
        key={dateKey} 
        style={[
          styles.dayContainer,
          { borderBottomColor: theme.colors.border }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.dateHeader,
            {
              borderLeftColor: dateColor,
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
            }
          ]}
          onPress={() => toggleDateExpansion(dateKey)}
        >
          <View style={styles.dateHeaderContent}>
            <Text 
              style={[
                styles.dateText, 
                { color: theme.colors.text }
              ]}
            >
              {formatDate(date)}
            </Text>
            
            <View style={styles.dateHeaderRight}>
              <Text style={[styles.taskCount, { color: theme.colors.text, opacity: 0.7 }]}>
                {tasksForDate.length} {tasksForDate.length === 1 ? 'task' : 'tasks'}
              </Text>
              
              <MaterialIcons 
                name={isExpanded ? 'expand-less' : 'expand-more'} 
                size={24} 
                color={theme.colors.text} 
              />
            </View>
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <Animated.View 
            style={[
              styles.tasksContainer,
              { opacity: fadeAnim }
            ]}
          >
            {tasksForDate.length > 0 ? (
              tasksForDate.map(task => renderTaskItem(task, dateKey))
            ) : (
              <View style={[styles.emptyDayContainer, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.emptyDayText, { color: theme.colors.text }]}>
                  No tasks scheduled
                </Text>
              </View>
            )}
          </Animated.View>
        )}
      </View>
    );
  };
  
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {dateRange.map(date => renderDayTimeline(date))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  dayContainer: {
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  dateHeader: {
    padding: 12,
    borderLeftWidth: 4,
    borderRadius: 4,
  },
  dateHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskCount: {
    fontSize: 14,
    marginRight: 8,
  },
  tasksContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  taskItem: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 8,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  taskStatusContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  priorityIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginLeft: 8,
  },
  priorityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subtasksIndicator: {
    marginTop: 4,
  },
  subtasksText: {
    fontSize: 12,
  },
  progressBarContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  emptyDayContainer: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyDayText: {
    fontSize: 14,
    fontStyle: 'italic',
  }
}); 