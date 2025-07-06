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
import { format, parse, addMinutes, addDays, addWeeks, addMonths, addYears, isValid } from 'date-fns';
import { useTheme } from '../theme/ThemeProvider';
import { Picker } from '@react-native-picker/picker';
import { setTimeForDate } from '../services/RecurrenceService';
import SubTaskList from './SubTaskList';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { formatISO } from 'date-fns';
import { HelperText, Chip, Surface } from 'react-native-paper';
import databaseService from '../database/DatabaseService';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

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
  const { addTask, updateTask, templates = [] } = useTaskStore();
  
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
  
  // Add AI suggestion state
  const [suggestedTitle, setSuggestedTitle] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  
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
  
  // Add state for focused section
  const [focusedSection, setFocusedSection] = useState<'basic' | 'details' | 'subtasks'>('basic');
  
  // Add smart date input state
  const [smartDateInput, setSmartDateInput] = useState('');
  const [showSmartDateInput, setShowSmartDateInput] = useState(false);
  
  // Voice input states
  const [isListening, setIsListening] = useState(false);
  const [voiceTarget, setVoiceTarget] = useState<'title' | 'description' | null>(null);
  
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

  // Handle applying a custom template from the store
  const handleUseTemplate = async (template: any) => {
    await handleInteraction('medium');
    // Apply template data to form
    setTitle(template.title);
    setDescription(template.description || '');
    setPriority(template.priority || 'medium');
    
    // Set due date based on template's dueTimeOffset or default to tomorrow
    if (template.dueTimeOffset) {
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + template.dueTimeOffset);
      setDueDate(newDueDate);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDueDate(tomorrow);
    }
    
    // Add subtasks from template
    if (template.subtasks && Array.isArray(template.subtasks)) {
      const newSubtasks = template.subtasks.map((st: any) => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        title: st.title,
        completed: false,
        createdAt: new Date()
      }));
      setSubtasks(newSubtasks);
    }
    
    // Set category if provided
    if (template.categoryId) {
      setCategory(template.categoryId);
    }
    
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

  // Add the priority color helper function
  const getPriorityColor = (priority: string = 'medium') => {
    switch (priority.toLowerCase()) {
      case 'high':
        return '#FF5252';
      case 'medium':
        return '#FFB300';
      case 'low':
        return '#69F0AE';
      default:
        return '#BDBDBD';
    }
  };

  // Generate AI suggestion for the task
  const generateSuggestion = () => {
    setIsGeneratingSuggestion(true);
    
    // Simulate AI generating a suggestion (would be replaced with actual API call)
    setTimeout(() => {
      const suggestions = [
        "Weekly team meeting",
        "Review project documentation",
        "Send follow-up email to client",
        "Update project timeline",
        "Research competitor strategies",
        "Prepare presentation slides",
        "Schedule stakeholder interview"
      ];
      
      const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
      setSuggestedTitle(randomSuggestion);
      setShowSuggestion(true);
      setIsGeneratingSuggestion(false);
    }, 1000);
  };

  // Accept the suggested title
  const acceptSuggestion = () => {
    setTitle(suggestedTitle);
    setShowSuggestion(false);
  };

  // Parse natural language date
  const parseSmartDate = (input: string) => {
    const today = new Date();
    const lowercaseInput = input.toLowerCase().trim();
    
    if (lowercaseInput === 'today') {
      return today;
    }
    
    if (lowercaseInput === 'tomorrow') {
      return addDays(today, 1);
    }
    
    if (lowercaseInput === 'next week' || lowercaseInput === 'in a week') {
      return addWeeks(today, 1);
    }
    
    if (lowercaseInput === 'next month') {
      return addMonths(today, 1);
    }
    
    // Handle "next [day of week]"
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < days.length; i++) {
      if (lowercaseInput === `next ${days[i]}`) {
        const targetDay = i;
        const currentDay = today.getDay();
        const daysUntilNext = (targetDay + 7 - currentDay) % 7;
        return addDays(today, daysUntilNext === 0 ? 7 : daysUntilNext);
      }
    }
    
    // Try to parse as a date string
    try {
      const parsedDate = new Date(input);
      if (isValid(parsedDate)) {
        return parsedDate;
      }
    } catch (error) {
      console.log('Error parsing date:', error);
    }
    
    // If all else fails, return undefined
    return undefined;
  };
  
  // Handle smart date input submission
  const handleSmartDateSubmit = () => {
    const parsedDate = parseSmartDate(smartDateInput);
    if (parsedDate) {
      setDueDate(parsedDate);
      // Also set time to noon by default
      const dateWithTime = new Date(parsedDate);
      dateWithTime.setHours(12, 0, 0, 0);
      setDueTime(dateWithTime);
    }
    setSmartDateInput('');
    setShowSmartDateInput(false);
  };

  // Simulate voice recognition (in a real app, would use Speech Recognition API)
  const startVoiceInput = (target: 'title' | 'description') => {
    setVoiceTarget(target);
    setIsListening(true);
    
    // Show feedback to user
    handleInteraction('medium');
    
    // Simulate voice processing (would be real speech recognition in production)
    setTimeout(() => {
      const demoVoiceResults = {
        title: [
          "Schedule team meeting for project review",
          "Complete budget report for Q3",
          "Research new project management tools",
          "Follow up with client about feedback"
        ],
        description: [
          "Need to discuss timeline changes and resource allocation with the team. Prepare slides beforehand.",
          "Include sales projections and expense breakdown. Send to finance department when complete.",
          "Focus on tools that integrate with our current stack and have good collaboration features.",
          "Address their concerns about the latest deliverable and provide timeline for revisions."
        ]
      };
      
      // Get random result based on target
      const results = demoVoiceResults[target];
      const randomResult = results[Math.floor(Math.random() * results.length)];
      
      // Apply the result to the appropriate field
      if (target === 'title') {
        setTitle(randomResult);
      } else {
        setDescription(randomResult);
      }
      
      // End voice recognition
      setIsListening(false);
      setVoiceTarget(null);
      
      // Provide feedback
      handleInteraction('heavy');
    }, 2000);
  };
  
  // Cancel voice input
  const cancelVoiceInput = () => {
    setIsListening(false);
    setVoiceTarget(null);
    handleInteraction('light');
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
                {task ? 'Edit Task' : 'New Task'}
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

            {/* New section navigation */}
            <View style={styles.sectionNav}>
              <TouchableOpacity 
                style={[
                  styles.sectionTab, 
                  focusedSection === 'basic' && [styles.activeTab, {borderBottomColor: theme.colors.primary}]
                ]}
                onPress={() => setFocusedSection('basic')}
              >
                <Text style={[
                  styles.sectionTabText, 
                  {color: focusedSection === 'basic' ? theme.colors.primary : theme.colors.text}
                ]}>
                  Basic
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.sectionTab, 
                  focusedSection === 'details' && [styles.activeTab, {borderBottomColor: theme.colors.primary}]
                ]}
                onPress={() => setFocusedSection('details')}
              >
                <Text style={[
                  styles.sectionTabText, 
                  {color: focusedSection === 'details' ? theme.colors.primary : theme.colors.text}
                ]}>
                  Details
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.sectionTab, 
                  focusedSection === 'subtasks' && [styles.activeTab, {borderBottomColor: theme.colors.primary}]
                ]}
                onPress={() => setFocusedSection('subtasks')}
              >
                <Text style={[
                  styles.sectionTabText, 
                  {color: focusedSection === 'subtasks' ? theme.colors.primary : theme.colors.text}
                ]}>
                  Subtasks
                </Text>
              </TouchableOpacity>
            </View>

            {showQuickAdd && (
              <View 
                style={[styles.quickAddContainer, { backgroundColor: theme.colors.background }]}
                accessibilityLabel="Quick Add Templates"
              >
                <Text style={[
                  styles.sectionLabel, 
                  {color: theme.colors.text, fontWeight: 'bold', marginBottom: 8 }
                ]}>
                  Quick Templates
                </Text>
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
                
                {templates.length > 0 && (
                  <>
                    <Text style={[
                      styles.sectionLabel, 
                      {color: theme.colors.text, fontWeight: 'bold', marginTop: 16, marginBottom: 8 }
                    ]}>
                      Your Templates
                    </Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      accessibilityRole="list"
                    >
                      {templates.map((template) => (
                        <TouchableOpacity
                          key={template.id}
                          style={[
                            styles.quickAddItem, 
                            { 
                              backgroundColor: getPriorityColor(template.priority) + '20',
                              borderLeftWidth: 3,
                              borderLeftColor: getPriorityColor(template.priority)
                            }
                          ]}
                          onPress={() => handleUseTemplate(template)}
                          accessibilityLabel={`Use template ${template.name}`}
                          accessibilityRole="button"
                        >
                          <MaterialCommunityIcons 
                            name="file-document-outline" 
                            size={24} 
                            color={getPriorityColor(template.priority)} 
                          />
                          <Text style={[
                            styles.quickAddText, 
                            { color: theme.colors.text }
                          ]}>
                            {template.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                )}
              </View>
            )}
            
            <ScrollView 
              style={styles.formContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              accessibilityRole="none"
            >
              {focusedSection === 'basic' && (
                <>
                  {/* Title input with AI suggestion button */}
                  <Surface style={[styles.inputSurface, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.titleInputContainer}>
                      <TextInput
                        style={[
                          styles.input, 
                          { 
                            color: theme.colors.text,
                            flex: 1
                          },
                          validationErrors.title && styles.inputError
                        ]}
                        placeholder="What do you need to do?"
                        placeholderTextColor={theme.colors.text + '80'}
                        value={title}
                        onChangeText={handleTitleChange}
                        accessibilityLabel="Task Title"
                        accessibilityHint="Enter the title of your task"
                        accessibilityRole="none"
                      />
                      <TouchableOpacity 
                        style={styles.voiceButton}
                        onPress={() => startVoiceInput('title')}
                        disabled={isListening}
                      >
                        <MaterialCommunityIcons 
                          name="microphone-outline" 
                          size={24} 
                          color={isListening && voiceTarget === 'title' ? 'red' : theme.colors.primary} 
                        />
                      </TouchableOpacity>
                    </View>
                    
                    {showSuggestion && (
                      <View style={styles.suggestionContainer}>
                        <Text style={styles.suggestionText}>
                          Suggestion: {suggestedTitle}
                        </Text>
                        <TouchableOpacity 
                          style={styles.acceptButton}
                          onPress={acceptSuggestion}
                        >
                          <Text style={styles.acceptButtonText}>Use this</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    {isGeneratingSuggestion && (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                        <Text style={{marginLeft: 8, color: theme.colors.text}}>
                          Generating suggestion...
                        </Text>
                      </View>
                    )}
                    
                    {validationErrors.title && (
                      <HelperText type="error" visible={true}>
                        {validationErrors.title}
                      </HelperText>
                    )}
                  </Surface>

                  {/* Description input with enhanced styling */}
                  <Surface style={[styles.inputSurface, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.descriptionContainer}>
                      <TextInput
                        style={[
                          styles.input, 
                          styles.textArea,
                          { 
                            color: theme.colors.text,
                            flex: 1
                          }
                        ]}
                        placeholder="Add details (optional)"
                        placeholderTextColor={theme.colors.text + '80'}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                        accessibilityLabel="Task Description"
                        accessibilityHint="Enter the description of your task"
                        accessibilityRole="none"
                      />
                      <TouchableOpacity 
                        style={styles.voiceButton}
                        onPress={() => startVoiceInput('description')}
                        disabled={isListening}
                      >
                        <MaterialCommunityIcons 
                          name="microphone-outline" 
                          size={24} 
                          color={isListening && voiceTarget === 'description' ? 'red' : theme.colors.primary} 
                        />
                      </TouchableOpacity>
                    </View>
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
                              borderColor: priority === option.value ? option.color : theme.colors.outline,
                              backgroundColor: priority === option.value ? option.color + '20' : 'transparent',
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
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}

              {focusedSection === 'details' && (
                <>
                  {/* Enhanced date/time picker */}
                  <Text style={[styles.label, { color: theme.colors.text }]}>Due Date & Time</Text>
                  <View style={styles.dateTimeContainer}>
                    <TouchableOpacity
                      style={[styles.dateTimeButton, { borderColor: theme.colors.outline }]}
                      onPress={() => openDateTimePicker('date', 'dueDate')}
                    >
                      <MaterialIcons name="event" size={20} color={theme.colors.text} />
                      <Text style={[styles.dateTimeButtonText, { color: theme.colors.text }]}>
                        {dueDate ? format(dueDate, 'EEE, MMM d') : 'Add date'}
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
                        {dueTime ? formatTimeForDisplay(dueTime) : 'Add time'}
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
                            backgroundColor: category === cat.id ? cat.color + '30' : 'transparent',
                          }
                        ]}
                        onPress={() => setCategory(cat.id)}
                      >
                        <View style={[styles.colorIndicator, { backgroundColor: cat.color }]} />
                        <Text style={[
                          styles.categoryText,
                          { color: category === cat.id ? cat.color : theme.colors.text }
                        ]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
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
                  
                  {/* Reminders and recurrence */}
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
                </>
              )}

              {focusedSection === 'subtasks' && (
                /* Add SubTaskList component with improved styling */
                <SubTaskList 
                  taskId={task?.id || 'new'} 
                  subtasks={subtasks}
                  progress={progress}
                  onChange={handleSubtasksChange}
                  isNewTask={!task}
                />
              )}
              
              {/* Add error message display */}
              {error && (
                <View style={[styles.errorContainer, { backgroundColor: theme.colors.error + '20' }]}>
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    {error}
                  </Text>
                </View>
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

            {/* Add voice listening indicator */}
            {isListening && (
              <View style={styles.listeningIndicator}>
                <ActivityIndicator size="small" color="red" />
                <Text style={styles.listeningText}>Listening...</Text>
                <TouchableOpacity
                  style={styles.cancelVoiceButton}
                  onPress={cancelVoiceInput}
                >
                  <Text style={styles.cancelVoiceText}>Cancel</Text>
                </TouchableOpacity>
              </View>
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
    ...Platform.select({
      web: {
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
      },
      default: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      }
    }),
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
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
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
    height: 100,
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
  sectionNav: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  sectionTabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  titleInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiSuggestButton: {
    padding: 8,
  },
  suggestionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginTop: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  acceptButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  smartDateContainer: {
    marginBottom: 16,
  },
  smartDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  smartDateText: {
    marginLeft: 8,
    fontSize: 14,
  },
  smartDateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  smartDateInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  smartDateSubmit: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButton: {
    padding: 8,
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  listeningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(255,0,0,0.1)',
    borderRadius: 16,
    marginVertical: 8,
  },
  listeningText: {
    color: 'red',
    marginLeft: 8,
    flex: 1,
  },
  cancelVoiceButton: {
    backgroundColor: 'rgba(255,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cancelVoiceText: {
    color: 'red',
    fontSize: 12,
  },
}); 