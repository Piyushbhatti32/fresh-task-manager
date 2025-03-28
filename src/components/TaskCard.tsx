import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, IconButton, Badge } from 'react-native-paper';
import { Task } from '../types/Task';
import { format } from 'date-fns';
import { useTheme } from '../theme/ThemeProvider';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onStartPomodoro?: () => void;
}

export const TaskCard = ({ task, onPress, onStartPomodoro }: TaskCardProps) => {
  const { theme } = useTheme();
  
  // Priority colors
  const priorityColors = {
    high: theme.colors.error,
    medium: theme.colors.warning,
    low: theme.colors.success
  };
  
  // Format date if available
  const formattedDate = task.dueDate 
    ? format(new Date(task.dueDate), 'MMM d, yyyy')
    : 'No due date';
  
  return (
    <Card 
      style={[
        styles.card, 
        { 
          borderLeftColor: task.priority ? priorityColors[task.priority] : theme.colors.outline,
          backgroundColor: theme.colors.surface
        }
      ]}
      onPress={onPress}
    >
      <Card.Content style={styles.content}>
        <View style={styles.taskInfo}>
          <Text 
            style={[
              styles.title,
              task.completed && styles.completedText,
              { color: theme.colors.text }
            ]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          
          {task.description ? (
            <Text 
              style={[
                styles.description,
                task.completed && styles.completedText,
                { color: theme.colors.secondary }
              ]}
              numberOfLines={1}
            >
              {task.description}
            </Text>
          ) : null}
          
          <View style={styles.metaContainer}>
            <Text 
              style={[
                styles.date,
                { color: theme.colors.secondary }
              ]}
            >
              {formattedDate}
            </Text>
            
            {task.priority && (
              <Badge 
                style={[
                  styles.priority,
                  { backgroundColor: priorityColors[task.priority] }
                ]}
              >
                {task.priority}
              </Badge>
            )}
          </View>
        </View>
        
        {onStartPomodoro && (
          <IconButton
            icon="timer"
            size={20}
            onPress={(e) => {
              e.stopPropagation();
              if (onStartPomodoro) onStartPomodoro();
            }}
            style={styles.actionButton}
          />
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  taskInfo: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    marginRight: 8,
  },
  priority: {
    fontSize: 10,
    height: 20,
  },
  actionButton: {
    margin: 0,
  },
}); 