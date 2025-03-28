import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  useWindowDimensions,
  Modal
} from 'react-native';
import { format } from 'date-fns';
import { Task, SubTask } from '../types/Task';
import { useTheme } from '../theme/ThemeProvider';
import { Ionicons, MaterialIcons, AntDesign } from '@expo/vector-icons';
import { TaskCard } from './TaskCard';

interface TaskGridViewProps {
  tasks: Task[];
  onTaskPress: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onToggleCompletion: (task: Task) => void;
  onToggleSubtaskCompletion?: (taskId: string, subtaskId: string) => void;
  EmptyComponent?: React.ComponentType<any>;
  isMultiSelectMode?: boolean;
  selectedTasks?: string[];
  onTaskSelect?: (taskId: string) => void;
  onLongPress?: (taskId: string) => void;
  onStartPomodoro: (taskId: string) => void;
}

export default function TaskGridView({ 
  tasks, 
  onTaskPress, 
  onEditTask,
  onToggleCompletion, 
  onToggleSubtaskCompletion,
  EmptyComponent,
  isMultiSelectMode = false,
  selectedTasks = [],
  onTaskSelect,
  onLongPress,
  onStartPomodoro
}: TaskGridViewProps) {
  const { theme, isDark } = useTheme();
  const windowDimensions = useWindowDimensions();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showSubtasks, setShowSubtasks] = useState(false);
  
  // Calculate size based on screen width and apply a consistent fixed width to all grid items
  const numColumns = 2;
  const spacing = 16; // Reduce spacing between items
  const verticalSpacing = 24; // Vertical spacing between items
  const leftPadding = 6; // Further reduce left padding
  const rightPadding = 16; // Keep right padding as is
  
  // Total available width minus all padding
  const availableWidth = windowDimensions.width - leftPadding - rightPadding - spacing;
  
  // Calculate item width to be slightly larger
  const itemWidth = (availableWidth / numColumns) * 0.95; // Increase from 0.9 to 0.95
  
  // Distribute remaining space evenly
  const horizontalGap = (availableWidth - (itemWidth * numColumns)) / (numColumns + 1);
  
  // Format the due date
  const formatDueDate = (date?: Date) => {
    if (!date) return 'No date set';
    return format(date, 'MMM d, yyyy');
  };
  
  // Handle opening the subtasks modal
  const handleShowSubtasks = (task: Task) => {
    setSelectedTask(task);
    setShowSubtasks(true);
  };
  
  // Handle subtask completion toggle
  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    if (onToggleSubtaskCompletion) {
      onToggleSubtaskCompletion(taskId, subtaskId);
    }
  };
  
  // Render a subtask in the modal
  const renderSubtask = (subtask: SubTask, taskId: string) => {
    return (
      <TouchableOpacity
        key={subtask.id}
        style={[
          styles.subtaskItem,
          { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }
        ]}
        onPress={() => handleToggleSubtask(taskId, subtask.id)}
      >
        <View style={styles.subtaskContent}>
          <TouchableOpacity
            style={[
              styles.subtaskCheckbox,
              { borderColor: theme.colors.secondary },
              subtask.completed && { backgroundColor: theme.colors.success }
            ]}
            onPress={() => handleToggleSubtask(taskId, subtask.id)}
          >
            {subtask.completed && (
              <Ionicons name="checkmark" size={14} color="#fff" />
            )}
          </TouchableOpacity>
          
          <Text 
            style={[
              styles.subtaskTitle,
              { color: theme.colors.text },
              subtask.completed && styles.completedSubtask
            ]}
            numberOfLines={1}
          >
            {subtask.title}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Render each task card
  const renderItem = ({ item }: { item: Task }) => {
    // Check if this task is selected in multi-select mode
    const isSelected = selectedTasks.includes(item.id);
    // Check if task has subtasks
    const hasSubtasks = item.subtasks && item.subtasks.length > 0;
    
    return (
      <View style={[
        styles.gridItemContainer,
        { 
          width: itemWidth,
          marginBottom: verticalSpacing,
          marginHorizontal: horizontalGap // Add gap on both sides
        }
      ]}>
        <TaskCard
          task={item}
          onPress={() => onTaskPress(item)}
          onStartPomodoro={() => onStartPomodoro(item.id)}
        />
      </View>
    );
  };
  
  // Subtasks modal
  const renderSubtasksModal = () => {
    if (!selectedTask) return null;
    
    return (
      <Modal
        visible={showSubtasks}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSubtasks(false)}
      >
        <View style={[
          styles.modalContainer,
          { backgroundColor: 'rgba(0,0,0,0.5)' }
        ]}>
          <View style={[
            styles.modalContent,
            { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.secondary
            }
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Subtasks: {selectedTask.title}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSubtasks(false)}
              >
                <AntDesign name="close" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              {selectedTask.subtasks?.length ? (
                selectedTask.subtasks.map(subtask => 
                  renderSubtask(subtask, selectedTask.id)
                )
              ) : (
                <Text style={[styles.emptyText, { color: theme.colors.secondary }]}>
                  No subtasks available
                </Text>
              )}
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.colors.primary }
                ]}
                onPress={() => setShowSubtasks(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  
  // Render the component
  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        contentContainerStyle={[
          styles.listContainer,
          { 
            paddingLeft: leftPadding,
            paddingRight: rightPadding,
            paddingTop: 12,
            paddingBottom: 16
          }
        ]}
        columnWrapperStyle={{ 
          justifyContent: 'flex-start',
          marginHorizontal: 0
        }}
        ListEmptyComponent={EmptyComponent || (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              No tasks to display
            </Text>
          </View>
        )}
      />
      {renderSubtasksModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  gridItemContainer: {
    marginBottom: 16,
  },
  taskCard: {
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: 180,
    overflow: 'hidden',
  },
  taskContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  priorityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  checkboxContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 4,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerLeft: {
    flex: 2,
    overflow: 'hidden',
    paddingRight: 8,
  },
  footerRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  completedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  completedText: {
    fontSize: 60,
    color: 'rgba(0,0,0,0.1)',
    fontWeight: 'bold',
  },
  editButton: {
    padding: 4,
    marginLeft: 8,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  progressText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtasksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginLeft: 8,
  },
  subtasksCount: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  subtaskItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 1,
    borderRadius: 8,
  },
  subtaskContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtaskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  subtaskTitle: {
    fontSize: 14,
    flex: 1,
  },
  completedSubtask: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
}); 