import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Card, Text, Checkbox, Badge } from 'react-native-paper';
import { format } from 'date-fns';
import { Task } from '../types/Task';
import useTaskStore from '../stores/taskStore';

interface TaskListItemProps {
  task: Task;
  onPress: () => void;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return '#DC3545';
    case 'medium':
      return '#FFC107';
    case 'low':
      return '#28A745';
    default:
      return '#6C757D';
  }
};

const TaskListItem = ({ task, onPress }: TaskListItemProps) => {
  const { updateTask } = useTaskStore();

  const handleToggleComplete = () => {
    updateTask({
      ...task,
      completed: !task.completed
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.checkboxContainer}>
          <Checkbox
            status={task.completed ? 'checked' : 'unchecked'}
            onPress={handleToggleComplete}
          />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <Text 
              style={[
                styles.title, 
                task.completed && styles.completedText
              ]}
              numberOfLines={1}
            >
              {task.title}
            </Text>
            <Badge 
              size={12} 
              style={[
                styles.priorityBadge, 
                { backgroundColor: getPriorityColor(task.priority || '') }
              ]} 
            />
          </View>
          
          {task.description ? (
            <Text 
              style={[
                styles.description, 
                task.completed && styles.completedText
              ]}
              numberOfLines={2}
            >
              {task.description}
            </Text>
          ) : null}
          
          {task.dueDate ? (
            <Text style={styles.dueDate}>
              Due: {formatDate(task.dueDate.toString())}
            </Text>
          ) : null}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
  },
  checkboxContainer: {
    marginRight: 10,
    alignSelf: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  dueDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  priorityBadge: {
    marginLeft: 8,
  },
});

export default TaskListItem; 