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
  ProgressBar
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import TaskItem from '../components/TaskItem';
import InlinePomodoroTimer from '../components/InlinePomodoroTimer';
import { format } from 'date-fns';
import { RootStackParamList } from '../navigation/types';
import { useDatabase } from '../hooks/useDatabase';
import { Task } from '../types/Task';
import { TaskCard } from '../components/TaskCard';
import { Storage } from '../utils/storage';
import { useTaskStore } from '../store/taskStore';

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

// Stats Card Component
function StatCard({ icon, title, value, color, onPress }: { icon: string, title: string, value: string, color: string, onPress: () => void }) {
  return (
    <TouchableOpacity 
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
    >
      <View style={styles.statIconContainer}>
        <Ionicons name={icon as any} size={28} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </TouchableOpacity>
  );
}

// Task Section Component
function TaskSection({ title, tasks, onTaskPress, onSeeAll }: { title: string, tasks: Task[], onTaskPress: (taskId: string) => void, onSeeAll: () => void }) {
  return (
    <View style={styles.taskSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Button onPress={onSeeAll}>See All</Button>
      </View>
      {tasks.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Paragraph>No tasks in this category</Paragraph>
          </Card.Content>
        </Card>
      ) : (
        <FlatList
          data={tasks}
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
      <Text style={styles.emptyStateText}>No tasks yet!</Text>
      <Text style={styles.emptyStateSubtext}>Create your first task to get started</Text>
    </Animated.View>
  );
}

export const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { colors } = useTheme();
  const { tasks, getOverdueTasks, getTodayTasks } = useDatabase();
  const { refreshTasks, isLoading } = useTaskStore();
  
  // Add focus effect to refresh tasks
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshTasks();
    });

    return unsubscribe;
  }, [navigation, refreshTasks]);

  // Initial tasks fetch
  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

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
  
  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshTasks();
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  }, [refreshTasks]);
  
  // Filter tasks
  const overdueTasks = getOverdueTasks();
  const todayTasks = getTodayTasks();
  
  // Calculate progress with a default value of 0
  const completedTasks = todayTasks.filter(task => task.completed).length;
  const progress = todayTasks.length > 0 ? completedTasks / todayTasks.length : 0;
  
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
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing || isLoading} 
            onRefresh={onRefresh} 
          />
        }
      >
        {/* Header Visual */}
        <Animated.View 
          style={[
            styles.headerVisual, 
            { 
              backgroundColor: colors.primary,
              height: headerHeight
            }
          ]}
        >
          <View style={styles.headerContent}>
            {showWelcome && (
              <Animated.View style={{ opacity: welcomeOpacity }}>
                <View style={styles.welcomeContainer}>
                  <Text style={styles.headerTitle}>
                    {isReturningUser ? 'Welcome Back' : 'Welcome'}{userName ? `, ${userName}` : '!'}
                  </Text>
                  <Text style={styles.headerSubtitle}>
                    {isReturningUser 
                      ? 'Let\'s get things done' 
                      : 'Start organizing your tasks'}
                  </Text>
                </View>
              </Animated.View>
            )}
          </View>
        </Animated.View>
        
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="checkmark-circle"
            title="Completed Today"
            value={completedTasks.toString()}
            color={colors.primary}
            onPress={() => navigation.navigate('Completed')}
          />
          <StatCard
            icon="time"
            title="Focus Time"
            value="25m"
            color={colors.secondary}
            onPress={() => navigation.navigate('Focus')}
          />
          <StatCard
            icon="calendar"
            title="Upcoming"
            value={todayTasks.length.toString()}
            color={colors.tertiary}
            onPress={() => navigation.navigate('Tasks')}
          />
          <StatCard
            icon="warning"
            title="Overdue"
            value={overdueTasks.length.toString()}
            color={colors.error}
            onPress={() => navigation.navigate('Tasks')}
          />
        </View>
        
        {/* Today's Progress */}
        <Card style={styles.section}>
          <Card.Content>
            <View style={styles.progressHeader}>
              <Title style={styles.sectionTitle}>Today's Progress</Title>
              <Text style={styles.progressText}>{completedTasks}/{todayTasks.length} tasks</Text>
            </View>
            <ProgressBar
              progress={progress}
              color={colors.primary}
              style={styles.progressBar}
            />
          </Card.Content>
        </Card>
        
        {/* Today's Tasks */}
        <Card style={styles.section}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Today's Tasks</Title>
            {todayTasks.length === 0 ? (
              <EmptyState />
            ) : (
              <FlatList
                data={todayTasks}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TaskCard
                    task={item}
                    onPress={() => navigateToTask(item.id.toString())}
                    onStartPomodoro={() => handleStartPomodoro(item.id.toString())}
                    onComplete={() => handleTaskComplete(item.id.toString())}
                    style={{ transform: [{ scale: taskScale }] }}
                  />
                )}
                scrollEnabled={false}
              />
            )}
          </Card.Content>
          <Card.Actions>
            <Button
              onPress={() => navigation.navigate('MainTabs')}
              mode="text"
            >
              See All Tasks
            </Button>
          </Card.Actions>
        </Card>
        
        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <Card style={[styles.section, { borderLeftColor: colors.error }]}>
            <Card.Content>
              <Title style={[styles.sectionTitle, { color: colors.error }]}>
                Overdue Tasks ({overdueTasks.length})
              </Title>
              <FlatList
                data={overdueTasks}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TaskCard
                    task={item}
                    onPress={() => navigateToTask(item.id.toString())}
                    onStartPomodoro={() => handleStartPomodoro(item.id.toString())}
                    onComplete={() => handleTaskComplete(item.id.toString())}
                    style={{ transform: [{ scale: taskScale }] }}
                  />
                )}
                scrollEnabled={false}
              />
            </Card.Content>
          </Card>
        )}
      </ScrollView>
      
      {/* Create Task FAB */}
      <FAB
        style={[styles.fab, { backgroundColor: colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate('CreateTask')}
      />
      
      {/* Pomodoro Timer */}
      {showPomodoro && (
        <InlinePomodoroTimer
          initialTaskId={activeTask}
          onMinimize={() => setShowPomodoro(false)}
        />
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
  headerVisual: {
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    overflow: 'hidden',
  },
  headerContent: {
    alignItems: 'center',
    width: '100%',
    padding: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 0,
  },
  section: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  priorityIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    width: '48%',
    borderLeftWidth: 4,
  },
  statIconContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  taskSection: {
    padding: 16,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyCard: {
    padding: 8,
    marginBottom: 8,
  },
  welcomeContainer: {
    position: 'relative',
    width: '100%',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
});

export default HomeScreen; 