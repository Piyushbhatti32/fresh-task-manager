import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { format, isSameDay, isToday, parseISO } from 'date-fns';
import { useTheme } from '../theme/ThemeProvider';
import { useTaskStore } from '../stores/taskStore';
import { Task } from '../types/Task';
import { MaterialIcons } from '@expo/vector-icons';

interface MarkedDates {
  [date: string]: {
    marked: boolean;
    dotColor?: string;
    selected?: boolean;
    selectedColor?: string;
    dots?: Array<{key: string; color: string}>;
  };
}

interface CalendarViewProps {
  onTaskPress?: (taskId: string) => void;
  onToggleCompletion?: (taskId: string) => void;
  onAddTask?: (date: string) => void;
}

export default function CalendarView({ 
  onTaskPress,
  onToggleCompletion,
  onAddTask
}: CalendarViewProps) {
  const { theme, isDark } = useTheme();
  const { tasks } = useTaskStore();
  
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [tasksForSelectedDate, setTasksForSelectedDate] = useState<Task[]>([]);
  
  // Enhanced marked dates with multi-dot support
  useEffect(() => {
    const newMarkedDates: MarkedDates = {};
    
    // Group tasks by date and priority
    const tasksByDate: Record<string, Record<string, number>> = {};
    
    tasks.forEach(task => {
      if (!task.dueDate) return;
      
      try {
        const dateString = format(task.dueDate, 'yyyy-MM-dd');
        
        if (!tasksByDate[dateString]) {
          tasksByDate[dateString] = { high: 0, medium: 0, low: 0 };
        }
        
        // Count tasks by priority
        tasksByDate[dateString][task.priority as keyof typeof tasksByDate[string]]++;
      } catch (error) {
        console.error('Error processing task date:', error);
      }
    });
    
    // Create marked dates with dots for each priority that has tasks
    Object.entries(tasksByDate).forEach(([dateString, priorities]) => {
      const dots = [];
      
      if (priorities.high > 0) {
        dots.push({ key: 'high', color: theme.colors.error });
      }
      
      if (priorities.medium > 0) {
        dots.push({ key: 'medium', color: theme.colors.warning });
      }
      
      if (priorities.low > 0) {
        dots.push({ key: 'low', color: theme.colors.success });
      }
      
      newMarkedDates[dateString] = {
        marked: true,
        dots
      };
    });
    
    // Add selected date indicator
    newMarkedDates[selectedDate] = {
      ...newMarkedDates[selectedDate],
      selected: true,
      selectedColor: theme.colors.primary + '40',  // Semi-transparent for better dot visibility
    };
    
    setMarkedDates(newMarkedDates);
  }, [tasks, selectedDate, theme]);
  
  // Update displayed tasks when selected date changes
  useEffect(() => {
    const filteredTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      
      try {
        // Ensure dueDate is a valid Date object
        const taskDate = new Date(task.dueDate);
        
        // Skip if invalid date
        if (isNaN(taskDate.getTime())) return false;
        
        return format(taskDate, 'yyyy-MM-dd') === selectedDate;
      } catch (error) {
        console.error('Error comparing task date:', error);
        return false;
      }
    });
    
    // Sort tasks: pending first, then by priority, then by title
    const sortedTasks = [...filteredTasks].sort((a, b) => {
      // First sort by completion status
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      
      // Then sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then sort by title
      return a.title.localeCompare(b.title);
    });
    
    setTasksForSelectedDate(sortedTasks);
  }, [tasks, selectedDate]);
  
  // Handle date selection
  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
  };
  
  // Format the date for display
  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return 'Today, ' + format(date, 'MMMM d, yyyy');
    }
    
    return format(date, 'EEEE, MMMM d, yyyy');
  };
  
  // Handle task completion toggle
  const handleToggleTask = (taskId: string) => {
    if (onToggleCompletion) {
      onToggleCompletion(taskId);
    }
  };
  
  // Handle add task button press
  const handleAddTask = () => {
    if (onAddTask) {
      onAddTask(selectedDate);
    }
  };
  
  // Render a task item
  const renderTaskItem = ({ item }: { item: Task }) => {
    const priorityColors = {
      high: theme.colors.error,
      medium: theme.colors.warning,
      low: theme.colors.success
    };
    
    return (
      <TouchableOpacity
        style={[
          styles.taskItem,
          {
            backgroundColor: theme.colors.surface,
            borderLeftColor: priorityColors[item.priority as keyof typeof priorityColors],
            opacity: item.completed ? 0.7 : 1
          }
        ]}
        onPress={() => onTaskPress && onTaskPress(item.id)}
      >
        <View style={styles.taskStatusContainer}>
          <TouchableOpacity
            style={[
              styles.checkbox,
              { borderColor: theme.colors.outline || theme.colors.text + '40' },
              item.completed && { backgroundColor: theme.colors.success }
            ]}
            onPress={() => handleToggleTask(item.id)}
          >
            {item.completed && (
              <MaterialIcons name="done" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.taskContent}>
          <Text 
            style={[
              styles.taskTitle, 
              { 
                color: theme.colors.text,
                textDecorationLine: item.completed ? 'line-through' : 'none' 
              }
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          
          {item.description ? (
            <Text 
              style={[styles.taskDescription, { color: theme.colors.text, opacity: 0.7 }]}
              numberOfLines={1}
            >
              {item.description}
            </Text>
          ) : null}
          
          {/* Show subtasks count if available */}
          {item.subtasks && item.subtasks.length > 0 && (
            <View style={styles.subtasksIndicator}>
              <Text style={[styles.subtasksText, { color: theme.colors.text, opacity: 0.7 }]}>
                {item.subtasks.filter(st => st.completed).length}/{item.subtasks.length} subtasks
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      backgroundColor: priorityColors[item.priority as keyof typeof priorityColors],
                      width: `${Math.round((item.subtasks.filter(st => st.completed).length / item.subtasks.length) * 100)}%`
                    }
                  ]}
                />
              </View>
            </View>
          )}
        </View>
        
        {/* Priority indicator */}
        <View 
          style={[
            styles.priorityIndicator, 
            { backgroundColor: priorityColors[item.priority as keyof typeof priorityColors] }
          ]}
        >
          <Text style={styles.priorityText}>
            {item.priority === 'high' ? 'H' : item.priority === 'medium' ? 'M' : 'L'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <Calendar
        style={[styles.calendar, { borderColor: theme.colors.outline || theme.colors.text + '40' }]}
        theme={{
          calendarBackground: theme.colors.surface,
          textSectionTitleColor: theme.colors.text,
          selectedDayBackgroundColor: theme.colors.primary,
          selectedDayTextColor: '#fff',
          todayTextColor: theme.colors.primary,
          dayTextColor: theme.colors.text,
          textDisabledColor: theme.colors.text + '40',
          dotColor: theme.colors.primary,
          selectedDotColor: '#fff',
          arrowColor: theme.colors.primary,
          monthTextColor: theme.colors.text,
          indicatorColor: theme.colors.primary,
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 14
        }}
        markingType={'multi-dot'}
        markedDates={markedDates}
        onDayPress={handleDateSelect}
        enableSwipeMonths={true}
      />
      
      <View style={styles.taskListContainer}>
        <View style={styles.dateHeaderContainer}>
          <Text style={[styles.dateHeader, { color: theme.colors.text }]}>
            {formatDisplayDate(selectedDate)}
          </Text>
          
          {/* Add task button */}
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleAddTask}
          >
            <MaterialIcons name="add" size={18} color="#fff" />
            <Text style={styles.addButtonText}>Add Task</Text>
          </TouchableOpacity>
        </View>
        
        {tasksForSelectedDate.length > 0 ? (
          <FlatList
            data={tasksForSelectedDate}
            renderItem={renderTaskItem}
            keyExtractor={(item) => item.id}
            style={styles.taskList}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.colors.secondary || theme.colors.text + '80' }]}>
              No tasks scheduled for this day
            </Text>
            <TouchableOpacity 
              style={[styles.addTaskButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleAddTask}
            >
              <Text style={styles.addTaskButtonText}>Add Task for This Day</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendar: {
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    padding: 10,
    marginBottom: 15,
  },
  taskListContainer: {
    flex: 1,
  },
  dateHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  taskList: {
    flex: 1,
  },
  taskItem: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 8,
    padding: 12,
    borderLeftWidth: 4,
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
    borderRadius: 3,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
    justifyContent: 'center',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
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
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  addTaskButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addTaskButtonText: {
    color: 'white',
    fontWeight: 'bold',
  }
}); 