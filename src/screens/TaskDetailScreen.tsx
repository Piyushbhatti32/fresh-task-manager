import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import TaskDetail from '../components/TaskDetail';
import { useNavigation } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskDetail'>;

export default function TaskDetailScreen({ route }: Props) {
  const navigation = useNavigation();
  const { taskId } = route.params;

  const handleEdit = () => {
    // Navigate to edit mode or show edit modal
    console.log('Edit task:', taskId);
  };

  const handleDelete = () => {
    // Show delete confirmation and handle deletion
    console.log('Delete task:', taskId);
    navigation.goBack();
  };

  return (
    <TaskDetail
      taskId={taskId}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onBack={() => navigation.goBack()}
    />
  );
} 