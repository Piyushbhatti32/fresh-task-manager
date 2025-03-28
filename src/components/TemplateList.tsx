import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Button,
  IconButton,
  Surface,
  FAB
} from 'react-native-paper';
import { TaskTemplate } from '../types/Task';
import useTaskStore from '../stores/taskStore';
import { useTheme } from '../theme/ThemeProvider';
import { MaterialIcons, AntDesign, Ionicons } from '@expo/vector-icons';
import databaseService from '../database/DatabaseService';
import AnimatedEmptyState from './AnimatedEmptyState';

// Template type
interface Template {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number; // In minutes
  tags: Array<{ name: string; color: string; }>;
  subtasks: Array<{ title: string; completed: boolean; }>;
  createdAt: string;
}

interface TemplateListProps {
  onSelectTemplate?: (template: Template) => void;
}

const TemplateList: React.FC<TemplateListProps> = ({ onSelectTemplate }) => {
  const { templates, deleteTemplate } = useTaskStore() as any;
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      
      // In a real app, this would get data from the database
      // For now, we'll use mock data
      const mockTemplates: Template[] = [
        {
          id: '1',
          title: 'Daily Standup Meeting',
          description: 'Daily team standup to discuss progress, blockers, and daily plans.',
          priority: 'medium',
          estimatedTime: 15,
          tags: [
            { name: 'Meeting', color: '#9C27B0' },
            { name: 'Recurring', color: '#2196F3' }
          ],
          subtasks: [
            { title: 'Prepare yesterday\'s progress update', completed: false },
            { title: 'List any blockers', completed: false },
            { title: 'Plan today\'s work', completed: false }
          ],
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Weekly Report',
          description: 'Prepare and submit weekly status report to management.',
          priority: 'high',
          estimatedTime: 60,
          tags: [
            { name: 'Report', color: '#4CAF50' },
            { name: 'Recurring', color: '#2196F3' }
          ],
          subtasks: [
            { title: 'Collect weekly metrics', completed: false },
            { title: 'Draft report document', completed: false },
            { title: 'Add visualizations', completed: false },
            { title: 'Submit to manager', completed: false }
          ],
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Bug Fix',
          description: 'Standard template for bug fixing process.',
          priority: 'high',
          estimatedTime: 120,
          tags: [
            { name: 'Development', color: '#FF9800' },
            { name: 'Bug', color: '#F44336' }
          ],
          subtasks: [
            { title: 'Reproduce the issue', completed: false },
            { title: 'Identify root cause', completed: false },
            { title: 'Implement fix', completed: false },
            { title: 'Write tests', completed: false },
            { title: 'Submit PR', completed: false }
          ],
          createdAt: new Date().toISOString()
        },
        {
          id: '4',
          title: 'New Feature Development',
          description: 'Template for implementing new features.',
          priority: 'medium',
          estimatedTime: 480,
          tags: [
            { name: 'Development', color: '#FF9800' },
            { name: 'Feature', color: '#3F51B5' }
          ],
          subtasks: [
            { title: 'Design feature approach', completed: false },
            { title: 'Write technical specification', completed: false },
            { title: 'Implement feature', completed: false },
            { title: 'Add tests', completed: false },
            { title: 'Update documentation', completed: false },
            { title: 'Submit PR', completed: false }
          ],
          createdAt: new Date().toISOString()
        }
      ];
      
      // setTemplates(mockTemplates);
      setError(null);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: Template) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  // Handle template deletion
  const handleDeleteTemplate = (templateId: string, templateName: string) => {
    Alert.alert(
      "Delete Template",
      `Are you sure you want to delete "${templateName}"?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteTemplate(templateId);
            Alert.alert("Success", "Template deleted successfully");
          }
        }
      ]
    );
  };

  // Format creation date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get priority color
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Button onPress={loadTemplates}>Retry</Button>
      </View>
    );
  }

  if (templates.length === 0) {
    return (
      <View style={styles.container}>
        <AnimatedEmptyState 
          message="No templates found" 
          icon="copy-outline" 
        />
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowForm(true)}
        />
      </View>
    );
  }

  const renderTemplateItem = ({ item }: { item: Template }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={[
          styles.priorityIndicator, 
          { backgroundColor: getPriorityColor(item.priority) }
        ]} />

        <Title>{item.title}</Title>
        
        <Paragraph numberOfLines={2} style={styles.description}>
          {item.description}
        </Paragraph>
        
        <View style={styles.metaRow}>
          <Chip 
            icon="clock-outline" 
            style={styles.chip}
          >
            {item.estimatedTime} min
          </Chip>
          
          <Chip 
            icon="format-list-checks" 
            style={styles.chip}
          >
            {item.subtasks.length} subtasks
          </Chip>
        </View>
        
        <View style={styles.tagsContainer}>
          {item.tags.map((tag, index) => (
            <Chip 
              key={index} 
              style={[styles.tagChip, { backgroundColor: tag.color + '30' }]}
              textStyle={{ color: tag.color }}
            >
              {tag.name}
            </Chip>
          ))}
        </View>
      </Card.Content>
      
      <Card.Actions>
        <Button onPress={() => handleSelectTemplate(item)}>
          Use Template
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={templates}
        renderItem={renderTemplateItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
      
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowForm(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
  },
  priorityIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    margin: 16,
  },
  description: {
    marginVertical: 8,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});

export default TemplateList; 