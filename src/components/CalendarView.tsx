import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Dimensions, Animated } from 'react-native';
import { Calendar, CalendarUtils } from 'react-native-calendars';
import { format, isSameDay, isToday, parseISO, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, eachDayOfInterval as getDatesBetween, addWeeks, subWeeks } from 'date-fns';
import { useTheme } from '../theme/ThemeProvider';
import { useTaskStore } from '../stores/taskStore';
import { Task } from '../types/Task';
import { MaterialIcons } from '@expo/vector-icons';

// View type definition
type CalendarViewType = 'month' | 'week' | 'today' | 'timeline' | 'year';

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
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [calendarHeight] = useState(new Animated.Value(350)); // Increased initial height
  const [weekTasks, setWeekTasks] = useState<{[date: string]: Task[]}>({});
  const [viewType, setViewType] = useState<CalendarViewType>('month');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date()));
  const [viewTransition] = useState(new Animated.Value(1));
  
  // Toggle calendar expanded state
  const toggleCalendarExpanded = () => {
    setIsCalendarExpanded(!isCalendarExpanded);
  };
  
  // Navigate to previous month or week
  const goToPrevious = () => {
    if (viewType === 'week') {
      // Previous week
      const newWeekStart = subWeeks(currentWeekStart, 1);
      setCurrentWeekStart(newWeekStart);
      setSelectedDate(format(newWeekStart, 'yyyy-MM-dd'));
      setCurrentMonth(format(newWeekStart, 'yyyy-MM'));
    } else if (viewType === 'month' || viewType === 'timeline') {
      // Previous month - ensure proper update with first day of month
    const prevMonth = subMonths(new Date(currentMonth + '-01'), 1);
      const prevMonthStr = format(prevMonth, 'yyyy-MM');
      setCurrentMonth(prevMonthStr);
      setSelectedDate(prevMonthStr + '-01'); // Select first day of previous month
    } else if (viewType === 'year') {
      // Previous year
      const currentYear = parseInt(currentMonth.split('-')[0]);
      const newYear = (currentYear - 1).toString();
      const newMonth = currentMonth.split('-')[1];
      setCurrentMonth(`${newYear}-${newMonth}`);
    }
  };
  
  // Navigate to next month or week
  const goToNext = () => {
    if (viewType === 'week') {
      // Next week
      const newWeekStart = addWeeks(currentWeekStart, 1);
      setCurrentWeekStart(newWeekStart);
      setSelectedDate(format(newWeekStart, 'yyyy-MM-dd'));
      setCurrentMonth(format(newWeekStart, 'yyyy-MM'));
    } else if (viewType === 'month' || viewType === 'timeline') {
      // Next month - ensure proper update with first day of month
    const nextMonth = addMonths(new Date(currentMonth + '-01'), 1);
      const nextMonthStr = format(nextMonth, 'yyyy-MM');
      setCurrentMonth(nextMonthStr);
      setSelectedDate(nextMonthStr + '-01'); // Select first day of next month
    } else if (viewType === 'year') {
      // Next year
      const currentYear = parseInt(currentMonth.split('-')[0]);
      const newYear = (currentYear + 1).toString();
      const newMonth = currentMonth.split('-')[1];
      setCurrentMonth(`${newYear}-${newMonth}`);
    }
  };
  
  // Navigate to today
  const goToToday = () => {
    const today = new Date();
    setSelectedDate(format(today, 'yyyy-MM-dd'));
    setCurrentMonth(format(today, 'yyyy-MM'));
    setCurrentWeekStart(startOfWeek(today));
    setViewType('today');
  };
  
  // Update currentWeekStart when viewType changes to 'week'
  useEffect(() => {
    if (viewType === 'week') {
      setCurrentWeekStart(startOfWeek(new Date(selectedDate)));
    }
  }, [viewType, selectedDate]);
  
  // Enhanced marked dates with multi-dot support
  useEffect(() => {
    const newMarkedDates: MarkedDates = {};
    
    // Group tasks by date and priority
    const tasksByDate: Record<string, Record<string, number>> = {};
    
    tasks.forEach(task => {
      if (!task.dueDate) return;
      
      try {
        const dateString = format(new Date(task.dueDate), 'yyyy-MM-dd');
        
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
  
  // Load tasks for the week/month view
  useEffect(() => {
    // Get start and end of month
    const monthStart = startOfMonth(new Date(currentMonth + '-01'));
    const monthEnd = endOfMonth(monthStart);
    
    // Get all days in the month
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Group tasks by date
    const tasksByDate: {[date: string]: Task[]} = {};
    
    // Initialize all days with empty arrays
    daysInMonth.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      tasksByDate[dateStr] = [];
    });
    
    // Add tasks to their respective dates
    tasks.forEach(task => {
      if (!task.dueDate) return;
      
      try {
        const dateString = format(new Date(task.dueDate), 'yyyy-MM-dd');
        
        // Only include dates within our month range
        if (tasksByDate[dateString]) {
          tasksByDate[dateString].push(task);
        }
      } catch (error) {
        console.error('Error processing task date for week view:', error);
      }
    });
    
    // Sort tasks for each date
    Object.keys(tasksByDate).forEach(date => {
      tasksByDate[date].sort((a, b) => {
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
    });
    
    setWeekTasks(tasksByDate);
  }, [tasks, currentMonth]);
  
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
        key={item?.id || `task-${Math.random().toString(36)}`}
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
            { backgroundColor: 'transparent' }
          ]}
        >
          <MaterialIcons 
            name={
              item.priority === 'high' ? "priority-high" : 
              item.priority === 'medium' ? "drag-handle" : 
              "arrow-downward"
            } 
            size={20} 
            color={priorityColors[item.priority as keyof typeof priorityColors]} 
          />
        </View>
      </TouchableOpacity>
    );
  };
  
  // Get week dates for week view
  const getWeekDates = () => {
    const weekEnd = endOfWeek(currentWeekStart);
    return getDatesBetween({ start: currentWeekStart, end: weekEnd });
  };

  // Change view type with animation
  const changeViewType = (newViewType: CalendarViewType) => {
    // Don't animate if the same view
    if (newViewType === viewType) return;
    
    // Fade out
    Animated.timing(viewTransition, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true
    }).start(() => {
      setViewType(newViewType);
      
      // Fade in
      Animated.timing(viewTransition, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true
      }).start();
    });
  };
  
  // Get hours for timeline view
  const getTimelineHours = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i);
    }
    return hours;
  };
  
  // Get tasks for a specific hour
  const getTasksForHour = (hour: number) => {
    return tasksForSelectedDate.filter(task => {
      if (!task.dueTime) return false;
      try {
        const [taskHour] = task.dueTime.split(':').map(Number);
        return taskHour === hour;
      } catch (error) {
        return false;
      }
    });
  };
  
  // Render task in timeline
  const renderTimelineTask = (task: Task) => {
    const priorityColors = {
      high: theme.colors.error,
      medium: theme.colors.warning,
      low: theme.colors.success
    };
    
    return (
      <TouchableOpacity
        key={task?.id || `task-${Math.random().toString(36)}`}
        style={[
          styles.timelineTask,
          {
            backgroundColor: theme.colors.surface,
            borderLeftColor: priorityColors[task.priority as keyof typeof priorityColors],
            opacity: task.completed ? 0.7 : 1
          }
        ]}
        onPress={() => onTaskPress && onTaskPress(task.id)}
      >
        <Text 
          style={[
          styles.timelineTaskTitle, 
            { 
              color: theme.colors.text,
              textDecorationLine: task.completed ? 'line-through' : 'none' 
            }
          ]}
          numberOfLines={1}
        >
          {task.title}
        </Text>

        <View style={styles.timelineTaskActions}>
          {/* Priority icon */}
          <MaterialIcons 
            name={
              task.priority === 'high' ? "priority-high" : 
              task.priority === 'medium' ? "drag-handle" : 
              "arrow-downward"
            } 
            size={16} 
            color={priorityColors[task.priority as keyof typeof priorityColors]} 
            style={{ marginRight: 8 }}
          />
          
          <TouchableOpacity
            style={[
              styles.timelineCheckbox,
              { borderColor: theme.colors.outline || theme.colors.text + '40' },
              task.completed && { backgroundColor: theme.colors.success }
            ]}
            onPress={() => handleToggleTask(task.id)}
          >
            {task.completed && (
              <MaterialIcons name="done" size={12} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Render calendar based on selected view type
  const renderCalendarView = () => {
    switch(viewType) {
      case 'year':
        return (
          <View style={styles.yearViewContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.yearTitle, { color: theme.colors.text }]}>
                {format(new Date(currentMonth + '-01'), 'yyyy')}
              </Text>
              
              <View style={styles.yearMonthsGrid}>
                {Array.from({ length: 12 }, (_, i) => {
                  const monthDate = new Date(parseInt(currentMonth.split('-')[0]), i, 1);
                  const monthStr = format(monthDate, 'MMM');
                  const formattedMonthDate = format(monthDate, 'yyyy-MM');
                  
                  // Check if this is the current month (today)
                  const isCurrentMonth = i === new Date().getMonth() && 
                                        parseInt(currentMonth.split('-')[0]) === new Date().getFullYear();
                  
                  // Check if this is the selected month in the calendar
                  const isSelectedMonth = formattedMonthDate === currentMonth;
                  
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.yearMonth,
                        isCurrentMonth && { 
                          backgroundColor: theme.colors.primary + '20',
                          borderColor: theme.colors.primary 
                        },
                        isSelectedMonth && !isCurrentMonth && { 
                          backgroundColor: theme.colors.secondary + '20',
                          borderColor: theme.colors.secondary,
                          borderWidth: 2
                        }
                      ]}
                      onPress={() => {
                        setCurrentMonth(format(monthDate, 'yyyy-MM'));
                        changeViewType('month');
                      }}
                    >
                      <Text 
                        style={[
                          styles.yearMonthText, 
                          { 
                            color: isCurrentMonth 
                              ? theme.colors.primary 
                              : isSelectedMonth 
                                ? theme.colors.secondary 
                                : theme.colors.text,
                            fontWeight: (isCurrentMonth || isSelectedMonth) ? 'bold' : 'normal'
                          }
                        ]}
                      >
                        {monthStr}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        );
        
      case 'week':
        return (
          <View style={{flex: 1}}>
            <View style={styles.weekViewContainer}>
              <View style={styles.weekHeader}>
                <Text style={[styles.weekTitle, { color: theme.colors.text }]}>
                  {format(getWeekDates()[0], 'MMM d')} - {format(getWeekDates()[6], 'MMM d, yyyy')}
                </Text>
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.weekDaysContainer}
              >
                {getWeekDates().map((date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const isSelected = dateStr === selectedDate;
                  const dayTasks = weekTasks[dateStr] || [];
                  const hasHighPriority = dayTasks.some(task => task.priority === 'high' && !task.completed);
                  const hasMediumPriority = dayTasks.some(task => task.priority === 'medium' && !task.completed);
                  const hasLowPriority = dayTasks.some(task => task.priority === 'low' && !task.completed);
                  
                  return (
                    <TouchableOpacity 
                      key={dateStr || `day-${Math.random().toString(36)}`}
                      style={[
                        styles.weekDay,
                        isSelected && { borderColor: theme.colors.primary }
                      ]}
                      onPress={() => {
                        setSelectedDate(dateStr);
                      }}
                    >
                      <Text style={[
                        styles.weekDayName, 
                        { 
                          color: isToday(date) ? theme.colors.primary : theme.colors.text,
                          fontWeight: isToday(date) ? 'bold' : '400'
                        }
                      ]}>
                        {format(date, 'EEE')}
                      </Text>
                      
                      <View style={[
                        styles.weekDayNumber, 
                        isToday(date) && { 
                          backgroundColor: theme.colors.primary,
                          borderRadius: 16,
                          width: 32,
                          height: 32,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }
                      ]}>
                        <Text style={[
                          styles.weekDayNumberText,
                          { 
                            color: isToday(date) ? 'white' : theme.colors.text,
                            fontWeight: isSelected ? 'bold' : 'normal'
                          }
                        ]}>
                          {format(date, 'd')}
                        </Text>
                      </View>
                      
                      <View style={styles.weekDayDotsContainer}>
                        {hasHighPriority && (
                          <View style={[styles.weekDayDot, { backgroundColor: theme.colors.error }]} />
                        )}
                        {hasMediumPriority && (
                          <View style={[styles.weekDayDot, { backgroundColor: theme.colors.warning }]} />
                        )}
                        {hasLowPriority && (
                          <View style={[styles.weekDayDot, { backgroundColor: theme.colors.success }]} />
                        )}
                      </View>
                      
                      <Text style={[styles.weekDayTaskCount, { color: theme.colors.text }]}>
                        {dayTasks.length > 0 ? `${dayTasks.length} task${dayTasks.length > 1 ? 's' : ''}` : 'No tasks'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
            
            <View style={[styles.taskListContainer, {marginTop: 0, flex: 1}]}>
              <View style={styles.dateHeaderContainer}>
                <Text style={[styles.dateHeader, { color: theme.colors.text }]}>
                  {formatDisplayDate(selectedDate)}
                </Text>
                
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
                  keyExtractor={(item) => item?.id || `cal-task-${Math.random().toString(36)}`}
                  style={styles.taskList}
                  contentContainerStyle={{ paddingBottom: 80 }}
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
      
      case 'today': {
        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');
        
        // Filter tasks directly instead of using weekTasks
        const todayTasks = tasks.filter(task => {
          if (!task.dueDate) return false;
          
          try {
            const taskDate = new Date(task.dueDate);
            return format(taskDate, 'yyyy-MM-dd') === todayStr;
          } catch (error) {
            console.error('Error comparing task date:', error);
            return false;
          }
        }).sort((a, b) => {
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

        // Debug - log tasks count
        console.log('Today tasks count:', todayTasks.length);
        if (todayTasks.length > 0) {
          console.log('First task:', todayTasks[0].title);
        }

        return (
          <View style={[styles.todayViewContainer, { flex: 1 }]}>
            <View style={styles.todayHeader}>
              <MaterialIcons name="today" size={24} color={theme.colors.primary} />
              <Text style={[styles.todayHeaderText, { color: theme.colors.text }]}>
                Today's Schedule
              </Text>
            </View>
            
            {todayTasks.length > 0 ? (
              <FlatList
                data={todayTasks}
                renderItem={renderTaskItem}
                keyExtractor={(item) => item?.id || `cal-task-${Math.random().toString(36)}`}
                style={[styles.todayTaskList, { flex: 1 }]}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={() => (
                  <View style={styles.todayInfoContainer}>
                    <Text style={[styles.todayDateText, { color: theme.colors.text }]}>
                      {format(today, 'EEEE, MMMM d, yyyy')}
                    </Text>
                    <View style={styles.todayTaskStats}>
                      <View style={styles.todayStatItem}>
                        <Text style={[styles.todayStatNumber, { color: theme.colors.primary }]}>
                          {todayTasks.length}
                        </Text>
                        <Text style={[styles.todayStatLabel, { color: theme.colors.text }]}>
                          Tasks
                        </Text>
                      </View>
                      <View style={styles.todayStatItem}>
                        <Text style={[styles.todayStatNumber, { color: theme.colors.success }]}>
                          {todayTasks.filter(t => t.completed).length}
                        </Text>
                        <Text style={[styles.todayStatLabel, { color: theme.colors.text }]}>
                          Completed
                        </Text>
                      </View>
                      <View style={styles.todayStatItem}>
                        <Text style={[styles.todayStatNumber, { color: theme.colors.error }]}>
                          {todayTasks.filter(t => !t.completed).length}
                        </Text>
                        <Text style={[styles.todayStatLabel, { color: theme.colors.text }]}>
                          Pending
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              />
            ) : (
              <View style={[styles.emptyState, { flex: 1 }]}>
                <Text style={[styles.emptyText, { color: theme.colors.secondary || theme.colors.text + '80' }]}>
                  No tasks scheduled for today
                </Text>
                <TouchableOpacity 
                  style={[styles.addTaskButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => onAddTask && onAddTask(todayStr)}
                >
                  <Text style={styles.addTaskButtonText}>Add Task for Today</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      }
      
      case 'timeline':
        // Get start and end of month for timeline
        const monthStart = startOfMonth(new Date(currentMonth + '-01'));
        const monthEnd = endOfMonth(monthStart);
        
        // Get all days in the month that have tasks
        const daysWithTasks = Object.keys(weekTasks)
          .filter(dateStr => weekTasks[dateStr] && weekTasks[dateStr].length > 0)
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        
        return (
          <View style={[styles.timelineViewContainer, { flex: 1 }]}>
            <Text style={[styles.viewTitle, { color: theme.colors.text }]}>
              {format(new Date(currentMonth + '-01'), 'MMMM yyyy')} Timeline
            </Text>
            
            <ScrollView 
              style={[styles.timelineScroll, { flex: 1 }]} 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={{ paddingBottom: 80 }}
            >
              {daysWithTasks.length > 0 ? (
                daysWithTasks.map((dateStr, index) => {
                  const date = new Date(dateStr);
                  const dayTasks = weekTasks[dateStr] || [];
                  
                  // Skip days with no tasks
                  if (!dayTasks.length) return null;
                  
                  return (
                    <View key={`day-${dateStr}-${index}`} style={{ marginBottom: 16 }}>
                      <TouchableOpacity 
                        style={[
                          styles.timelineDateHeader, 
                          { 
                            backgroundColor: theme.colors.surface, 
                            borderLeftColor: isToday(date) ? theme.colors.primary : 'transparent',
                            borderLeftWidth: isToday(date) ? 4 : 0,
                            paddingLeft: isToday(date) ? 12 : 16
                          }
                        ]}
                        onPress={() => {
                          setSelectedDate(dateStr);
                          changeViewType('month');
                        }}
                      >
                        <Text style={[styles.timelineDateText, { 
                          color: theme.colors.text,
                          fontWeight: isToday(date) ? 'bold' : 'normal'
                        }]}>
                          {format(date, 'EEEE, MMMM d')}
                          {isToday(date) && ' (Today)'}
                        </Text>
                        <Text style={{ color: theme.colors.text, opacity: 0.7, fontSize: 14 }}>
                          {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}
                        </Text>
                      </TouchableOpacity>
                      
                      {/* Group tasks by hour */}
                      {dayTasks
                        .sort((a, b) => {
                          // Sort by time if available
                          if (a.dueTime && b.dueTime) {
                            return a.dueTime.localeCompare(b.dueTime);
                          }
                          // Then by priority
                          const priorityOrder = { high: 0, medium: 1, low: 2 };
                          return (
                            priorityOrder[a.priority as keyof typeof priorityOrder] - 
                            priorityOrder[b.priority as keyof typeof priorityOrder]
                          );
                        })
                        .map(task => {
                          const timeDisplay = task.dueTime 
                            ? format(new Date(`2000-01-01T${task.dueTime}`), 'h:mm a') 
                            : 'All day';
                          
                          return (
                            <View key={`task-${task.id || Math.random().toString(36)}`} style={{ marginLeft: 70 }}>
                              <View style={{ 
                                flexDirection: 'row', 
                                alignItems: 'center',
                                marginBottom: 4 
                              }}>
                                <Text style={{ 
                                  color: theme.colors.text, 
                                  fontSize: 12, 
                                  width: 70, 
                                  opacity: 0.7,
                                  marginLeft: -70
                                }}>
                                  {timeDisplay}
                                </Text>
                                {renderTimelineTask(task)}
                              </View>
                            </View>
                          );
                        })
                      }
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: theme.colors.secondary || theme.colors.text + '80' }]}>
                    No tasks scheduled for {format(new Date(currentMonth + '-01'), 'MMMM yyyy')}
                  </Text>
                  <TouchableOpacity 
                    style={[styles.addTaskButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => onAddTask && onAddTask(format(new Date(), 'yyyy-MM-dd'))}
                  >
                    <Text style={styles.addTaskButtonText}>Add New Task</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        );
      
      case 'month':
      default:
        return (
          <View style={styles.calendarContainer}>
            <View style={styles.calendarWrapper}>
              <Calendar
                key={currentMonth}
                style={styles.calendar}
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
                  textDayHeaderFontSize: 14,
                  'stylesheet.calendar.header': {
                    header: {
                      height: 0,
                      opacity: 0,
                      paddingTop: 0,
                      paddingBottom: 0
                    }
                  },
                  'stylesheet.calendar.main': {
                    week: {
                      marginTop: 2,
                      marginBottom: 2,
                      flexDirection: 'row',
                      justifyContent: 'space-around'
                    }
                  }
                }}
                hideArrows={true}
                renderHeader={() => null}
                markingType={'multi-dot'}
                markedDates={markedDates}
                onDayPress={handleDateSelect}
                enableSwipeMonths={true}
                current={currentMonth + '-01'}
                onMonthChange={(month: any) => {
                  setCurrentMonth(month.dateString.substring(0, 7));
                }}
              />
            </View>
            
            {/* Legend/Color Guide */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.colors.error }]} />
                <Text style={[styles.legendText, { color: theme.colors.text }]}>High</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.colors.warning }]} />
                <Text style={[styles.legendText, { color: theme.colors.text }]}>Medium</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.colors.success }]} />
                <Text style={[styles.legendText, { color: theme.colors.text }]}>Low</Text>
              </View>
            </View>
          </View>
        );
    }
  };
  
  return (
    <View style={styles.container}>
      {viewType !== 'today' && viewType !== 'timeline' && (
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={goToPrevious}>
            <MaterialIcons name="chevron-left" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          
          {/* Press on header text shows year view */}
          <TouchableOpacity onPress={() => {
            if (viewType !== 'year') {
              changeViewType('year');
            } else {
              changeViewType('month');
            }
          }}>
            <Text style={[styles.currentMonthText, { color: theme.colors.text }]}>
              {viewType === 'week' 
                ? `${format(currentWeekStart, 'MMM d')} - ${format(endOfWeek(currentWeekStart), 'MMM d, yyyy')}`
                : format(new Date(currentMonth + '-01'), 'MMMM yyyy')
              }
              {viewType === 'month' && (
                <MaterialIcons 
                  name={isCalendarExpanded ? "expand-less" : "expand-more"} 
                  size={18} 
                  color={theme.colors.text}
                  style={{ marginLeft: 4 }}
                />
              )}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={goToNext}>
            <MaterialIcons name="chevron-right" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      )}
      
      <Animated.View style={{ 
        flex: 1, 
        opacity: viewTransition,
        marginBottom: 0,
      }}>
        {renderCalendarView()}
      </Animated.View>
      
      {viewType !== 'today' && viewType !== 'year' && viewType !== 'week' && viewType !== 'timeline' && (
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
              keyExtractor={(item) => item?.id || `cal-task-${Math.random().toString(36)}`}
              style={styles.taskList}
              contentContainerStyle={{ paddingBottom: 80 }}
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
      )}
      
      <View style={styles.viewSelectorContainer}>
        <TouchableOpacity 
          style={[
            styles.viewButton, 
            viewType === 'month' && { backgroundColor: theme.colors.primary + '30' }
          ]}
          onPress={() => changeViewType('month')}
        >
          <MaterialIcons name="calendar-view-month" size={20} color={viewType === 'month' ? theme.colors.primary : theme.colors.text} />
          <Text style={[
            styles.viewButtonText, 
            { color: viewType === 'month' ? theme.colors.primary : theme.colors.text }
          ]}>
            Month
          </Text>
        </TouchableOpacity>
      
        <TouchableOpacity 
          style={[
            styles.viewButton, 
            viewType === 'week' && { backgroundColor: theme.colors.primary + '30' }
          ]}
          onPress={() => changeViewType('week')}
        >
          <MaterialIcons name="view-week" size={20} color={viewType === 'week' ? theme.colors.primary : theme.colors.text} />
          <Text style={[
            styles.viewButtonText, 
            { color: viewType === 'week' ? theme.colors.primary : theme.colors.text }
          ]}>
            Week
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.viewButton, 
            viewType === 'today' && { backgroundColor: theme.colors.primary + '30' }
          ]}
          onPress={() => changeViewType('today')}
        >
          <MaterialIcons name="today" size={20} color={viewType === 'today' ? theme.colors.primary : theme.colors.text} />
          <Text style={[
            styles.viewButtonText, 
            { color: viewType === 'today' ? theme.colors.primary : theme.colors.text }
          ]}>
            Today
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.viewButton, 
            viewType === 'timeline' && { backgroundColor: theme.colors.primary + '30' }
          ]}
          onPress={() => changeViewType('timeline')}
        >
          <MaterialIcons name="timeline" size={20} color={viewType === 'timeline' ? theme.colors.primary : theme.colors.text} />
          <Text style={[
            styles.viewButtonText, 
            { color: viewType === 'timeline' ? theme.colors.primary : theme.colors.text }
          ]}>
            Timeline
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.viewButton, 
            viewType === 'year' && { backgroundColor: theme.colors.primary + '30' }
          ]}
          onPress={() => changeViewType('year')}
        >
          <MaterialIcons name="calendar-today" size={20} color={viewType === 'year' ? theme.colors.primary : theme.colors.text} />
          <Text style={[
            styles.viewButtonText, 
            { color: viewType === 'year' ? theme.colors.primary : theme.colors.text }
          ]}>
            Year
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 70,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  currentMonthText: {
    fontSize: 18,
    fontWeight: 'bold',
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarContainer: {
    overflow: 'hidden',
    marginBottom: 10,
  },
  calendarWrapper: {
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 4,
  },
  calendar: {
    borderRadius: 10,
    padding: 10,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: 'white',
    marginTop: 8,
    borderRadius: 10,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  viewSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 10,
    zIndex: 999,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  viewButtonText: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  todayViewContainer: {
    padding: 16,
  },
  weekViewContainer: {
    padding: 0,
    marginVertical: 0,
    marginBottom: 0,
  },
  weekHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 0,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  weekDaysContainer: {
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekDay: {
    width: 70,
    height: 90,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    padding: 5,
  },
  weekDayName: {
    fontSize: 14,
    marginBottom: 2,
  },
  weekDayNumber: {
    marginBottom: 0,
  },
  weekDayNumberText: {
    fontSize: 18,
    fontWeight: '500',
  },
  weekDayDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 0,
    marginTop: 2,
  },
  weekDayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  weekDayTaskCount: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  timelineViewContainer: {
    padding: 16,
  },
  viewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  taskListContainer: {
    flex: 1,
  },
  dateHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 0,
    paddingHorizontal: 16,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '500',
  },
  taskList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 80,
    marginTop: 0,
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
    width: 28,
    height: 28,
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
    height: '100%',
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
  addTaskButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  addTaskButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  yearViewContainer: {
    padding: 16,
    flex: 1,
  },
  yearTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  yearMonthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  yearMonth: {
    width: '30%',
    aspectRatio: 1.5,
    margin: '1.5%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  yearMonthText: {
    fontSize: 16,
    fontWeight: '500',
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  todayHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  todayDateText: {
    fontSize: 16,
    marginBottom: 12,
  },
  todayInfoContainer: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  todayTaskStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  todayStatItem: {
    alignItems: 'center',
  },
  todayStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  todayStatLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  todayTaskList: {
    flex: 1,
  },
  timelineScroll: {
    flex: 1,
  },
  timelineDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
    paddingLeft: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  timelineDateText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timelineTask: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
    borderLeftWidth: 3,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  timelineTaskTitle: {
    fontSize: 14,
    flex: 1,
  },
  timelineCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  timelineTaskActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
}); 