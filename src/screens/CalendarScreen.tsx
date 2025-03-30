import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, Modal, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import CalendarView from '../components/CalendarView';
import TaskForm from '../components/TaskForm';
import TaskDetail from '../components/TaskDetail';
import { useTaskStore } from '../stores/taskStore';

export default function CalendarScreen() {
  const navigation = useNavigation();
  const theme = useTheme();
  const { createTask, toggleTaskCompletion, fetchTasks } = useTaskStore();
  
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  // Handle task completion toggle
  const handleToggleCompletion = async (taskId: string) => {
    console.log('CalendarScreen - handleToggleCompletion called with taskId:', taskId);
    try {
      // Call the toggleTaskCompletion function directly from the store
      const result = await toggleTaskCompletion(taskId);
      console.log('CalendarScreen - toggleTaskCompletion result:', result);
      
      // Refresh tasks to update the UI
      if (result) {
        await fetchTasks();
      }
    } catch (error) {
      console.error('CalendarScreen - Error toggling task completion:', error);
    }
  };
  
  // Handle add task for a specific date
  const handleAddTask = (date: string) => {
    setSelectedDate(date);
    setShowTaskForm(true);
  };
  
  // Handle saving a new task
  const handleSaveTask = async (taskData: any) => {
    // If we have a selected date, use it for the task
    if (selectedDate) {
      taskData.dueDate = new Date(selectedDate);
    }
    
    await createTask(taskData);
    setShowTaskForm(false);
  };
  
  return (
    <View style={styles.container}>
      <CalendarView 
        onTaskPress={setSelectedTaskId}
        onToggleCompletion={handleToggleCompletion}
        onAddTask={handleAddTask}
      />
      
      <Portal>
        {/* Task detail modal */}
        {selectedTaskId && (
          <Modal
            visible={!!selectedTaskId}
            onDismiss={() => setSelectedTaskId(null)}
            contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.background }]}
          >
            <TaskDetail
              taskId={selectedTaskId}
              onEdit={() => {
                navigation.navigate('EditTask', { taskId: selectedTaskId });
                setSelectedTaskId(null);
              }}
              onDelete={() => {
                // Handle delete
                setSelectedTaskId(null);
              }}
              onBack={() => setSelectedTaskId(null)}
            />
          </Modal>
        )}
        
        {/* Task form modal */}
        <Modal
          visible={showTaskForm}
          onDismiss={() => setShowTaskForm(false)}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.background }]}
        >
          <TaskForm
            onClose={() => setShowTaskForm(false)}
            onSave={handleSaveTask}
            initialDate={selectedDate ? new Date(selectedDate) : undefined}
          />
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContent: {
    margin: 16,
    borderRadius: 8,
    padding: 16,
    maxHeight: '90%',
  },
}); 