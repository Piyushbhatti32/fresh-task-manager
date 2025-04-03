import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useTaskStore } from '../stores/taskStore';
import TaskForm from '../components/TaskForm';
import { Task } from '../types/Task';
import { Portal, ActivityIndicator, Snackbar } from 'react-native-paper';

type EditTaskScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type EditTaskScreenRouteProp = RouteProp<RootStackParamList, 'EditTask'>;

export default function EditTaskScreen() {
  const navigation = useNavigation<EditTaskScreenNavigationProp>();
  const route = useRoute<EditTaskScreenRouteProp>();
  const { taskId } = route.params;
  const { tasks, updateTask } = useTaskStore();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);

  useEffect(() => {
    const loadTask = async () => {
      try {
        if (!taskId || typeof taskId !== 'string') {
          console.error('Invalid task ID:', taskId);
          setError('Invalid task ID');
          setShowSnackbar(true);
          return;
        }

        const currentTask = tasks.find(t => t.id === taskId);
        if (currentTask) {
          console.log('EditTaskScreen - Loading task:', currentTask);
          setTask(currentTask);
        } else {
          console.error('Task not found with ID:', taskId);
          setError('Task not found');
          setShowSnackbar(true);
        }
      } catch (err) {
        console.error('Error loading task:', err);
        setError('Failed to load task');
        setShowSnackbar(true);
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [taskId, tasks]);

  const handleSave = async (updatedTask: Task) => {
    try {
      if (!updatedTask.id || typeof updatedTask.id !== 'string') {
        throw new Error('Invalid task ID');
      }

      setLoading(true);
      console.log('EditTaskScreen - Saving task:', updatedTask);
      await updateTask({
        ...updatedTask,
        id: taskId, // Ensure we use the original taskId
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error updating task:', error);
      setError(error instanceof Error ? error.message : 'Failed to update task');
      setShowSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!task) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Portal>
        <TaskForm
          task={task}
          isVisible={true}
          onClose={() => navigation.goBack()}
          onSave={handleSave}
        />
      </Portal>
      <Snackbar
        visible={showSnackbar}
        onDismiss={() => setShowSnackbar(false)}
        duration={3000}
        action={{
          label: 'Close',
          onPress: () => setShowSnackbar(false),
        }}>
        {error}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});