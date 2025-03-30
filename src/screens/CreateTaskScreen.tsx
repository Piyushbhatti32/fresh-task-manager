import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabsParamList } from '../navigation/types';
import { appTheme } from '../theme/AppTheme';
import { useTaskStore } from '../stores/taskStore';
import TaskForm from '../components/TaskForm';
import { Task, TaskTemplate, Priority } from '../types/Task';
import { Button, Chip, Divider } from 'react-native-paper';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

type CreateTaskScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type CreateTaskRouteProp = RouteProp<RootStackParamList, 'CreateTask'>;

type CreateTaskParams = {
  templateId?: string;
};

// Quick actions for common task types
const QUICK_ACTIONS = [
  { id: 'meeting', name: 'Meeting', icon: 'calendar-account', color: '#4285F4' },
  { id: 'email', name: 'Email', icon: 'email-outline', color: '#EA4335' },
  { id: 'call', name: 'Call', icon: 'phone', color: '#34A853' },
  { id: 'deadline', name: 'Deadline', icon: 'clock-time-four-outline', color: '#FBBC05' },
  { id: 'reminder', name: 'Reminder', icon: 'bell-outline', color: '#805AD5' },
];

export default function CreateTaskScreen() {
  const navigation = useNavigation<CreateTaskScreenNavigationProp>();
  const route = useRoute<CreateTaskRouteProp>();
  const params = route.params as CreateTaskParams;
  const { addTask, fetchTasks, templates = [], createTaskFromTemplate } = useTaskStore();
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recentTemplates, setRecentTemplates] = useState<TaskTemplate[]>([]);

  // Check if a template ID was passed as a param
  useEffect(() => {
    if (params?.templateId) {
      const template = templates.find(t => t.id === params.templateId);
      if (template) {
        handleUseTemplate(template);
      }
    }
    
    // Get most recently used templates (up to 3)
    if (templates.length > 0) {
      setRecentTemplates(templates.slice(0, 3));
    }
  }, [params?.templateId, templates]);

  const handleSave = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setIsLoading(true);
      
      // Ensure all required fields are present
      const validatedTaskData = {
        ...taskData,
        title: taskData.title || '',
        description: taskData.description || '',
        priority: taskData.priority || 'low',
        completed: taskData.completed || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addTask(validatedTaskData);
      // Don't fetch tasks again as it causes duplication
      // await fetchTasks();
      
      // Add a small delay to ensure the store is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use navigation.pop() instead of goBack()
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('MainTabs', { screen: 'Home' });
      }
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseTemplate = async (template: TaskTemplate) => {
    try {
      setIsLoading(true);
      await createTaskFromTemplate(template);
      // No need to fetch tasks again since the task will be automatically added to the state
      Alert.alert(
        'Task Created',
        'A new task has been created from the template.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('MainTabs', { screen: 'Home' });
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error using template:', error);
      Alert.alert('Error', 'Failed to create task from template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (actionId: string) => {
    try {
      setIsLoading(true);
      const action = QUICK_ACTIONS.find(a => a.id === actionId);
      
      if (!action) return;
      
      // Create a task with predefined properties based on the quick action
      const now = new Date();
      const dueDate = new Date();
      dueDate.setHours(now.getHours() + 2); // Default due date is 2 hours from now
      
      const taskData = {
        title: `New ${action.name}`,
        description: '',
        priority: actionId === 'deadline' ? 'high' as Priority : 'medium' as Priority,
        dueDate: dueDate.toISOString(),
        completed: false,
      };
      
      await addTask(taskData);
      // Don't fetch tasks again as it causes duplication
      // await fetchTasks();
      
      Alert.alert(
        'Quick Task Created',
        `A new ${action.name.toLowerCase()} task has been created.`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('MainTabs', { screen: 'Home' });
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating quick task:', error);
      Alert.alert('Error', 'Failed to create quick task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <View style={[styles.container, { backgroundColor: appTheme.colors.background }]}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={appTheme.colors.primary} />
        </View>
      )}
      
      <TaskForm
        isVisible={isFormVisible}
        onClose={() => navigation.goBack()}
        onSave={handleSave}
      />

      {/* Float action buttons for template and voice input */}
      <View style={styles.floatingActions}>
        <TouchableOpacity 
          style={[styles.floatingButton, { backgroundColor: appTheme.colors.surface }]}
          onPress={() => setShowTemplateSelector(true)}
        >
          <MaterialCommunityIcons name="lightning-bolt" size={24} color={appTheme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Enhanced template selector modal */}
      <Modal
        visible={showTemplateSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTemplateSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.templateSelector}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Task From Template</Text>
              <TouchableOpacity onPress={() => setShowTemplateSelector(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            {/* Quick action chips */}
            <Text style={styles.sectionTitle}>Quick Create</Text>
            <View style={styles.quickActions}>
              {QUICK_ACTIONS.map(action => (
                <TouchableOpacity
                  key={action.id}
                  style={[styles.quickAction, { backgroundColor: action.color + '20' }]}
                  onPress={() => {
                    handleQuickAction(action.id);
                    setShowTemplateSelector(false);
                  }}
                >
                  <MaterialCommunityIcons name={action.icon} size={24} color={action.color} />
                  <Text style={[styles.quickActionText, { color: action.color }]}>
                    {action.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Divider style={styles.divider} />
            
            {/* Recent templates section */}
            {recentTemplates.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Recent Templates</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentTemplates}>
                  {recentTemplates.map(template => (
                    <TouchableOpacity
                      key={template.id}
                      style={[
                        styles.recentTemplate,
                        { borderLeftColor: getPriorityColor(template.priority) }
                      ]}
                      onPress={() => {
                        handleUseTemplate(template);
                        setShowTemplateSelector(false);
                      }}
                    >
                      <MaterialCommunityIcons 
                        name="file-document-outline" 
                        size={20} 
                        color={getPriorityColor(template.priority)} 
                      />
                      <Text style={styles.recentTemplateName} numberOfLines={1}>
                        {template.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                
                <Divider style={styles.divider} />
              </>
            )}
            
            {/* All templates section */}
            <Text style={styles.sectionTitle}>All Templates</Text>
            <ScrollView style={styles.templateList}>
              {templates.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="file-document-outline" size={48} color="#888" />
                  <Text style={styles.emptyText}>No templates found</Text>
                  <Text style={styles.emptySubtext}>Create templates in the Templates tab</Text>
                </View>
              ) : (
                templates.map(template => (
                  <TouchableOpacity 
                    key={template.id}
                    style={[
                      styles.templateItem,
                      {
                        borderLeftColor: getPriorityColor(template.priority),
                        borderLeftWidth: 4
                      }
                    ]}
                    onPress={() => {
                      handleUseTemplate(template);
                      setShowTemplateSelector(false);
                    }}
                  >
                    <View>
                      <Text style={styles.templateName}>{template.name}</Text>
                      <Text style={styles.templateDesc} numberOfLines={2}>
                        {template.description || template.title}
                      </Text>
                      {template.subtasks && template.subtasks.length > 0 && (
                        <Text style={styles.templateMeta}>
                          {template.subtasks.length} subtasks
                        </Text>
                      )}
                    </View>
                    <MaterialCommunityIcons name="arrow-right" size={24} color="#888" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <Button 
              mode="outlined" 
              onPress={() => {
                navigation.navigate('MainTabs', { screen: 'Templates' });
                setShowTemplateSelector(false);
              }}
              style={styles.browseButton}
            >
              Manage Templates
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  floatingActions: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    flexDirection: 'row',
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    marginLeft: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  templateSelector: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  quickActionText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  divider: {
    marginVertical: 16,
  },
  recentTemplates: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  recentTemplate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderLeftWidth: 3,
  },
  recentTemplateName: {
    marginLeft: 8,
    fontWeight: '500',
    maxWidth: 120,
  },
  templateList: {
    marginBottom: 16,
    maxHeight: 350,
  },
  templateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 12,
    elevation: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  templateDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  templateMeta: {
    fontSize: 12,
    color: '#888',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  browseButton: {
    marginTop: 8,
    marginBottom: 8,
  }
}); 