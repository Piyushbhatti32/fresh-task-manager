import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Modal,
  Platform,
  Alert,
  Button,
  Switch,
  KeyboardAvoidingView,
  Pressable,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Task, TaskCategory, RecurrencePattern, ReminderOption, SubTask } from '../types/Task';
import { useTaskStore } from '../stores/taskStore';
import { format, parse, addMinutes, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { useTheme } from '../theme/ThemeProvider';
import { Picker } from '@react-native-picker/picker';
import { setTimeForDate } from '../services/RecurrenceService';
import SubTaskList from './SubTaskList';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { formatISO } from 'date-fns';
import { HelperText, Chip, Surface } from 'react-native-paper';
import databaseService from '../database/DatabaseService';
import * as Haptics from 'expo-haptics';

interface TaskFormProps {
  task?: Task;
  isVisible: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const REMINDER_OPTIONS: ReminderOption[] = [
  { value: 0, label: 'At time of event' },
  { value: 5, label: '5 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 1440, label: '1 day before' },
];

const RECURRENCE_TYPES = ['daily', 'weekly', 'monthly', 'yearly'];

// Predefined simple categories with colors
const PRESET_CATEGORIES = [
  { id: 'work', name: 'Work', color: '#FF5733' },
  { id: 'personal', name: 'Personal', color: '#33A1FF' },
  { id: 'shopping', name: 'Shopping', color: '#33FF57' },
  { id: 'health', name: 'Health', color: '#F033FF' },
  { id: 'education', name: 'Education', color: '#FFD433' },
  { id: 'finance', name: 'Finance', color: '#33FFC1' }
];

// Quick add task templates
const QUICK_ADD_TEMPLATES = [
  { title: 'Meeting', icon: 'users', color: '#4CAF50' },
  { title: 'Email', icon: 'envelope', color: '#2196F3' },
  { title: 'Call', icon: 'phone', color: '#FF9800' },
  { title: 'Document', icon: 'file-alt', color: '#9C27B0' },
  { title: 'Exercise', icon: 'running', color: '#E91E63' },
];

// Add priority options with enhanced visual indicators
const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#4CAF50', icon: 'arrow-downward', description: 'Not urgent' },
  { value: 'medium', label: 'Medium', color: '#FF9800', icon: 'remove', description: 'Moderate priority' },
  { value: 'high', label: 'High', color: '#F44336', icon: 'arrow-upward', description: 'Urgent' },
];

export default function TaskForm({ task, isVisible, onClose, onSave }: TaskFormProps) {
  const { theme, isDark } = useTheme();
  const { addTask, updateTask } = useTaskStore();
  
  // Add loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Add form validation state
  const [validationErrors, setValidationErrors] = useState<{
    title?: string;
    description?: string;
    dueDate?: string;
  }>({});
  
  // Form state
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<Task['priority']>(task?.priority || 'medium');
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task?.dueDate ? new Date(task.dueDate) : undefined
  );
  const [dueTime, setDueTime] = useState<Date | undefined>(task?.dueDate ? new Date(task.dueDate) : undefined);
  const [category, setCategory] = useState<string | undefined>(task?.categoryId || undefined);
  
  // Advanced options
  const [hasReminder, setHasReminder] = useState(task?.reminder !== undefined);
  const [reminderMinutes, setReminderMinutes] = useState(task?.reminder || 30);
  const [isRecurring, setIsRecurring] = useState(task?.recurrence !== undefined);
  const [recurrenceType, setRecurrenceType] = useState<RecurrencePattern['type']>(task?.recurrence?.type || 'daily');
  const [recurrenceInterval, setRecurrenceInterval] = useState(task?.recurrence?.interval || 1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>(task?.recurrence?.endDate);
  
  // UI state
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRecurrenceEndDatePicker, setShowRecurrenceEndDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');
  const [activeDateInput, setActiveDateInput] = useState<'dueDate' | 'dueTime' | 'recurrenceEndDate'>('dueDate');
  
  // Add state for subtasks
  const [subtasks, setSubtasks] = useState<SubTask[]>(task?.subtasks || []);
  const [progress, setProgress] = useState(task?.progress || 0);
  
  // Add state for quick add
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  
  // Update the useEffect for initializing form data to include subtasks
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
      setCategory(task.categoryId);
      
      // Set time if available
      if (task.dueDate) {
        setDueTime(task.dueDate ? new Date(task.dueDate) : undefined);
      }
      
      // Set reminder if available
      if (task.reminder !== undefined) {
        setHasReminder(true);
        setReminderMinutes(task.reminder);
      }
      
      // Set recurrence if available
      if (task.recurrence) {
        setIsRecurring(true);
        setRecurrenceType(task.recurrence.type);
        setRecurrenceInterval(task.recurrence.interval);
        setRecurrenceEndDate(task.recurrence.endDate);
      }
      
      // Show advanced options if needed
      if (task.reminder !== undefined || task.recurrence) {
        setShowAdvancedOptions(true);
      }
      
      // Set subtasks if available
      if (task.subtasks) {
        setSubtasks(task.subtasks);
        
        // Calculate progress
        if (task.progress !== undefined) {
          setProgress(task.progress);
        } else if (task.subtasks.length > 0) {
          const completedCount = task.subtasks.filter(subtask => subtask.completed).length;
          setProgress(Math.round((completedCount / task.subtasks.length) * 100));
        }
      }
    } else {
      // Reset form for new task
      resetForm();
    }
  }, [task, isVisible]);
  
  // Update the resetForm function to include subtasks
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate(undefined);
    setDueTime(undefined);
    setCategory(undefined);
    setHasReminder(false);
    setReminderMinutes(30);
    setIsRecurring(false);
    setRecurrenceType('daily');
    setRecurrenceInterval(1);
    setRecurrenceEndDate(undefined);
    setShowAdvancedOptions(false);
    
    // Reset subtasks
    setSubtasks([]);
    setProgress(0);
  };
  
  // Handle date/time picker opening
  const openDateTimePicker = (mode: 'date' | 'time', inputType: 'dueDate' | 'dueTime' | 'recurrenceEndDate') => {
    setDatePickerMode(mode);
    setActiveDateInput(inputType);
    
    if (Platform.OS === 'ios') {
      setShowDatePicker(true);
    } else {
      // On Android, we need separate handling for date and time
      if (mode === 'date') {
        setShowDatePicker(true);
      } else {
        setShowTimePicker(true);
      }
    }
  };
  
  // Handle date/time selection
  const handleDateTimeChange = (event: any, selectedDate?: Date) => {
    // On Android, the picker is automatically dismissed
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      setShowTimePicker(false);
    }
    
    if (selectedDate) {
      // Ensure we have a valid date object
      const date = new Date(selectedDate);
      
      // Update the appropriate state based on which input triggered the picker
      if (activeDateInput === 'dueDate') {
        // If we already have a time, preserve it
        if (dueTime && datePickerMode === 'date') {
          const newDate = new Date(date);
          newDate.setHours(dueTime.getHours(), dueTime.getMinutes());
          setDueDate(newDate);
          setDueTime(newDate);
        } else {
          setDueDate(date);
          // If selecting time, update both date and time
          if (datePickerMode === 'time') {
            setDueTime(date);
          }
        }
      } else if (activeDateInput === 'dueTime') {
        // Ensure we have a valid date to set the time on
        const baseDate = dueDate || new Date();
        const newDate = new Date(baseDate);
        newDate.setHours(date.getHours(), date.getMinutes());
        setDueTime(newDate);
        setDueDate(newDate);
      } else if (activeDateInput === 'recurrenceEndDate') {
        setRecurrenceEndDate(date);
      }
    }
  };
  
  // Close date picker (for iOS)
  const closeDatePicker = () => {
    setShowDatePicker(false);
    setShowTimePicker(false);
    setShowRecurrenceEndDatePicker(false);
  };
  
  // Format time for display
  const formatTimeForDisplay = (date?: Date) => {
    if (!date) return 'Set time';
    try {
      return format(date, 'h:mm a');
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid time';
    }
  };
  
  // Format recurrence for display
  const getRecurrenceDescription = () => {
    if (!isRecurring) return '';
    
    let description = `Every `;
    if (recurrenceInterval > 1) {
      description += `${recurrenceInterval} `;
    }
    
    switch (recurrenceType) {
      case 'daily':
        description += recurrenceInterval > 1 ? 'days' : 'day';
        break;
      case 'weekly':
        description += recurrenceInterval > 1 ? 'weeks' : 'week';
        break;
      case 'monthly':
        description += recurrenceInterval > 1 ? 'months' : 'month';
        break;
      case 'yearly':
        description += recurrenceInterval > 1 ? 'years' : 'year';
        break;
    }
    
    if (recurrenceEndDate) {
      description += ` until ${format(recurrenceEndDate, 'MMM d, yyyy')}`;
    }
    
    return description;
  };
  
  // Get the next occurrence based on recurrence pattern
  const getNextOccurrence = (baseDate: Date, pattern: RecurrencePattern): Date => {
    const { type, interval } = pattern;
    
    switch (type) {
      case 'daily':
        return addDays(baseDate, interval);
      case 'weekly':
        return addWeeks(baseDate, interval);
      case 'monthly':
        return addMonths(baseDate, interval);
      case 'yearly':
        return addYears(baseDate, interval);
      default:
        return baseDate;
    }
  };
  
  // Add haptic feedback
  const handleInteraction = async (type: 'light' | 'medium' | 'heavy') => {
    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    } catch (error) {
      console.error('Haptics error:', error);
    }
  };
  
  // Update handleSubmit with better validation and logging
  const handleSubmit = async () => {
    console.log('TaskForm - handleSubmit called');
    console.log('TaskForm - Current title:', title);
    console.log('TaskForm - Trimmed title:', title?.trim());
    
    // First validate the form
    if (!validateForm()) {
      console.log('TaskForm - Form validation failed');
      await handleInteraction('medium');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    
    try {
      const taskData = {
        title: title || '',
        description: description || '',
        priority: priority || 'low',
        dueDate: dueDate ? formatISO(dueDate) : undefined,
        dueTime: dueTime ? format(dueTime, 'HH:mm') : undefined,
        recurrence: isRecurring ? {
          type: recurrenceType,
          interval: recurrenceInterval,
          endDate: recurrenceEndDate,
        } : undefined,
        reminder: hasReminder ? reminderMinutes : undefined,
        completed: task?.completed || false,
        subtasks: subtasks.length > 0 ? subtasks : undefined,
        progress: subtasks.length > 0 ? progress : undefined,
        tags: selectedTags,
        categoryId: category || undefined,
      };

      console.log('TaskForm - Submitting task data:', taskData);

      let savedTask: Task;
      
      if (task) {
        savedTask = await updateTask({id: task.id, ...taskData});
      } else {
        savedTask = await addTask(taskData);
      }
      
      await handleInteraction('heavy');
      
      if (onSave) {
        onSave(savedTask);
      }
      onClose();
    } catch (error) {
      await handleInteraction('medium');
      console.error('TaskForm - Error saving task:', error);
      
      // Only show error if it's not a successful task creation
      if (!(error instanceof Error && error.message === 'Title is required' && title)) {
        setError(error instanceof Error ? error.message : 'Failed to save task. Please try again.');
        Alert.alert('Error', 'Failed to save task. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update validateForm function with better logging
  const validateForm = () => {
    console.log('TaskForm - Validating form...');
    console.log('TaskForm - Title:', title);
    console.log('TaskForm - Trimmed title:', title.trim());
    
    const errors: typeof validationErrors = {};
    
    if (dueDate && dueDate < new Date()) {
      console.log('TaskForm - Due date validation failed');
      errors.dueDate = 'Due date cannot be in the past';
    }
    
    if (description && description.length > 1000) {
      console.log('TaskForm - Description validation failed');
      errors.description = 'Description is too long (max 1000 characters)';
    }
    
    console.log('TaskForm - Validation errors:', errors);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Update handleSave to use handleSubmit directly
  const handleSave = () => {
    console.log('TaskForm - Save button pressed');
    handleSubmit();
  };

  // Update the title input onChangeText handler
  const handleTitleChange = (text: string) => {
    console.log('TaskForm - Title changed:', text);
    setTitle(text);
    // Clear validation error when user types
    if (validationErrors.title) {
      setValidationErrors(prev => ({ ...prev, title: undefined }));
    }
  };

  // Add auto-save functionality
  useEffect(() => {
    const autoSaveTimeout = setTimeout(() => {
      if (title.trim() && !isSubmitting) {
        handleSubmit();
      }
    }, 30000); // Auto-save after 30 seconds of inactivity

    return () => clearTimeout(autoSaveTimeout);
  }, [title, description, priority, dueDate, dueTime, isRecurring, recurrenceType, recurrenceInterval, recurrenceEndDate, hasReminder, reminderMinutes, subtasks, progress, selectedTags, category]);

  // Add keyboard handling
  const handleKeyboardDismiss = () => {
    Keyboard.dismiss();
  };
  
  // Toggle showing advanced options
  const toggleAdvancedOptions = () => {
    setShowAdvancedOptions(!showAdvancedOptions);
  };
  
  // Add function to update local subtasks state (for use in SubTaskList)
  const handleSubtasksChange = (updatedSubtasks: SubTask[]) => {
    console.log("Subtasks changed:", updatedSubtasks);
    setSubtasks(updatedSubtasks);
    
    // Calculate progress
    if (updatedSubtasks.length > 0) {
      const completedCount = updatedSubtasks.filter(subtask => subtask.completed).length;
      const newProgress = Math.round((completedCount / updatedSubtasks.length) * 100);
      console.log("New progress:", newProgress);
      setProgress(newProgress);
    } else {
      setProgress(0);
    }
  };
  
  const [availableTags, setAvailableTags] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>((task as any)?.tags?.map((t: any) => t.id) || []);
  const [tags, setTags] = useState<string[]>(task?.tags || []);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const result = await databaseService.executeSql('SELECT * FROM tags ORDER BY name');
      setAvailableTags(result.rows._array);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Update quick add handler with haptic feedback
  const handleQuickAdd = async (template: typeof QUICK_ADD_TEMPLATES[0]) => {
    await handleInteraction('light');
    setTitle(template.title);
    setCategory(template.color);
    setShowQuickAdd(false);
  };

  // Handle tag management
  const handleAddTag = async () => {
    if (newTag.trim()) {
      try {
        // Create new tag in database
        const result = await databaseService.executeSql(
          'INSERT INTO tags (name, color) VALUES (?, ?)',
          [newTag.trim(), theme.colors.primary]
        );
        
        const tagId = result.insertId?.toString();
        if (tagId) {
          // Add tag to selected tags
          setSelectedTags(prev => [...prev, tagId]);
          setNewTag('');
          // Reload available tags
          loadTags();
        }
      } catch (error) {
        console.error('Error adding tag:', error);
      }
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      setSelectedTags(prev => prev.filter(id => id !== tagId));
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      accessibilityLabel={task ? 'Edit Task Form' : 'Add Task Form'}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <TouchableWithoutFeedback onPress={handleKeyboardDismiss}>
          <View style={styles.container}>
            <View style={[styles.header, { borderBottomColor: theme.colors.outline }]}>
              <Text 
                style={[styles.headerTitle, { color: theme.colors.text }]}
                accessibilityRole="header"
              >
                {task ? 'Edit Task' : 'Add Task'}
              </Text>
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.quickAddButton}
                  onPress={() => setShowQuickAdd(!showQuickAdd)}
                  accessibilityLabel="Quick Add Templates"
                  accessibilityHint="Shows quick add task templates"
                >
                  <MaterialIcons 
                    name="bolt" 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.closeButton} 
                  onPress={onClose}
                  accessibilityLabel="Close"
                >
                  <MaterialIcons 
                    name="close" 
                    size={24} 
                    color={theme.colors.text} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {showQuickAdd && (
              <View 
                style={styles.quickAddContainer}
                accessibilityLabel="Quick Add Templates"
              >
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  accessibilityRole="list"
                >
                  {QUICK_ADD_TEMPLATES.map((template) => (
                    <TouchableOpacity
                      key={template.title}
                      style={[styles.quickAddItem, { backgroundColor: template.color + '20' }]}
                      onPress={() => handleQuickAdd(template)}
                      accessibilityLabel={`Quick add ${template.title} task`}
                      accessibilityRole="button"
                    >
                      <FontAwesome5 name={template.icon} size={24} color={template.color} />
                      <Text style={[styles.quickAddText, { color: template.color }]}>
                        {template.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            <ScrollView 
              style={styles.formContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              accessibilityRole="none"
            >
              {/* Title input with enhanced styling and accessibility */}
              <Surface style={[styles.inputSurface, { backgroundColor: theme.colors.surface }]}>
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      color: theme.colors.text,
                    },
                    validationErrors.title && styles.inputError
                  ]}
                  placeholder="Task title"
                  placeholderTextColor={theme.colors.text + '80'}
                  value={title}
                  onChangeText={handleTitleChange}
                  accessibilityLabel="Task Title"
                  accessibilityHint="Enter the title of your task"
                  accessibilityRole="none"
                />
                {validationErrors.title && (
                  <HelperText type="error" visible={true}>
                    {validationErrors.title}
                  </HelperText>
                )}
              </Surface>

              {/* Description input with enhanced styling */}
              <Surface style={[styles.inputSurface, { backgroundColor: theme.colors.surface }]}>
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      color: theme.colors.text,
                    }
                  ]}
                  placeholder="Description"
                  placeholderTextColor={theme.colors.text + '80'}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  accessibilityLabel="Task Description"
                  accessibilityHint="Enter the description of your task"
                  accessibilityRole="none"
                />
              </Surface>

              {/* Priority selector with enhanced styling */}
              <View style={styles.prioritySection}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Priority</Text>
                <View style={styles.priorityContainer}>
                  {PRIORITY_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.priorityButton,
                        { 
                          borderColor: option.color,
                          backgroundColor: 'transparent',
                        }
                      ]}
                      onPress={() => {
                        handleInteraction('light');
                        setPriority(option.value as 'low' | 'medium' | 'high');
                      }}
                      accessibilityLabel={`Set priority to ${option.label} - ${option.description}`}
                      accessibilityRole="button"
                    >
                      <MaterialIcons
                        name={option.icon}
                        size={24}
                        color={priority === option.value ? option.color : theme.colors.text}
                      />
                      <Text
                        style={[
                          styles.priorityText,
                          { color: priority === option.value ? option.color : theme.colors.text }
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text
                        style={[
                          styles.priorityDescription,
                          { color: priority === option.value ? option.color + '80' : theme.colors.text + '80' }
                        ]}
                      >
                        {option.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Tags section */}
              <Text style={[styles.label, { color: theme.colors.text }]}>Tags</Text>
              <View style={styles.tagsContainer}>
                <View style={styles.tagsList}>
                  {availableTags.map((tag) => (
                    <Chip
                      key={tag.id}
                      selected={selectedTags.includes(tag.id)}
                      onPress={() => toggleTag(tag.id)}
                      style={[
                        styles.tag,
                        { 
                          backgroundColor: selectedTags.includes(tag.id) 
                            ? tag.color + '20' 
                            : theme.colors.surface,
                          borderColor: tag.color,
                          marginRight: 8
                        }
                      ]}
                    >
                      {tag.name}
                    </Chip>
                  ))}
                </View>
                <View style={styles.tagInputContainer}>
                  <TextInput
                    style={[styles.tagInput, { 
                      color: theme.colors.text,
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.outline
                    }]}
                    value={newTag}
                    onChangeText={setNewTag}
                    placeholder="Add new tag"
                    placeholderTextColor={theme.colors.text + '80'}
                    onSubmitEditing={handleAddTag}
                  />
                  <TouchableOpacity
                    style={[styles.addTagButton, { backgroundColor: theme.colors.primary }]}
                    onPress={handleAddTag}
                  >
                    <MaterialIcons name="add" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Enhanced date/time picker */}
              <Text style={[styles.label, { color: theme.colors.text }]}>Due Date & Time</Text>
              <View style={styles.dateTimeContainer}>
                <TouchableOpacity
                  style={[styles.dateTimeButton, { borderColor: theme.colors.outline }]}
                  onPress={() => openDateTimePicker('date', 'dueDate')}
                >
                  <MaterialIcons name="event" size={20} color={theme.colors.text} />
                  <Text style={[styles.dateTimeButtonText, { color: theme.colors.text }]}>
                    {dueDate ? format(dueDate, 'MMM d, yyyy') : 'Select Date'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.dateTimeButton,
                    { borderColor: theme.colors.outline },
                    !dueDate && styles.dateTimeButtonDisabled
                  ]}
                  onPress={() => dueDate && openDateTimePicker('time', 'dueTime')}
                  disabled={!dueDate}
                >
                  <MaterialIcons name="schedule" size={20} color={theme.colors.text} />
                  <Text style={[styles.dateTimeButtonText, { color: theme.colors.text }]}>
                    {dueTime ? formatTimeForDisplay(dueTime) : 'Select Time'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Category selection */}
              <Text style={[styles.label, { color: theme.colors.text }]}>Category</Text>
              <View style={styles.categoryContainer}>
                {PRESET_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryButton,
                      { 
                        borderColor: cat.color,
                        backgroundColor: category === cat.id ? cat.color : 'transparent',
                      }
                    ]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <View style={[styles.colorIndicator, { backgroundColor: cat.color }]} />
                    <Text style={[
                      styles.categoryText,
                      { color: category === cat.id ? (isDark ? '#000' : '#fff') : theme.colors.text }
                    ]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    { 
                      borderColor: theme.colors.outline,
                      borderStyle: 'dashed',
                      backgroundColor: category === 'none' ? theme.colors.primary + '20' : 'transparent',
                    }
                  ]}
                  onPress={() => setCategory(undefined)}
                >
                  <Text style={[styles.categoryText, { color: theme.colors.text }]}>
                    None
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Advanced options toggle */}
              <TouchableOpacity 
                style={[styles.advancedButton, { borderColor: theme.colors.outline }]}
                onPress={toggleAdvancedOptions}
              >
                <Text style={[styles.advancedButtonText, { color: theme.colors.primary }]}>
                  {showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}
                </Text>
              </TouchableOpacity>
              
              {/* Advanced options section */}
              {showAdvancedOptions && (
                <View style={styles.advancedSection}>
                  {/* Reminder option */}
                  <View style={styles.optionRow}>
                    <Text style={[styles.optionLabel, { color: theme.colors.text }]}>Set Reminder</Text>
                    <Switch
                      value={hasReminder}
                      onValueChange={setHasReminder}
                      trackColor={{ false: theme.colors.text + '40', true: theme.colors.primary + '80' }}
                      thumbColor={hasReminder ? theme.colors.primary : theme.colors.surface}
                    />
                  </View>
                  
                  {hasReminder && (
                    <View style={[styles.pickerContainer, { 
                      borderColor: theme.colors.outline,
                      backgroundColor: theme.colors.surface,
                      marginBottom: 16
                    }]}>
                      <Picker
                        selectedValue={reminderMinutes}
                        onValueChange={(value) => setReminderMinutes(value)}
                        style={{ color: theme.colors.text }}
                      >
                        {REMINDER_OPTIONS.map(option => (
                          <Picker.Item 
                            key={option.value} 
                            label={option.label} 
                            value={option.value}
                          />
                        ))}
                      </Picker>
                    </View>
                  )}
                  
                  {/* Recurrence option */}
                  <View style={styles.optionRow}>
                    <Text style={[styles.optionLabel, { color: theme.colors.text }]}>Recurring Task</Text>
                    <Switch
                      value={isRecurring}
                      onValueChange={setIsRecurring}
                      trackColor={{ false: theme.colors.text + '40', true: theme.colors.primary + '80' }}
                      thumbColor={isRecurring ? theme.colors.primary : theme.colors.surface}
                    />
                  </View>
                  
                  {isRecurring && (
                    <>
                      <Text style={[styles.recurDescription, { color: theme.colors.text }]}>
                        {getRecurrenceDescription()}
                      </Text>
                      
                      <View style={styles.recurrenceRow}>
                        <Text style={[styles.recurrenceLabel, { color: theme.colors.text }]}>Repeat every</Text>
                        <TextInput
                          style={[styles.recurrenceInput, { 
                            borderColor: theme.colors.outline,
                            backgroundColor: theme.colors.surface,
                            color: theme.colors.text
                          }]}
                          value={recurrenceInterval.toString()}
                          onChangeText={(text) => {
                            const value = parseInt(text);
                            if (!isNaN(value) && value > 0) {
                              setRecurrenceInterval(value);
                            } else if (text === '') {
                              setRecurrenceInterval(1);
                            }
                          }}
                          keyboardType="number-pad"
                        />
                        
                        <View style={[styles.typePickerContainer, {
                          borderColor: theme.colors.outline,
                          backgroundColor: theme.colors.surface
                        }]}>
                          <Picker
                            selectedValue={recurrenceType}
                            onValueChange={(value) => setRecurrenceType(value)}
                            style={{ color: theme.colors.text, flex: 1 }}
                          >
                            {RECURRENCE_TYPES.map(type => (
                              <Picker.Item 
                                key={type} 
                                label={type + (recurrenceInterval > 1 ? 's' : '')} 
                                value={type} 
                              />
                            ))}
                          </Picker>
                        </View>
                      </View>
                      
                      <TouchableOpacity
                        style={[styles.endDateButton, { 
                          borderColor: theme.colors.outline,
                          backgroundColor: theme.colors.surface
                        }]}
                        onPress={() => openDateTimePicker('date', 'recurrenceEndDate')}
                      >
                        <Text style={[styles.endDateButtonText, { color: theme.colors.text }]}>
                          {recurrenceEndDate 
                            ? `End on ${format(recurrenceEndDate, 'MMM d, yyyy')}` 
                            : 'Set end date (optional)'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
              
              {/* Add SubTaskList component */}
              <SubTaskList 
                taskId={task?.id || 'new'} 
                subtasks={subtasks}
                progress={progress}
                onChange={handleSubtasksChange}
                isNewTask={!task}
              />
              
              {/* Add error message display */}
              {error && (
                <View style={[styles.errorContainer, { backgroundColor: theme.colors.error + '20' }]}>
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    {error}
                  </Text>
                </View>
              )}
              
              {/* Add validation error messages */}
              {validationErrors.title && (
                <HelperText type="error" visible={true}>
                  {validationErrors.title}
                </HelperText>
              )}
              
              {/* Update save button with loading state and accessibility */}
              <TouchableOpacity 
                style={[
                  styles.saveButton, 
                  { backgroundColor: theme.colors.primary },
                  (isSubmitting || isLoading) && styles.saveButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting || isLoading}
                accessibilityLabel={task ? 'Update Task' : 'Add Task'}
                accessibilityRole="button"
                accessibilityState={{ disabled: isSubmitting || isLoading }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {task ? 'Update Task' : 'Add Task'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
            
            {/* Date picker for iOS */}
            {Platform.OS === 'ios' && showDatePicker && (
              <View style={[styles.datePickerContainer, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={closeDatePicker}>
                    <Text style={[styles.datePickerCancel, { color: theme.colors.error }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={closeDatePicker}>
                    <Text style={[styles.datePickerDone, { color: theme.colors.primary }]}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={(() => {
                    if (activeDateInput === 'dueDate') {
                      return dueDate || new Date();
                    } else if (activeDateInput === 'dueTime') {
                      return dueTime || new Date();
                    } else {
                      return recurrenceEndDate || new Date();
                    }
                  })()}
                  mode={datePickerMode}
                  display="spinner"
                  onChange={handleDateTimeChange}
                  textColor={theme.colors.text}
                />
              </View>
            )}
            
            {/* Date/time pickers for Android */}
            {Platform.OS === 'android' && showDatePicker && (
              <DateTimePicker
                value={(() => {
                  if (activeDateInput === 'dueDate') {
                    return dueDate || new Date();
                  } else {
                    return recurrenceEndDate || new Date();
                  }
                })()}
                mode="date"
                display="default"
                onChange={handleDateTimeChange}
                textColor={theme.colors.text}
              />
            )}
            
            {Platform.OS === 'android' && showTimePicker && (
              <DateTimePicker
                value={dueTime || new Date()}
                mode="time"
                display="default"
                onChange={handleDateTimeChange}
                textColor={theme.colors.text}
              />
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickAddButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  quickAddContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  quickAddItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickAddText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  prioritySection: {
    marginBottom: 16,
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  priorityButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  priorityDescription: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  priorityIcon: {
    marginBottom: 8,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTimeButtonDisabled: {
    opacity: 0.5,
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  dateTimeButtonTextDisabled: {
    color: '#999',
  },
  tagsContainer: {
    marginTop: 8,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    marginBottom: 8,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    fontSize: 16,
  },
  addTagButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  advancedOptionsContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  advancedOptionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  advancedOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  advancedOptionsIcon: {
    color: '#666',
  },
  advancedOptionsContent: {
    marginTop: 16,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  picker: {
    height: 50,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  createButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  subtasksContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  subtaskItemLast: {
    borderBottomWidth: 0,
  },
  subtaskCheckbox: {
    marginRight: 12,
  },
  subtaskInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  addSubtaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
  },
  addSubtaskText: {
    color: '#007AFF',
    fontSize: 16,
    marginLeft: 8,
  },
  addSubtaskIcon: {
    color: '#007AFF',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#eee',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF10',
    borderColor: '#007AFF',
  },
  categoryIcon: {
    marginRight: 8,
    fontSize: 18,
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
  },
  categoryTextActive: {
    color: '#007AFF',
  },
  inputSurface: {
    elevation: 2,
    borderRadius: 8,
    marginBottom: 16,
  },
  inputError: {
    borderColor: '#B00020',
  },
  advancedButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderStyle: 'dashed',
  },
  advancedButtonText: {
    fontWeight: '500',
  },
  advancedSection: {
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  recurDescription: {
    fontSize: 14,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  recurrenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recurrenceLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  recurrenceInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    width: 50,
    textAlign: 'center',
    marginRight: 8,
  },
  typePickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
  },
  endDateButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  endDateButtonText: {
    fontSize: 16,
  },
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  datePickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  datePickerCancel: {
    fontSize: 16,
  },
  datePickerDone: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  advancedOptionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
}); 