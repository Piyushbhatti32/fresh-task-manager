import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, Chip, IconButton } from 'react-native-paper';
import { format } from 'date-fns';
import { useTheme } from '../theme/ThemeProvider';
import { Task } from '../types/Task';

interface TaskItemProps {
  task: Task;
  onPress: () => void;
  onStartPomodoro?: (taskId: string) => void;
}

export default function TaskItem({ task, onPress, onStartPomodoro }: TaskItemProps) {
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
            <Text 
              style={[
                styles.title, 
                task.completed && styles.completedTitle
              ]}
              numberOfLines={1}
            >
              {task.title}
            </Text>
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
          </View>
          
          {task.dueDate && (
            <Text style={styles.dueDate}>
              {format(new Date(task.dueDate), 'PPP')}
            </Text>
          )}
          
          <View style={styles.footer}>
            <View style={styles.tags}>
              {(task as any).tags && (task as any).tags.length > 0 && (task as any).tags.map((tag: { name: string; color: string }, index: number) => (
                <Chip 
                  key={index} 
                  style={[styles.tag, { backgroundColor: tag.color + '30' }]}
                  textStyle={{ color: tag.color }}
                  compact
                >
                  {tag.name}
                </Chip>
              ))}
            </View>
            
            <Chip 
              icon={task.completed ? "check" : "clock-outline"}
              compact
              style={styles.statusChip}
            >
              {task.completed ? 'Completed' : 'Pending'}
            </Chip>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    borderLeftWidth: 4,
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  dueDate: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
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
  },
  statusChip: {
    marginLeft: 4,
  },
  pomodoroButton: {
    margin: 0,
  },
}); 