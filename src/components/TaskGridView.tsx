import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  useWindowDimensions,
  Modal,
  Image
} from 'react-native';
import { format } from 'date-fns';
import { Task, SubTask } from '../types/Task';
import { useTheme } from '../theme/ThemeProvider';
import { Ionicons, MaterialIcons, AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Surface, Badge, Avatar, IconButton, Chip } from 'react-native-paper';

interface TaskGridViewProps {
  tasks: Task[];
  onTaskPress: (taskId: string) => void;
  onEditTask?: (task: Task) => void;
  onToggleCompletion: (taskId: string) => void;
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
  
  // Enhanced grid layout configuration
  const numColumns = 2;
  const spacing = 8; // Reduced spacing between items
  const leftPadding = 4; // Reduced left padding
  const rightPadding = 4; // Reduced right padding
  
  // Calculate available width and item dimensions
  const availableWidth = windowDimensions.width - leftPadding - rightPadding - (spacing * (numColumns - 1));
  const itemWidth = availableWidth / numColumns;
  
  // Format the due date
  const formatDueDate = (date?: Date | string) => {
    if (!date) return '';
    return format(new Date(date), 'MMM d');
  };

  // Get priority color
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return theme.colors.error;
      case 'medium': return theme.colors.warning;
      case 'low': return theme.colors.success;
      default: return theme.colors.outline;
    }
  };
  
  // Get category or tag color
  const getTagColor = (index: number) => {
    const colors = [
      theme.colors.primary,
      theme.colors.accent,
      theme.colors.secondary,
      theme.colors.info
    ];
    return colors[index % colors.length];
  };

  // Generate avatar for task based on title
  const getTaskAvatar = (task: Task) => {
    return null; // No longer generating avatar
  };
  
  // Get subtasks progress
  const getSubtasksProgress = (task: Task) => {
    if (!task.subtasks || task.subtasks.length === 0) return null;
    
    const completed = task.subtasks.filter(st => st.completed).length;
    const total = task.subtasks.length;
    
    return { completed, total, percentage: (completed / total) * 100 };
  };
  
  // Handle subtask completion toggle
  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    if (onToggleSubtaskCompletion) {
      onToggleSubtaskCompletion(taskId, subtaskId);
    }
  };
  
  // Add a function to get the priority icon based on priority level
  const getPriorityIcon = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'arrow-upward';
      case 'medium':
        return 'remove';
      case 'low':
        return 'arrow-downward';
      default:
        return 'remove';
    }
  };
  
  // Render each task card in the grid
  const renderItem = ({ item, index }: { item: Task, index: number }) => {
    const isSelected = selectedTasks.includes(item.id);
    const hasSubtasks = item.subtasks && item.subtasks.length > 0;
    const subtasksProgress = getSubtasksProgress(item);
    
    // Handle toggle completion
    const handleToggle = (e: any) => {
      e.stopPropagation();
      console.log('Toggle task completion for id:', item.id);
      if (onToggleCompletion) {
        onToggleCompletion(item.id);
      }
    };
    
    return (
      <Surface 
        style={[
          styles.gridItem,
          { 
            width: itemWidth - spacing,
            backgroundColor: theme.colors.surface,
            marginLeft: index % numColumns !== 0 ? spacing : 0,
            marginBottom: spacing,
            borderColor: isSelected ? theme.colors.primary : 'transparent',
            borderWidth: isSelected ? 2 : 0,
          }
        ]}
        elevation={2}
      >
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => onTaskPress(item.id)}
          onLongPress={() => onLongPress && onLongPress(item.id)}
          delayLongPress={300}
        >
          {/* Status indicator */}
          <View 
            style={[
              styles.statusIndicator, 
              { 
                backgroundColor: item.completed
                  ? theme.colors.success
                  : getPriorityColor(item.priority)
              }
            ]} 
          />
          
          {/* Header with avatar and actions */}
          <View style={styles.cardHeader}>
            <View style={styles.headerActions}>
              {hasSubtasks && (
                <IconButton 
                  icon="playlist-check" 
                  size={18}
                  style={styles.actionButton}
                  onPress={() => handleShowSubtasks(item)}
                />
              )}
            </View>
          </View>
          
          {/* Title and description */}
          <View style={styles.textContent}>
            <View style={styles.titleContainer}>
              <MaterialIcons 
                name={getPriorityIcon(item.priority)} 
                size={16} 
                color={getPriorityColor(item.priority)}
                style={styles.priorityIcon}
              />
              <Text 
                style={[
                  styles.title,
                  { color: theme.colors.text },
                  item.completed && styles.completedText
                ]}
                numberOfLines={2}
              >
                {item.title}
              </Text>
            </View>
            
            {item.description ? (
              <Text 
                style={[
                  styles.description,
                  { color: 'rgba(0, 0, 0, 0.6)' },
                  item.completed && styles.completedText
                ]}
                numberOfLines={2}
              >
                {item.description}
              </Text>
            ) : null}
          </View>
          
          {/* Subtasks progress bar */}
          {subtasksProgress && (
            <View style={styles.progressContainer}>
              <View style={styles.progressWrapper}>
                <View 
                  style={[
                    styles.progressBar,
                    { width: `${subtasksProgress.percentage}%`, backgroundColor: theme.colors.primary }
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: theme.colors.secondary }]}>
                {subtasksProgress.completed}/{subtasksProgress.total}
              </Text>
            </View>
          )}
          
          {/* Footer with metadata */}
          <View style={styles.cardFooter}>
            {item.dueDate && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons 
                  name="clock-outline" 
                  size={14} 
                  color="#1976D2" 
                />
                <Text style={[styles.metaText, { color: '#1976D2' }]}>
                  {formatDueDate(item.dueDate)}
                </Text>
              </View>
            )}
            
            {item.tags && item.tags.length > 0 && (
              <Chip 
                style={[styles.tagChip, { backgroundColor: getTagColor(0) }]}
                textStyle={{ color: "#fff", fontSize: 10 }}
                compact
              >
                {item.tags[0]}
              </Chip>
            )}
            
            <View style={styles.iconContainer}>
              <IconButton 
                icon={item.completed ? "check-circle" : "circle-outline"}
                size={16}
                iconColor={item.completed ? theme.colors.success : theme.colors.text}
                style={styles.footerIcon}
                onPress={handleToggle}
              />
              
              {onStartPomodoro && (
                <IconButton
                  icon="timer-outline"
                  size={16}
                  iconColor={theme.colors.primary}
                  style={styles.footerIcon}
                  onPress={(e) => {
                    e.stopPropagation();
                    onStartPomodoro(item.id);
                  }}
                />
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Surface>
    );
  };
  
  // Handle opening the subtasks modal
  const handleShowSubtasks = (task: Task) => {
    setSelectedTask(task);
    setShowSubtasks(true);
  };
  
  // Render a subtask in the modal
  const renderSubtask = (subtask: SubTask, taskId: string) => {
    return (
      <TouchableOpacity
        key={subtask.id}
        style={[
          styles.subtaskItem,
          { 
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            borderRadius: 8 
          }
        ]}
        onPress={() => handleToggleSubtask(taskId, subtask.id)}
      >
        <View style={styles.subtaskContent}>
          <TouchableOpacity
            style={[
              styles.subtaskCheckbox,
              { borderColor: theme.colors.primary },
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
          <Surface style={[
            styles.modalContent,
            { 
              backgroundColor: theme.colors.surface,
            }
          ]}
          elevation={4}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {selectedTask.title}
              </Text>
              <IconButton
                icon="close"
                size={20}
                onPress={() => setShowSubtasks(false)}
              />
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
          </Surface>
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
            paddingHorizontal: 4,
            paddingVertical: 8
          }
        ]}
        columnWrapperStyle={{ 
          justifyContent: 'flex-start',
        }}
        ListEmptyComponent={EmptyComponent || (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={theme.colors.secondary} />
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
    flexGrow: 1,
  },
  gridItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 0,
    height: 166,
    position: 'relative',
    paddingBottom: 4,
  },
  statusIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
    paddingTop: 12,
    paddingRight: 12,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    margin: 0,
    padding: 0,
    width: 28,
    height: 28,
  },
  textContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
    paddingRight: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    width: '100%',
    paddingRight: 8,
  },
  priorityIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    flex: 1,
    paddingRight: 8,
  },
  description: {
    fontSize: 12,
    marginBottom: 8,
    opacity: 0.8,
    paddingLeft: 20,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  progressContainer: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressWrapper: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressBar: {
    height: '100%',
  },
  progressText: {
    fontSize: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4,
  },
  tagChip: {
    height: 20,
    marginLeft: 'auto',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerIcon: {
    margin: 0,
    padding: 0,
    width: 24,
    height: 24,
  },
  // Subtasks modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    alignItems: 'flex-end',
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  subtaskItem: {
    marginBottom: 8,
    padding: 10,
  },
  subtaskContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtaskCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtaskTitle: {
    fontSize: 14,
    flex: 1,
  },
  completedSubtask: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
}); 