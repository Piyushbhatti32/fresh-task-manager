import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTaskStore } from '../stores/taskStore';
import { TaskTemplate, Priority } from '../types/Task';
import { useTheme } from '../theme/ThemeProvider';
import { AntDesign } from '@expo/vector-icons';

interface TemplateFormProps {
  template?: TaskTemplate;
  isVisible: boolean;
  onClose: () => void;
  sourceTaskId?: string; // For creating template from task
}

const TemplateForm: React.FC<TemplateFormProps> = ({
  template,
  isVisible,
  onClose,
  sourceTaskId
}) => {
  const isEditing = !!template;
  const { theme, isDark } = useTheme();
  const { 
    addTemplate, 
    updateTemplate, 
    categories,
    saveTaskAsTemplate
  } = useTaskStore() as any;

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [dueTimeOffset, setDueTimeOffset] = useState<string>('');
  const [subtasks, setSubtasks] = useState<Array<{ title: string }>>([]);
  const [newSubtask, setNewSubtask] = useState('');

  // Initialize form with template values when editing
  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setTitle(template.title);
      setTaskDescription(template.taskDescription || '');
      setPriority(template.priority);
      setCategoryId(template.categoryId);
      if (template.dueTimeOffset) {
        setDueTimeOffset(template.dueTimeOffset.toString());
      }
      if (template.subtasks) {
        setSubtasks([...template.subtasks]);
      }
    } else {
      // Reset form when creating new template
      resetForm();
    }
  }, [template, isVisible]);

  // Reset form fields
  const resetForm = () => {
    setName('');
    setDescription('');
    setTitle('');
    setTaskDescription('');
    setPriority('medium');
    setCategoryId(undefined);
    setDueTimeOffset('');
    setSubtasks([]);
    setNewSubtask('');
  };

  // Add subtask to list
  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, { title: newSubtask.trim() }]);
      setNewSubtask('');
    }
  };

  // Remove subtask from list
  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  // Save template
  const handleSave = async () => {
    // Validate required fields
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a template name');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    try {
      if (sourceTaskId) {
        // Creating from existing task
        await saveTaskAsTemplate(sourceTaskId, name, description);
        Alert.alert('Success', 'Task saved as template');
      } else if (isEditing && template) {
        // Update existing template
        await updateTemplate(template.id, {
          name,
          description,
          title,
          taskDescription,
          priority,
          categoryId,
          dueTimeOffset: dueTimeOffset ? parseInt(dueTimeOffset) : undefined,
          subtasks
        });
        Alert.alert('Success', 'Template updated');
      } else {
        // Create new template
        await addTemplate({
          name,
          description,
          title,
          taskDescription,
          priority,
          categoryId,
          dueTimeOffset: dueTimeOffset ? parseInt(dueTimeOffset) : undefined,
          subtasks
        });
        Alert.alert('Success', 'Template created');
      }
      
      resetForm();
      onClose();
    } catch (error) {
      console.error('Failed to save template:', error);
      Alert.alert('Error', 'Failed to save template');
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[
        styles.modalContainer,
        { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }
      ]}>
        <View style={[
          styles.modalContent,
          { backgroundColor: isDark ? '#222' : '#fff' }
        ]}>
          <View style={styles.header}>
            <Text style={[styles.heading, { color: theme.colors.text }]}>
              {isEditing ? 'Edit Template' : sourceTaskId ? 'Save as Template' : 'Create Template'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <AntDesign name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Template Name*</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    color: theme.colors.text,
                    backgroundColor: isDark ? '#333' : '#f5f5f5',
                    borderColor: isDark ? '#444' : '#ddd'
                  }
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Enter template name"
                placeholderTextColor={isDark ? '#999' : '#aaa'}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Description</Text>
              <TextInput
                style={[
                  styles.textArea,
                  { 
                    color: theme.colors.text,
                    backgroundColor: isDark ? '#333' : '#f5f5f5',
                    borderColor: isDark ? '#444' : '#ddd'
                  }
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter template description"
                placeholderTextColor={isDark ? '#999' : '#aaa'}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {!sourceTaskId && (
              <>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>Task Title*</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { 
                        color: theme.colors.text,
                        backgroundColor: isDark ? '#333' : '#f5f5f5',
                        borderColor: isDark ? '#444' : '#ddd'
                      }
                    ]}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Enter task title"
                    placeholderTextColor={isDark ? '#999' : '#aaa'}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>Task Description</Text>
                  <TextInput
                    style={[
                      styles.textArea,
                      { 
                        color: theme.colors.text,
                        backgroundColor: isDark ? '#333' : '#f5f5f5',
                        borderColor: isDark ? '#444' : '#ddd'
                      }
                    ]}
                    value={taskDescription}
                    onChangeText={setTaskDescription}
                    placeholder="Enter task description"
                    placeholderTextColor={isDark ? '#999' : '#aaa'}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>Priority</Text>
                  <View style={[
                    styles.pickerContainer,
                    { borderColor: isDark ? '#444' : '#ddd' }
                  ]}>
                    <Picker
                      selectedValue={priority}
                      onValueChange={(itemValue) => setPriority(itemValue as Priority)}
                      style={[styles.picker, { color: theme.colors.text }]}
                      dropdownIconColor={theme.colors.text}
                    >
                      <Picker.Item label="Low" value="low" />
                      <Picker.Item label="Medium" value="medium" />
                      <Picker.Item label="High" value="high" />
                    </Picker>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>Category</Text>
                  <View style={[
                    styles.pickerContainer,
                    { borderColor: isDark ? '#444' : '#ddd' }
                  ]}>
                    <Picker
                      selectedValue={categoryId}
                      onValueChange={(itemValue) => setCategoryId(itemValue)}
                      style={[styles.picker, { color: theme.colors.text }]}
                      dropdownIconColor={theme.colors.text}
                    >
                      <Picker.Item label="Select a category" value={undefined} />
                      {categories.map((category: any) => (
                        <Picker.Item 
                          key={category.id} 
                          label={category.name} 
                          value={category.id} 
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>Due in Days</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { 
                        color: theme.colors.text,
                        backgroundColor: isDark ? '#333' : '#f5f5f5',
                        borderColor: isDark ? '#444' : '#ddd'
                      }
                    ]}
                    value={dueTimeOffset}
                    onChangeText={(text) => setDueTimeOffset(text.replace(/[^0-9]/g, ''))}
                    placeholder="How many days from creation (e.g., 7)"
                    placeholderTextColor={isDark ? '#999' : '#aaa'}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>Subtasks</Text>
                  <View style={styles.subtaskInputContainer}>
                    <TextInput
                      style={[
                        styles.subtaskInput,
                        { 
                          color: theme.colors.text,
                          backgroundColor: isDark ? '#333' : '#f5f5f5',
                          borderColor: isDark ? '#444' : '#ddd'
                        }
                      ]}
                      value={newSubtask}
                      onChangeText={setNewSubtask}
                      placeholder="Enter subtask"
                      placeholderTextColor={isDark ? '#999' : '#aaa'}
                      onSubmitEditing={handleAddSubtask}
                    />
                    <TouchableOpacity
                      style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                      onPress={handleAddSubtask}
                    >
                      <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                  </View>

                  {subtasks.length > 0 && (
                    <View style={styles.subtaskList}>
                      {subtasks.map((subtask, index) => (
                        <View key={index} style={styles.subtaskItem}>
                          <Text 
                            style={[styles.subtaskTitle, { color: theme.colors.text }]}
                            numberOfLines={1}
                          >
                            {subtask.title}
                          </Text>
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => handleRemoveSubtask(index)}
                          >
                            <AntDesign name="close" size={16} color={theme.colors.text} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { borderColor: theme.colors.primary }]}
                onPress={onClose}
              >
                <Text style={[styles.buttonText, { color: theme.colors.primary }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.saveButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSave}
              >
                <Text style={[styles.buttonText, styles.saveButtonText]}>
                  {isEditing ? 'Update' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 48,
  },
  subtaskInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtaskInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginRight: 8,
  },
  addButton: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  subtaskList: {
    marginTop: 12,
  },
  subtaskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 6,
    marginVertical: 4,
  },
  subtaskTitle: {
    flex: 1,
    fontSize: 16,
  },
  removeButton: {
    padding: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    marginRight: 8,
  },
  saveButton: {
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#fff',
  },
});

export default TemplateForm; 