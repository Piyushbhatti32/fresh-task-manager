import React, { useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import CalendarView from '../components/CalendarView';
import TaskDetail from '../components/TaskDetail';
import { Task } from '../types/Task';
import { useTaskStore } from '../stores/taskStore';
import TaskForm from '../components/TaskForm';

type CalendarScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CalendarScreen() {
  const theme = useTheme();
  const navigation = useNavigation<CalendarScreenNavigationProp>();
  const { tasks, updateTask, deleteTask } = useTaskStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const handleTaskPress = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setShowTaskDetail(true);
    }
  };

  const handleTaskDelete = () => {
    if (selectedTask) {
      deleteTask(selectedTask.id);
      setShowTaskDetail(false);
      setSelectedTask(null);
    }
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    updateTask(updatedTask);
    setSelectedTask(updatedTask);
  };

  const handleToggleTaskCompletion = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const updatedTask = { ...task, completed: !task.completed };
      updateTask(updatedTask);
      if (selectedTask?.id === taskId) {
        setSelectedTask(updatedTask);
      }
    }
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.subtasks) {
      const updatedSubtasks = task.subtasks.map(subtask => 
        subtask.id === subtaskId 
          ? { ...subtask, completed: !subtask.completed }
          : subtask
      );
      const updatedTask = { ...task, subtasks: updatedSubtasks };
      updateTask(updatedTask);
      if (selectedTask?.id === taskId) {
        setSelectedTask(updatedTask);
      }
    }
  };

  const handlePomodoro = () => {
    if (selectedTask) {
      setShowTaskDetail(false);
      navigation.navigate('Pomodoro', { taskId: selectedTask.id });
    }
  };

  const handleAddComment = () => {
    if (selectedTask) {
      setShowTaskDetail(false);
      navigation.navigate('AddComment', { taskId: selectedTask.id });
    }
  };

  const handleShare = () => {
    if (selectedTask) {
      setShowTaskDetail(false);
      navigation.navigate('ShareTask', { taskId: selectedTask.id });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <CalendarView
        tasks={tasks}
        onTaskPress={handleTaskPress}
        onToggleCompletion={handleToggleTaskCompletion}
        onAddTask={(date: string) => {
          navigation.navigate('CreateTask', { date });
        }}
      />
      
      <Modal
        visible={showTaskDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTaskDetail(false)}
      >
        {selectedTask && (
          <TaskDetail
            task={selectedTask}
            onBack={() => setShowTaskDetail(false)}
            onEdit={() => {
              setShowTaskDetail(false);
              navigation.navigate('EditTask', { taskId: selectedTask.id });
            }}
            onDelete={handleTaskDelete}
            onUpdate={handleTaskUpdate}
            onToggleCompletion={handleToggleTaskCompletion}
            onToggleSubtask={handleToggleSubtask}
            onPomodoro={handlePomodoro}
            onAddComment={handleAddComment}
            onShare={handleShare}
          />
        )}
      </Modal>

      <Modal
        visible={showTaskForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowTaskForm(false);
          setSelectedDate(undefined);
        }}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
          <TaskForm
            task={selectedTask || undefined}
            isVisible={showTaskForm}
            onClose={() => {
              setShowTaskForm(false);
              setSelectedDate(undefined);
            }}
            onSave={async (taskData) => {
              if (selectedTask) {
                await handleTaskUpdate({ ...selectedTask, ...taskData });
              } else if (selectedDate) {
                // Create new task with selected date
                const newTask: Task = {
                  id: Date.now().toString(),
                  title: taskData.title || '',
                  description: taskData.description,
                  dueDate: selectedDate.toISOString(),
                  completed: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  priority: taskData.priority,
                  categoryId: taskData.categoryId,
                  subtasks: taskData.subtasks || []
                };
                await handleTaskUpdate(newTask);
              }
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
});