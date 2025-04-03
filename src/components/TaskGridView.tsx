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
import { Card, Surface, Badge, Avatar, IconButton, Chip, Menu } from 'react-native-paper';

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
  onDelete?: (taskId: string) => void;
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
  onStartPomodoro,
  onDelete
}: TaskGridViewProps) {
  const { theme, isDark } = useTheme();
  const windowDimensions = useWindowDimensions();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  
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
    
    return (
      <TouchableOpacity
        onPress={() => onTaskPress(item.id)}
        onLongPress={() => onLongPress && onLongPress(item.id)}
        style={[
          styles.itemContainer,
          { width: itemWidth }
        ]}
      >
        <Card 
          style={[
            styles.card,
            isSelected && styles.selectedCard,
            { backgroundColor: isDark ? theme.colors.surface : theme.colors.background }
          ]}
        >
          <Card.Content style={styles.cardContent}>
            {/* Header with status chip and actions */}
            <View style={styles.header}>
              <View style={styles.statusContainer}>
                <Chip 
                  icon={item.completed ? "check-circle" : "clock-outline"}
                  compact
                  style={[
                    styles.statusChip,
                    { 
                      backgroundColor: item.completed ? 
                        (isDark ? '#4CAF5060' : '#4CAF5040') : 
                        (isDark ? '#FFC10760' : '#FFC10740'),
                      height: 28,
                      paddingHorizontal: 8,
                    }
                  ]}
                >
                  {item.completed ? 'Completed' : 'Pending'}
                </Chip>
              </View>
              <Menu
                visible={menuVisible === item.id}
                onDismiss={() => setMenuVisible(null)}
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    size={20}
                    onPress={() => setMenuVisible(item.id)}
                    style={styles.menuButton}
                  />
                }
                contentStyle={{ backgroundColor: theme.colors.surface }}
              >
                {onStartPomodoro && (
                  <Menu.Item
                    onPress={() => {
                      setMenuVisible(null);
                      onStartPomodoro(item.id);
                    }}
                    title="Start Pomodoro"
                    leadingIcon="timer-outline"
                  />
                )}
                {onToggleCompletion && (
                  <Menu.Item
                    onPress={() => {
                      setMenuVisible(null);
                      onToggleCompletion(item.id);
                    }}
                    title={item.completed ? "Mark Incomplete" : "Mark Complete"}
                    leadingIcon={item.completed ? "check-circle" : "circle-outline"}
                  />
                )}
                {onDelete && (
                  <Menu.Item
                    onPress={() => {
                      setMenuVisible(null);
                      onDelete(item.id);
                    }}
                    title="Delete"
                    leadingIcon="delete"
                  />
                )}
              </Menu>
            </View>

            {/* Title */}
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
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.title}
              </Text>
            </View>
            
            {/* Description */}
            {item.description && (
              <Text 
                style={[
                  styles.description,
                  { color: theme.colors.inactive },
                  item.completed && styles.completedText
                ]}
                numberOfLines={2}
              >
                {item.description}
              </Text>
            )}
            
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
                    color={theme.colors.primary} 
                  />
                  <Text style={[styles.metaText, { color: theme.colors.primary }]}>
                    {formatDueDate(item.dueDate)}
                  </Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
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
  itemContainer: {
    padding: 4,
  },
  card: {
    margin: 0,
    elevation: 2,
  },
  cardContent: {
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  menuButton: {
    margin: 0,
    padding: 0,
    height: 28,
    width: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    flexShrink: 1,
  },
  priorityIcon: {
    marginRight: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressWrapper: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
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