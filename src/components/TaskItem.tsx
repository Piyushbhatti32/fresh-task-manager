import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, Chip, IconButton, ProgressBar } from 'react-native-paper';
import { format } from 'date-fns';
import { useTheme } from '../theme/ThemeProvider';
import { Task } from '../types/Task';
import { MaterialIcons } from '@expo/vector-icons';

interface TaskItemProps {
  task: Task;
  onPress: () => void;
  onStartPomodoro?: (taskId: string) => void;
  onToggle?: () => void;
}

export default function TaskItem({ task, onPress, onStartPomodoro, onToggle }: TaskItemProps) {
  const { theme, isDark } = useTheme();

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return isDark ? '#CF6679' : '#D32F2F';
      case 'medium':
        return isDark ? '#FFDF5D' : '#FFC107';
      case 'low':
        return isDark ? '#78939D' : '#78909C';
      default:
        return isDark ? '#78939D' : '#78909C';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'arrow-upward';
      case 'medium':
        return 'remove';
      case 'low':
        return 'arrow-downward';
      default:
        return 'remove';
    }
  };

  const calculateProgress = () => {
    if (!task.subtasks || task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter(st => st.completed).length;
    return completed / task.subtasks.length;
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <Surface style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.surface,
          borderLeftColor: getPriorityColor(task.priority || ''),
        }
      ]}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <MaterialIcons 
                name={getPriorityIcon(task.priority || '')} 
                size={16} 
                color={getPriorityColor(task.priority || '')}
                style={styles.priorityIcon}
              />
              <Text 
                style={[
                  styles.title, 
                  task.completed && styles.completedTitle
                ]}
                numberOfLines={1}
              >
                {task.title}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <Chip 
                icon={task.completed ? "check-circle" : "clock-outline"}
                compact
                style={[
                  styles.statusChip,
                  { 
                    backgroundColor: task.completed ? 
                      (isDark ? '#4CAF5060' : '#4CAF5040') : 
                      (isDark ? '#FFC10760' : '#FFC10740'),
                    textStyle: { 
                      color: task.completed ? 
                        (isDark ? '#81C784' : '#2E7D32') : 
                        (isDark ? '#FFD54F' : '#F57F17'),
                      fontWeight: '600',
                      fontSize: 13,
                    },
                    marginRight: 8,
                    height: 28,
                    paddingHorizontal: 8,
                  }
                ]}
              >
                {task.completed ? 'Completed' : 'Pending'}
              </Chip>
              {onStartPomodoro && (
                <IconButton 
                  icon="timer-outline" 
                  size={20}
                  onPress={(e) => {
                    e.stopPropagation();
                    onStartPomodoro(task.id);
                  }}
                  style={styles.pomodoroButton}
                />
              )}
              {onToggle && (
                <IconButton 
                  icon={task.completed ? "check-circle" : "circle-outline"}
                  size={20}
                  iconColor={task.completed ? theme.colors.success : theme.colors.text}
                  style={styles.toggleButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    onToggle();
                  }}
                />
              )}
            </View>
          </View>
          
          {task.description && (
            <Text 
              style={styles.description}
              numberOfLines={2}
            >
              {task.description}
            </Text>
          )}
          
          {task.dueDate && (
            <View style={styles.metadataRow}>
              <MaterialIcons 
                name="event" 
                size={14} 
                color={theme.colors.onSurfaceVariant}
                style={styles.metadataIcon}
              />
              <Text style={styles.metadataText}>
                {format(new Date(task.dueDate), 'PPP')}
              </Text>
            </View>
          )}
          
          {task.subtasks && task.subtasks.length > 0 && (
            <View style={styles.progressContainer}>
              <ProgressBar 
                progress={calculateProgress()} 
                color={theme.colors.primary}
                style={styles.progressBar}
              />
              <Text style={styles.progressText}>
                {task.subtasks.filter(st => st.completed).length} / {task.subtasks.length} subtasks
              </Text>
            </View>
          )}
          
          <View style={styles.footer}>
            <View style={styles.tags}>
              {(task as any).tags && (task as any).tags.length > 0 && (task as any).tags.map((tag: { name: string; color: string }, index: number) => (
                <Chip 
                  key={index} 
                  style={[styles.tag, { backgroundColor: tag.color + '20' }]}
                  textStyle={{ color: tag.color, fontSize: 12 }}
                  compact
                >
                  {tag.name}
                </Chip>
              ))}
            </View>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    padding: 12,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  priorityIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  description: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metadataIcon: {
    marginRight: 4,
  },
  metadataText: {
    fontSize: 13,
    opacity: 0.7,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    opacity: 0.7,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  tag: {
    marginRight: 4,
    marginBottom: 4,
    height: 24,
  },
  statusChip: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pomodoroButton: {
    margin: 0,
  },
  toggleButton: {
    margin: 0,
    marginLeft: 4,
  },
}); 