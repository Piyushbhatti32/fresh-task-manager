import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  RefreshControl,
  FlatList,
  Dimensions,
  Animated
} from 'react-native';
import { 
  Text, 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Surface,
  Divider,
  Avatar,
  IconButton,
  FAB,
  useTheme,
  ProgressBar,
  Portal,
  Modal
} from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import TaskItem from '../components/TaskItem';
import InlinePomodoroTimer from '../components/InlinePomodoroTimer';
import PomodoroTimer from '../components/PomodoroTimer';
import { format } from 'date-fns';
import { RootStackParamList } from '../navigation/types';
import { useDatabase } from '../hooks/useDatabase';
import { Task } from '../types/Task';
import { TaskCard } from '../components/TaskCard';
import { Storage } from '../utils/storage';
import { useTaskStore } from '../stores/taskStore';

// Define components for the HomeScreen
type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

// Priority Icon Component
function PriorityIcon({ priority }: { priority: Task['priority'] }) {
  const colors = {
    high: '#D32F2F',
    medium: '#FFC107',
    low: '#4CAF50',
  };
  
  return (
    <View style={[styles.priorityIcon, { backgroundColor: colors[priority as keyof typeof colors] }]}>
      <Ionicons 
        name={
          priority === 'high' ? 'alert-circle' : 
          priority === 'medium' ? 'warning-outline' : 'information-circle-outline'
        } 
        color="white" 
        size={16} 
      />
    </View>
  );
}

// Quick Action Button Component
function QuickActionButton({ icon, label, onPress, color }: { icon: string, label: string, onPress: () => void, color: string }) {
  const { colors: themeColors } = useTheme();
  
  return (
    <TouchableOpacity 
      style={[styles.quickActionButton, { backgroundColor: themeColors.surface }]} 
      onPress={onPress}
    >
      <MaterialIcons name={icon as any} size={24} color={color} />
      <Text style={[styles.quickActionLabel, { color: themeColors.onSurface }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// Stats Card Component
function StatCard({ icon, title, value, color, onPress }: { icon: string, title: string, value: string, color: string, onPress: () => void }) {
  const { colors: themeColors } = useTheme();
  
  return (
    <TouchableOpacity 
      style={[styles.statCard, { backgroundColor: themeColors.surface }]}
      onPress={onPress}
    >
      <View style={[styles.statIconContainer, { backgroundColor: color }]}>
        <MaterialIcons name={icon as any} size={24} color={themeColors.surface} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statTitle, { color: themeColors.onSurface }]}>{title}</Text>
        <Text style={[styles.statValue, { color: themeColors.onSurface }]}>{value}</Text>
      </View>
    </TouchableOpacity>
  );
}

// Task Section Component
function TaskSection({ title, tasks, onTaskPress, onSeeAll, color }: { 
  title: string, 
  tasks: Task[], 
  onTaskPress: (taskId: string) => void, 
  onSeeAll: () => void,
  color: string 
}) {
  // Show only first 3 tasks
  const displayedTasks = tasks.slice(0, 3);

  return (
    <View style={styles.taskSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <View style={[styles.sectionTitleIndicator, { backgroundColor: color }]} />
          <Text style={[styles.sectionTitle, { color: color }]}>{title}</Text>
        </View>
        {tasks.length > 3 && (
          <Button 
            mode="text" 
            onPress={onSeeAll}
            textColor={color}
          >
            See All ({tasks.length})
          </Button>
        )}
      </View>
      {displayedTasks.length === 0 ? (
        <Card style={[styles.emptyCard, { borderColor: color + '40' }]}>
          <Card.Content style={styles.emptyCardContent}>
            <MaterialIcons name="assignment" size={32} color={color + '80'} />
            <Paragraph style={{ color: color + '90' }}>No tasks in this category</Paragraph>
          </Card.Content>
        </Card>
      ) : (
        <FlatList
          data={displayedTasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TaskItem 
              key={item.id} 
              task={item} 
              onPress={() => onTaskPress(item.id.toString())} 
            />
          )}
          scrollEnabled={false}
        />
      )}
    </View>
  );
}

// Empty State Component
function EmptyState() {
  const { colors } = useTheme();
  const scale = React.useRef(new Animated.Value(0.8)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.emptyState, { opacity, transform: [{ scale }] }]}>
      <MaterialCommunityIcons 
        name="checkbox-blank-outline" 
        size={64} 
        color={colors.primary} 
      />
      <Text style={[styles.emptyStateText, { color: colors.primary }]}>No tasks yet!</Text>
      <Text style={[styles.emptyStateSubtext, { color: colors.onSurface }]}>Create your first task to get started</Text>
    </Animated.View>
  );
}

