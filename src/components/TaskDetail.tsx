import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Button, IconButton, Divider, Chip, Surface, Menu } from 'react-native-paper';
import { formatDistanceToNow, format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { Task, SubTask } from '../types/Task';
import SubTaskList from './SubTaskList';
import InlinePomodoroTimer from './InlinePomodoroTimer';
import { useTaskStore } from '../stores/taskStore';
import { useTheme } from '../theme/ThemeProvider';
import databaseService from '../database/DatabaseService';

interface TaskDetailProps {
  taskId: string;
  onEdit: () => void;
  onDelete: (taskId: string) => void;
  onBack: () => void;
}

export default function TaskDetail({ taskId, onEdit, onDelete, onBack }: TaskDetailProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const { theme, isDark } = useTheme();

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    try {
      // Fetch task details
      const query = `
        SELECT t.*, GROUP_CONCAT(tag.name) as tagNames, GROUP_CONCAT(tag.color) as tagColors
        FROM tasks t
        LEFT JOIN task_tags tt ON t.id = tt.taskId
        LEFT JOIN tags tag ON tt.tagId = tag.id
        WHERE t.id = ?
        GROUP BY t.id
      `;
      const result = await databaseService.executeSql(query, [taskId]);
      
      if (result.rows.length > 0) {
        const fetchedTask = result.rows.item(0);
        
        // Process tags
        let tags = [];
        if (fetchedTask.tagNames) {
          const tagNames = fetchedTask.tagNames.split(',');
          const tagColors = fetchedTask.tagColors.split(',');
          tags = tagNames.map((name: string, index: number) => ({
            name,
            color: tagColors[index]
          }));
        }
        
        setTask({
          ...fetchedTask,
          tags
        });
        
        // Fetch subtasks
        const subTaskQuery = 'SELECT * FROM subtasks WHERE taskId = ? ORDER BY completed ASC, createdAt ASC';
        const subTaskResult = await databaseService.executeSql(subTaskQuery, [taskId]);
        setSubTasks(subTaskResult.rows._array || []);
      }
    } catch (error) {
      console.error('Error loading task details:', error);
    }
  };

  const handlePomodoro = () => {
    setShowPomodoro(!showPomodoro);
    setMenuVisible(false);
  };

  const handleCommentAdd = () => {
    setMenuVisible(false);
    // Add comment functionality
  };

  const handleShare = () => {
    setMenuVisible(false);
    // Share functionality
  };

  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text>Loading task details...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={onBack}
        />
        <View style={styles.actionsContainer}>
          <IconButton
            icon="pencil"
            size={24}
            onPress={onEdit}
          />
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={24}
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            <Menu.Item 
              onPress={handlePomodoro} 
              title="Pomodoro Focus" 
              leadingIcon="timer"
            />
            <Menu.Item 
              onPress={handleCommentAdd} 
              title="Add Comment" 
              leadingIcon="message-outline"
            />
            <Menu.Item 
              onPress={handleShare} 
              title="Share Task" 
              leadingIcon="share-variant"
            />
            <Divider />
            <Menu.Item 
              onPress={() => {
                setMenuVisible(false);
                onDelete(taskId);
              }} 
              title="Delete Task" 
              leadingIcon="delete"
              titleStyle={{ color: 'red' }}
            />
          </Menu>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{task.title}</Text>
          {task.priority && (
            <Surface style={[styles.priorityBadge, getPriorityStyle(task.priority, isDark)]}>
              <Text style={styles.priorityText}>{task.priority.toUpperCase()}</Text>
            </Surface>
          )}
        </View>

        {task.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{task.description}</Text>
          </View>
        )}

        {showPomodoro && (
          <View style={styles.pomodoroContainer}>
            <InlinePomodoroTimer 
              initialTaskId={taskId}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Chip icon={task.completed ? "check" : "clock-outline"}>
              {task.completed ? "Completed" : "Pending"}
            </Chip>
          </View>
          {task.dueDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Deadline:</Text>
              <Text style={styles.detailValue}>
                {format(new Date(task.dueDate), 'PPP')}
                {' '}
                ({formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })})
              </Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created:</Text>
            <Text style={styles.detailValue}>
              {format(new Date(task.createdAt), 'PPP')}
            </Text>
          </View>
        </View>

        {(task as any).tags && (task as any).tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {(task as any).tags.map((tag: { name: string; color?: string }, index: number) => (
                <Chip 
                  key={index} 
                  style={[styles.tag, { backgroundColor: tag.color || '#e0e0e0' }]}
                >
                  {tag.name}
                </Chip>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sub-tasks</Text>
          <SubTaskList
            taskId={taskId}
            subtasks={subTasks}
            onChange={() => loadTask()}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function getPriorityStyle(priority: string, isDark: boolean) {
  switch (priority.toLowerCase()) {
    case 'high':
      return { backgroundColor: isDark ? '#CF6679' : '#D32F2F' };
    case 'medium':
      return { backgroundColor: isDark ? '#FFDF5D' : '#FFC107' };
    case 'low':
      return { backgroundColor: isDark ? '#78939D' : '#78909C' };
    default:
      return { backgroundColor: isDark ? '#78939D' : '#78909C' };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 16,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 2,
  },
  priorityText: {
    color: 'white',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    width: 80,
    fontSize: 16,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    marginRight: 8,
    marginBottom: 8,
  },
  pomodoroContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
}); 