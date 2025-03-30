import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { appTheme } from '../theme/AppTheme';
import { useTaskStore } from '../stores/taskStore';
import TaskForm from '../components/TaskForm';
import { Task } from '../types/Task';

type CreateTaskScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CreateTaskScreen() {
  const navigation = useNavigation<CreateTaskScreenNavigationProp>();
  const { addTask, fetchTasks } = useTaskStore();
  const [isFormVisible, setIsFormVisible] = useState(true);

  const handleSave = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Ensure all required fields are present
      const validatedTaskData = {
        ...taskData,
        title: taskData.title || '',
        description: taskData.description || '',
        priority: taskData.priority || 'low',
        completed: taskData.completed || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addTask(validatedTaskData);
      // Wait for tasks to be fetched before navigating back
      await fetchTasks();
      // Add a small delay to ensure the store is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use navigation.pop() instead of goBack()
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Home');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: appTheme.colors.background }]}>
      <TaskForm
        isVisible={isFormVisible}
        onClose={() => navigation.goBack()}
        onSave={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 