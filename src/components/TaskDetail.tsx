import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Button, IconButton, Divider, Chip, Surface, Menu, Portal, Modal, ProgressBar } from 'react-native-paper';
import { formatDistanceToNow, format } from 'date-fns';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Task, SubTask } from '../types/Task';
import SubTaskList from './SubTaskList';
import InlinePomodoroTimer from './InlinePomodoroTimer';
import { useTaskStore } from '../stores/taskStore';
import { useTheme } from '../theme/ThemeProvider';

interface TaskDetailProps {
  task: Task;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (updatedTask: Task) => void;
  onToggleCompletion: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onPomodoro?: () => void;
  onAddComment?: () => void;
  onShare?: () => void;
}

export default function TaskDetail({ 
  task, 
  onEdit, 
  onDelete, 
  onToggleCompletion,
  onToggleSubtask,
  onUpdate,
  onBack,
  onPomodoro,
  onAddComment,
  onShare
}: TaskDetailProps) {
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { theme, isDark } = useTheme();

  const handlePomodoro = () => {
    setShowPomodoro(!showPomodoro);
    setMenuVisible(false);
    if (onPomodoro) {
      onPomodoro();
    }
  };

  const handleCommentAdd = () => {
    setMenuVisible(false);
    if (onAddComment) {
      onAddComment();
    }
  };

  const handleShare = () => {
    setMenuVisible(false);
    if (onShare) {
      onShare();
    }
  };

  const handleDelete = () => {
    setMenuVisible(false);
    setShowDeleteConfirm(true);
    onDelete();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return isDark ? '#CF6679' : '#D32F2F';
      case 'medium':
        return isDark ? '#FFDF5D' : '#FFC107';
      case 'low':
        return isDark ? '#78939D' : '#78909C';
      default:
        return isDark ? '#78939D' : '#78909C';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'drag-handle';
      case 'low':
        return 'arrow-downward';
      default:
        return 'drag-handle';
    }
  };

  const calculateSubtaskProgress = () => {
    if (!task.subtasks || task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter(st => st.completed).length;
    return completed / task.subtasks.length;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={onBack}
          />
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Task Details
          </Text>
        </View>
        <View style={styles.actionsContainer}>
          <IconButton
            icon="pencil"
            size={24}
            onPress={onEdit}
          />
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{task.title}</Text>
          {task.priority && (
            <Surface style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
              <MaterialIcons 
                name={getPriorityIcon(task.priority)} 
                size={16} 
                color="#fff" 
                style={styles.priorityIcon}
              />
              <Text style={styles.priorityText}>{task.priority.toUpperCase()}</Text>
            </Surface>
          )}
        </View>

        <View style={styles.statusContainer}>
          <Chip 
            icon={task.completed ? "check" : "clock-outline"}
            onPress={() => onToggleCompletion(task.id)}
            style={[
              styles.statusChip,
              { 
                backgroundColor: task.completed 
                  ? theme.colors.success 
                  : theme.colors.surfaceVariant 
              }
            ]}
            textStyle={{ color: task.completed ? '#fff' : theme.colors.text }}
          >
            {task.completed ? "Completed" : "Pending"}
          </Chip>
          {task.completed && task.updatedAt && (
            <Text style={[styles.completionDate, { color: theme.colors.text }]}>
              Completed {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}
            </Text>
          )}
        </View>

        {/* Quick Actions Bar */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => onToggleCompletion(task.id)}
          >
            <MaterialIcons 
              name={task.completed ? "check-box" : "check-box-outline-blank"} 
              size={24} 
              color={theme.colors.primary} 
            />
            <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
              {task.completed ? "Mark Incomplete" : "Mark Complete"}
            </Text>
          </TouchableOpacity>
          {onPomodoro && (
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={handlePomodoro}
            >
              <MaterialIcons 
                name="timer" 
                size={24} 
                color={theme.colors.primary} 
              />
              <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                Start Focus
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={onEdit}
          >
            <MaterialIcons 
              name="edit" 
              size={24} 
              color={theme.colors.primary} 
            />
            <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
              Edit Task
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => setShowDeleteConfirm(true)}
          >
            <MaterialIcons 
              name="delete" 
              size={24} 
              color={theme.colors.error} 
            />
            <Text style={[styles.quickActionText, { color: theme.colors.error }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>

        {task.description && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Description</Text>
            <Text style={[styles.description, { color: theme.colors.text }]}>{task.description}</Text>
          </View>
        )}

        {showPomodoro && (
          <View style={styles.pomodoroContainer}>
            <InlinePomodoroTimer 
              initialTaskId={task.id}
              onMinimize={() => setShowPomodoro(false)}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Details</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Created:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
              {format(new Date(task.createdAt), 'PPP')}
            </Text>
          </View>
          {task.dueDate && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Deadline:</Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {format(new Date(task.dueDate), 'PPP')}
                {' '}
                ({formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })})
              </Text>
            </View>
          )}
          {task.dueTime && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Time:</Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {format(new Date(`2000-01-01T${task.dueTime}`), 'h:mm a')}
              </Text>
            </View>
          )}
          {task.location && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Location:</Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {task.location}
              </Text>
            </View>
          )}
          {task.tags && task.tags.length > 0 && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Tags:</Text>
              <View style={styles.tagsContainer}>
                {task.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    style={[styles.tagChip, { backgroundColor: theme.colors.surfaceVariant }]}
                    textStyle={{ color: theme.colors.text }}
                  >
                    {tag}
                  </Chip>
                ))}
              </View>
            </View>
          )}
        </View>

        {task.subtasks && task.subtasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.subtaskHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Sub-tasks</Text>
              <Text style={[styles.subtaskProgress, { color: theme.colors.text }]}>
                {task.subtasks.filter(st => st.completed).length} of {task.subtasks.length} completed
              </Text>
            </View>
            <ProgressBar
              progress={calculateSubtaskProgress()}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
            <SubTaskList
              taskId={task.id}
              subtasks={task.subtasks}
              onChange={(updatedSubtasks) => {
                onUpdate({
                  ...task,
                  subtasks: updatedSubtasks
                });
              }}
            />
          </View>
        )}

        {task.pomodoroSessions && task.pomodoroSessions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Pomodoro Sessions</Text>
            <View style={styles.pomodoroStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {task.completedPomodoros || 0}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text }]}>Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {Math.round((task.totalPomodoroTime || 0) / 60)}h
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text }]}>Total Time</Text>
              </View>
            </View>
          </View>
        )}

        {task.notes && task.notes.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Notes</Text>
            {task.notes.map((note, index) => (
              <Surface key={index} style={[styles.noteCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text style={[styles.noteText, { color: theme.colors.text }]}>{note.content}</Text>
                <Text style={[styles.noteDate, { color: theme.colors.text }]}>
                  {format(new Date(note.createdAt.toString()), 'PPP')}
                </Text>
              </Surface>
            ))}
          </View>
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={showDeleteConfirm}
          onDismiss={() => setShowDeleteConfirm(false)}
          contentContainerStyle={[
            styles.deleteModal,
            { backgroundColor: theme.colors.surface }
          ]}
        >
          <Text style={[styles.deleteTitle, { color: theme.colors.text }]}>
            Delete Task
          </Text>
          <Text style={[styles.deleteMessage, { color: theme.colors.text }]}>
            Are you sure you want to delete this task? This action cannot be undone.
          </Text>
          <View style={styles.deleteActions}>
            <Button
              mode="outlined"
              onPress={() => setShowDeleteConfirm(false)}
              style={styles.deleteButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                setShowDeleteConfirm(false);
                handleDelete();
              }}
              style={[styles.deleteButton, { backgroundColor: theme.colors.error }]}
            >
              Delete
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  priorityIcon: {
    marginRight: 4,
  },
  priorityText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusChip: {
    marginRight: 8,
  },
  completionDate: {
    fontSize: 14,
    opacity: 0.7,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionText: {
    marginTop: 4,
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  pomodoroContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 100,
  },
  detailValue: {
    fontSize: 16,
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  tagChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  subtaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subtaskProgress: {
    fontSize: 14,
    opacity: 0.7,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  pomodoroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  noteCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  noteText: {
    fontSize: 16,
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  deleteModal: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  deleteMessage: {
    fontSize: 16,
    marginBottom: 24,
  },
  deleteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteButton: {
    marginLeft: 8,
  },
}); 