export const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { colors, dark: isDark } = useTheme();
  const { tasks, isLoading, fetchTasks } = useTaskStore();
  const [activeTask, setActiveTask] = useState<string | undefined>(undefined);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const welcomeOpacity = React.useRef(new Animated.Value(1)).current;
  const headerHeight = React.useRef(new Animated.Value(160)).current;
  const taskScale = React.useRef(new Animated.Value(1)).current;
  const progressAnimation = React.useRef(new Animated.Value(0)).current;

  // Fetch tasks when component mounts
  useEffect(() => {
    loadTasks();
  }, []);

  // Use useFocusEffect to refresh tasks when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('HomeScreen focused - refreshing tasks');
      loadTasks();
      return () => {}; // Cleanup function
    }, [])
  );

  // Function to load tasks
  const loadTasks = async () => {
    try {
      console.log('Loading tasks in HomeScreen');
      await fetchTasks();
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  // Handle pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadTasks();
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);
  
  // Check if user is returning and get user info
  useEffect(() => {
    const checkUserInfo = async () => {
      const hasLoggedInBefore = await Storage.getItem('has_logged_in_before');
      const storedName = await Storage.getItem('user_name');
      setIsReturningUser(!!hasLoggedInBefore);
      setUserName(storedName);
      
      if (!hasLoggedInBefore) {
        await Storage.setItem('has_logged_in_before', 'true');
      }
    };
    
    checkUserInfo();
  }, []);

  // Get today's tasks
  const todayTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    const taskDate = new Date(task.dueDate);
    const today = new Date();
    return taskDate.toDateString() === today.toDateString();
  });

  // Get overdue tasks
  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate || task.completed) return false;
    const taskDate = new Date(task.dueDate);
    const today = new Date();
    return taskDate < today;
  });

  // Get upcoming tasks
  const upcomingTasks = tasks.filter(task => {
    if (!task.dueDate || task.completed) return false;
    const taskDate = new Date(task.dueDate);
    const today = new Date();
    return taskDate > today;
  });
  
  // Get all completed tasks
  const allCompletedTasks = tasks.filter(task => task.completed);
  
  // Get today's completed tasks (for progress bar)
  const todayCompletedCount = todayTasks.filter(task => task.completed).length;
  
  // Calculate progress with a default value of 0
  const progress = todayTasks.length > 0 ? todayCompletedCount / todayTasks.length : 0;
  
  // Auto-hide welcome section after 2 seconds
  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => {
        hideWelcome();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

  const hideWelcome = () => {
    Animated.parallel([
      Animated.timing(welcomeOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(headerHeight, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      })
    ]).start(() => {
      setShowWelcome(false);
    });
  };
  
  // Update progress animation when tasks change
  useEffect(() => {
    const validProgress = isNaN(progress) ? 0 : progress;
    Animated.spring(progressAnimation, {
      toValue: validProgress,
      useNativeDriver: false,
    }).start();
  }, [progress]);
  
  // Navigate to task screen
  const navigateToTask = (taskId: string) => {
    navigation.navigate('EditTask', { taskId });
  };
  
  // Handle start pomodoro
  const handleStartPomodoro = (taskId: string) => {
    setActiveTask(taskId);
    setShowPomodoro(true);
  };
  
  // Get priority color
  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.errorContainer;
      case 'low':
        return colors.primary;
      default:
        return colors.surface;
    }
  };
  
  const handleTaskComplete = (taskId: string) => {
    Animated.sequence([
      Animated.timing(taskScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(taskScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };
  
  // Filter tasks with null checks
  const pendingTasks = tasks?.filter(task => !task.completed) || [];
  const highPriorityTasks = tasks?.filter(task => task.priority === 'high' && !task.completed) || [];
  const dueTodayTasks = tasks?.filter(task => {
    if (!task.dueDate || task.completed) return false;
    const today = new Date();
    const taskDate = new Date(task.dueDate);
    return taskDate.getDate() === today.getDate() && 
           taskDate.getMonth() === today.getMonth() && 
           taskDate.getFullYear() === today.getFullYear();
  }) || [];

  // Fix navigation to Tasks
  const navigateToTasks = () => {
    // @ts-ignore - Ignore the type error for now as this navigation pattern works at runtime
    navigation.navigate('MainTabs', { screen: 'Tasks' });
  };
  
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Section */}
        <Surface style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>
                  {userName ? `Hello, ${userName}!` : 'Welcome back!'}
                </Text>
                <Text style={styles.date}>
                  {format(new Date(), 'EEEE, MMMM d')}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.profileButton}
                onPress={() => navigation.navigate('Settings')}
              >
                <Avatar.Text 
                  size={40} 
                  label={userName ? userName.substring(0, 2).toUpperCase() : 'U'} 
                />
              </TouchableOpacity>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsRow}>
              <Surface style={[styles.statsCard, { backgroundColor: colors.primaryContainer }]}>
                <View style={styles.statsContent}>
                  <Text 
                    style={[
                      styles.statsLabel, 
                      { 
                        color: colors.onPrimaryContainer,
                        whiteSpace: 'nowrap',  // Keep text in one line
                      }
                    ]}
                    numberOfLines={1}  // Force single line
                  >
                    Total Tasks
                  </Text>
                  <Text style={[styles.statsValue, { color: colors.onPrimaryContainer }]}>
                    {(tasks?.length || 0).toString()}
                  </Text>
                </View>
              </Surface>

              <Surface style={[styles.statsCard, { backgroundColor: colors.primaryContainer }]}>
                <View style={styles.statsContent}>
                  <Text 
                    style={[
                      styles.statsLabel, 
                      { 
                        color: colors.onPrimaryContainer,
                        whiteSpace: 'nowrap',  // Keep text in one line
                      }
                    ]}
                    numberOfLines={1}  // Force single line
                  >
                    Completed
                  </Text>
                  <Text style={[styles.statsValue, { color: colors.onPrimaryContainer }]}>
                    {(allCompletedTasks.length || 0).toString()}
                  </Text>
                </View>
              </Surface>

              <Surface style={[styles.statsCard, { backgroundColor: colors.primaryContainer }]}>
                <View style={styles.statsContent}>
                  <Text 
                    style={[
                      styles.statsLabel, 
                      { 
                        color: colors.onPrimaryContainer,
                        whiteSpace: 'nowrap',  // Keep text in one line
                      }
                    ]}
                    numberOfLines={1}  // Force single line
                  >
                    Due Today
                  </Text>
                  <Text style={[styles.statsValue, { color: colors.onPrimaryContainer }]}>
                    {(dueTodayTasks?.length || 0).toString()}
                  </Text>
                </View>
              </Surface>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <QuickActionButton
                icon="add-task"
                label="New Task"
                color={colors.primary}
                onPress={() => navigation.navigate('CreateTask')}
              />
              <QuickActionButton
                icon="timer"
                label="Pomodoro"
                color={colors.primary}
                onPress={() => setShowPomodoro(true)}
              />
              <QuickActionButton
                icon="calendar-today"
                label="Calendar"
                color={colors.primary}
                onPress={() => navigation.navigate('Calendar')}
              />
            </View>
          </View>
        </Surface>

        {/* Task Sections */}
        <View style={styles.content}>
          {highPriorityTasks.length > 0 && (
            <TaskSection
              title="High Priority"
              tasks={highPriorityTasks}
              onTaskPress={navigateToTask}
              onSeeAll={navigateToTasks}
              color={colors.error}
            />
          )}

          {dueTodayTasks.length > 0 && (
            <TaskSection
              title="Due Today"
              tasks={dueTodayTasks}
              onTaskPress={navigateToTask}
              onSeeAll={navigateToTasks}
              color={colors.primary}
            />
          )}

          {pendingTasks.length > 0 && (
            <TaskSection
              title="Pending Tasks"
              tasks={pendingTasks}
              onTaskPress={navigateToTask}
              onSeeAll={navigateToTasks}
              color={colors.primary}
            />
          )}

          {allCompletedTasks.length > 0 && (
            <TaskSection
              title="Completed"
              tasks={allCompletedTasks}
              onTaskPress={navigateToTask}
              onSeeAll={navigateToTasks}
              color={colors.success}
            />
          )}
        </View>
      </ScrollView>
      
      {/* Pomodoro Timer */}
      {showPomodoro && (
        <View style={styles.pomodoroOverlay}>
          <PomodoroTimer
            initialTaskId={activeTask}
            onClose={() => setShowPomodoro(false)}
            showCloseButton={true}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    elevation: 4,
  },
  headerContent: {
    gap: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 16,
    opacity: 0.7,
  },
  profileButton: {
    padding: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statsCard: {
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: 100, // Ensure minimum width
  },
  statsContent: {
    alignItems: 'flex-start',
  },
  statsLabel: {
    fontSize: 14, // Slightly reduced font size if needed
    fontWeight: '500',
    marginBottom: 8,
    width: '100%', // Ensure text takes full width
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    padding: 16,
    gap: 24,
  },
  taskSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitleIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 12,
  },
  emptyCardContent: {
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  modalContent: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    elevation: 4,
  },
  pomodoroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 8,
  },
});

export default HomeScreen; 