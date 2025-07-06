import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import { SubTask } from '../types/Task';
import { useTaskStore } from '../stores/taskStore';
import { useTheme } from '../theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { generateId } from '../utils/generateId';
import { useNotification } from '../contexts/NotificationContext';

interface SubTaskListProps {
  taskId: string;
  subtasks?: SubTask[];
  progress?: number;
  onChange?: (subtasks: SubTask[]) => void;
  isNewTask?: boolean;
}

const SubTaskList: React.FC<SubTaskListProps> = ({ 
  taskId, 
  subtasks = [], 
  progress = 0,
  onChange,
  isNewTask = false
}) => {
  const { addSubtask, toggleSubtask, deleteSubtask } = useTaskStore();
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [localSubtasks, setLocalSubtasks] = useState<SubTask[]>(subtasks);

  // Update local subtasks when props change
  useEffect(() => {
    setLocalSubtasks(subtasks);
  }, [subtasks]);

  // Helper function to calculate progress
  const calculateProgress = (tasks: SubTask[]) => {
    if (tasks.length === 0) return 0;
    const completedCount = tasks.filter(st => st.completed).length;
    return Math.round((completedCount / tasks.length) * 100);
  };

  const handleAddSubtask = () => {
    console.log("Add subtask button pressed");
    console.log("Title:", newSubtaskTitle);
    console.log("Is new task:", isNewTask || taskId === 'new');
    
    if (!newSubtaskTitle.trim()) {
      console.log("Empty title, not adding subtask");
      return;
    }

    // For new tasks, manage subtasks locally
    if (isNewTask || taskId === 'new') {
      console.log("Adding subtask locally");
      const newSubtask: SubTask = {
        id: generateId(),
        title: newSubtaskTitle.trim(),
        completed: false,
        createdAt: new Date()
      };
      
      const updatedSubtasks = [...localSubtasks, newSubtask];
      console.log("Updated subtasks:", updatedSubtasks);
      setLocalSubtasks(updatedSubtasks);
      
      // Notify parent component of the change
      if (onChange) {
        console.log("Notifying parent of change");
        onChange(updatedSubtasks);
      }
      
      // Show success notification
      showNotification({
        type: 'success',
        title: 'Subtask Added',
        message: `"${newSubtaskTitle.trim()}" has been added to the checklist.`
      });
    } else {
      // For existing tasks, use the store
      console.log("Adding subtask to store");
      addSubtask(taskId, newSubtaskTitle.trim()).then((updatedTask) => {
        if (updatedTask) {
          showNotification({
            type: 'success',
            title: 'Subtask Added',
            message: `"${newSubtaskTitle.trim()}" has been added to the checklist.`
          });
        }
      });
    }
    
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (subtaskId: string) => {
    // Find the subtask to get its title
    const subtask = (isNewTask || taskId === 'new')
      ? localSubtasks.find(st => st.id === subtaskId)
      : displaySubtasks.find(st => st.id === subtaskId);
    
    if (!subtask) return;
    
    const willBeCompleted = !subtask.completed;
    
    // For new tasks, toggle locally
    if (isNewTask || taskId === 'new') {
      const updatedSubtasks = localSubtasks.map(subtask => 
        subtask.id === subtaskId 
          ? { ...subtask, completed: !subtask.completed, updatedAt: new Date() }
          : subtask
      );
      
      setLocalSubtasks(updatedSubtasks);
      
      // Notify parent component of the change
      if (onChange) {
        onChange(updatedSubtasks);
      }
      
      // Show status notification
      showNotification({
        type: willBeCompleted ? 'success' : 'info',
        title: willBeCompleted ? 'Subtask Completed' : 'Subtask Pending',
        message: `"${subtask.title}" has been marked as ${willBeCompleted ? 'completed' : 'pending'}.`
      });
    } else {
      // For existing tasks, use the store
      toggleSubtask(taskId, subtaskId).then((updatedTask) => {
        if (updatedTask) {
          showNotification({
            type: willBeCompleted ? 'success' : 'info',
            title: willBeCompleted ? 'Subtask Completed' : 'Subtask Pending',
            message: `"${subtask.title}" has been marked as ${willBeCompleted ? 'completed' : 'pending'}.`
          });
        }
      });
    }
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    // Find the subtask to get its title
    const subtask = (isNewTask || taskId === 'new')
      ? localSubtasks.find(st => st.id === subtaskId)
      : displaySubtasks.find(st => st.id === subtaskId);
    
    if (!subtask) return;
    
    const subtaskTitle = subtask.title;
    
    if (isNewTask || taskId === 'new') {
      // For new tasks, delete locally
      Alert.alert(
        'Delete Subtask',
        `Are you sure you want to delete "${subtaskTitle}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            onPress: () => {
              const updatedSubtasks = localSubtasks.filter(st => st.id !== subtaskId);
              setLocalSubtasks(updatedSubtasks);
              
              // Notify parent component of the change
              if (onChange) {
                onChange(updatedSubtasks);
              }
              
              // Show deletion success notification
              showNotification({
                type: 'success',
                title: 'Subtask Deleted',
                message: `"${subtaskTitle}" has been removed from the checklist.`
              });
            },
            style: 'destructive'
          }
        ]
      );
    } else {
      // For existing tasks, use the store
      Alert.alert(
        'Delete Subtask',
        `Are you sure you want to delete "${subtaskTitle}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            onPress: () => {
              deleteSubtask(taskId, subtaskId).then((updatedTask) => {
                if (updatedTask) {
                  // Show deletion success notification
                  showNotification({
                    type: 'success',
                    title: 'Subtask Deleted',
                    message: `"${subtaskTitle}" has been removed from the checklist.`
                  });
                }
              });
            },
            style: 'destructive'
          }
        ]
      );
    }
  };

  // Display either local subtasks or props subtasks based on whether this is a new task
  const displaySubtasks = isNewTask || taskId === 'new' ? localSubtasks : subtasks;
  const displayProgress = isNewTask || taskId === 'new' 
    ? calculateProgress(localSubtasks) 
    : progress;
    
  // Render a single subtask item
  const renderSubtaskItem = (item: SubTask) => (
    <View 
      key={item.id} 
      style={[styles.subtaskItem, { borderBottomColor: theme.colors.outline || theme.colors.text + '40' }]}
    >
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => handleToggleSubtask(item.id)}
      >
        {item.completed ? (
          <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
        ) : (
          <Ionicons name="ellipse-outline" size={20} color={theme.colors.text} />
        )}
      </TouchableOpacity>
      
      <Text
        style={[
          styles.subtaskTitle,
          { color: theme.colors.text },
          item.completed && styles.completedSubtask
        ]}
      >
        {item.title}
      </Text>
      
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDeleteSubtask(item.id)}
      >
        <Ionicons name="close-circle-outline" size={20} color={theme.colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Checklist
        </Text>
        {displaySubtasks.length > 0 && (
          <View style={styles.progressContainer}>
            <Text style={[styles.progressText, { color: theme.colors.text }]}>
              {displayProgress}%
            </Text>
            <View style={[styles.progressBar, { backgroundColor: theme.colors.outline || theme.colors.text + '40' }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: theme.colors.primary,
                    width: `${displayProgress}%` 
                  }
                ]} 
              />
            </View>
          </View>
        )}
      </View>
      
      {displaySubtasks.length > 0 ? (
        <View style={styles.subtaskList}>
          {displaySubtasks.map(renderSubtaskItem)}
        </View>
      ) : (
        <Text style={[styles.emptyText, { color: theme.colors.text + '60' }]}>
          No subtasks yet. Add one below.
        </Text>
      )}
      
      <View style={[styles.addSubtaskContainer, { borderColor: theme.colors.outline || theme.colors.text + '40' }]}>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.outline || theme.colors.text + '40' }]}
          placeholder="Add a subtask..."
          placeholderTextColor={theme.colors.text + '60'}
          value={newSubtaskTitle}
          onChangeText={setNewSubtaskTitle}
          onSubmitEditing={handleAddSubtask}
        />
        {/* Make the add button always enabled and more visible */}
        <TouchableOpacity
          style={[
            styles.addButton, 
            { backgroundColor: theme.colors.primary }
          ]}
          onPress={handleAddSubtask}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    marginRight: 8,
    fontSize: 14,
  },
  progressBar: {
    height: 6,
    width: 100,
    borderRadius: 3,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  subtaskList: {
    marginBottom: 10,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  checkbox: {
    marginRight: 10,
  },
  subtaskTitle: {
    flex: 1,
    fontSize: 16,
  },
  completedSubtask: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  deleteButton: {
    paddingHorizontal: 5,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 15,
    fontStyle: 'italic',
  },
  addSubtaskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 15,
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 5,
    marginRight: 10,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 2px rgba(0, 0, 0, 0.3)',
      },
      default: {
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
      }
    })
  },
});

export default SubTaskList; 