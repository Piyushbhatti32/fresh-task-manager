import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Text, Card, Button, Chip, Divider, IconButton, FAB, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTaskStore } from '../stores/taskStore';
import { useTheme } from '../theme/ThemeProvider';
import { RootStackParamList } from '../navigation/types';

type TemplateDetailRouteProp = RouteProp<RootStackParamList, 'TemplateDetail'>;

export default function TemplateDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<TemplateDetailRouteProp>();
  const { templateId } = route.params;
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Use templates from the store with a default empty array to prevent "find of undefined" errors
  const { templates = [], deleteTemplate, createTaskFromTemplate } = useTaskStore() as any;
  
  useEffect(() => {
    loadTemplateDetails();
  }, [templateId, templates]);
  
  const loadTemplateDetails = () => {
    setLoading(true);
    setError(null);
    
    try {
      // Safely check if templates exists before calling find
      if (!templates || !Array.isArray(templates)) {
        throw new Error('Templates data is not available');
      }
      
      // Find the template by ID from the store
      const foundTemplate = templates.find((t: any) => t.id === templateId);
      
      if (foundTemplate) {
        setTemplate(foundTemplate);
      } else {
        setError('Template not found');
        // Don't navigate away immediately, show error state instead
      }
    } catch (err) {
      console.error('Error loading template:', err);
      setError('Failed to load template details');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUseTemplate = () => {
    if (!template) return;
    
    try {
      // Use the store function to create a task from this template
      createTaskFromTemplate(template);
      Alert.alert('Success', 'Task created from template!');
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error using template:', error);
      Alert.alert('Error', 'Failed to use template');
    }
  };
  
  const handleEditTemplate = () => {
    // Navigate to edit screen (can reuse CreateTemplate with params)
    navigation.navigate('CreateTemplate', { templateId });
  };
  
  const handleDeleteTemplate = () => {
    Alert.alert(
      'Delete Template',
      'Are you sure you want to delete this template?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            try {
              deleteTemplate(templateId);
              Alert.alert('Success', 'Template deleted successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting template:', error);
              Alert.alert('Error', 'Failed to delete template');
            }
          }
        }
      ]
    );
  };
  
  const handleRetry = () => {
    loadTemplateDetails();
  };
  
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  if (error || !template) {
    return (
      <View style={[styles.container, styles.centeredContent, { backgroundColor: theme.colors.background }]}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={64}
          color={theme.colors.error}
        />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error || 'Template not found'}
        </Text>
        <Button 
          mode="contained" 
          onPress={handleRetry}
          style={{ marginTop: 16 }}
        >
          Retry
        </Button>
        <Button 
          mode="outlined" 
          onPress={() => navigation.goBack()}
          style={{ marginTop: 12 }}
        >
          Go Back
        </Button>
      </View>
    );
  }
  
  // Get priority color with fallback for safety
  const getPriorityColor = (priority: string | undefined) => {
    if (!priority) return '#BDBDBD';
    
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.headerRow}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {template.name || template.title || 'Untitled Template'}
              </Text>
              
              {template.priority && (
                <Chip 
                  style={{ backgroundColor: getPriorityColor(template.priority) }}
                  textStyle={{ color: '#fff' }}
                >
                  {template.priority}
                </Chip>
              )}
            </View>
            
            <Text style={[styles.description, { color: theme.colors.text }]}>
              {template.description || 'No description provided'}
            </Text>
            
            {template.tags && template.tags.length > 0 && (
              <ScrollView 
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tagsContainer}
                contentContainerStyle={styles.tagsContent}
              >
                {template.tags.map((tag: any, index: number) => (
                  <Chip 
                    key={index}
                    style={styles.tag}
                    textStyle={{ color: isDark ? '#fff' : theme.colors.text }}
                  >
                    {typeof tag === 'string' ? tag : tag.name}
                  </Chip>
                ))}
              </ScrollView>
            )}
            
            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { color: theme.colors.text }]}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.primary} />
                {' '}Estimated time: {template.estimatedTime || 0} minutes
              </Text>
              <Text style={[styles.metaText, { color: theme.colors.text }]}>
                <MaterialCommunityIcons name="calendar-outline" size={16} color={theme.colors.primary} />
                {' '}Created: {template.createdAt ? new Date(template.createdAt).toLocaleDateString() : 'Unknown'}
              </Text>
            </View>
          </Card.Content>
        </Card>
        
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Tasks ({template.subtasks?.length || template.tasks?.length || 0})
            </Text>
            
            {/* Use either subtasks or tasks property, depending on what's available */}
            {(template.subtasks || template.tasks || []).length > 0 ? (
              <ScrollView style={styles.taskListContainer}>
                {(template.subtasks || template.tasks || []).map((task: any, index: number) => (
                  <View key={index} style={styles.taskItem}>
                    <MaterialCommunityIcons 
                      name="circle-small" 
                      size={24} 
                      color={theme.colors.primary} 
                      style={styles.taskBullet}
                    />
                    <Text style={[styles.taskText, { color: theme.colors.text }]}>
                      {task.title || task.name || `Task ${index + 1}`}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={[styles.emptyText, { color: theme.colors.placeholder }]}>
                No tasks defined in this template
              </Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <Button 
          mode="contained" 
          onPress={handleUseTemplate}
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          icon="arrow-right"
        >
          Use Template
        </Button>
      </View>
      
      <FAB
        icon="pencil"
        style={[styles.editFab, { backgroundColor: theme.colors.primary }]}
        onPress={handleEditTemplate}
      />
      
      <FAB
        icon="delete"
        style={[styles.deleteFab, { backgroundColor: theme.colors.error }]}
        onPress={handleDeleteTemplate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
  },
  tagsContainer: {
    marginBottom: 16,
  },
  tagsContent: {
    paddingRight: 16,
  },
  tag: {
    marginRight: 8,
    marginBottom: 8,
  },
  metaRow: {
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  taskListContainer: {
    maxHeight: 250,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskBullet: {
    marginRight: 8,
  },
  taskText: {
    fontSize: 16,
  },
  emptyText: {
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  buttonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    padding: 8,
  },
  editFab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 80,
  },
  deleteFab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 140,
  },
}); 