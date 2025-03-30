import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Button,
  IconButton,
  Surface,
  FAB,
  Divider,
  Searchbar
} from 'react-native-paper';
import { TaskTemplate } from '../types/Task';
import { useTaskStore } from '../stores/taskStore';
import { useTheme } from '../theme/ThemeProvider';
import { MaterialIcons, AntDesign, Ionicons } from '@expo/vector-icons';
import databaseService from '../database/DatabaseService';
import AnimatedEmptyState from './AnimatedEmptyState';
import Skeleton from './Skeleton';

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
  const { templates: storeTemplates, deleteTemplate } = useTaskStore() as any;
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    loadTemplates();
  }, [storeTemplates]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      
      // Use store templates if available, otherwise use mock data
      if (storeTemplates && Array.isArray(storeTemplates)) {
        setTemplates(storeTemplates);
      } else {
        // Mock templates for development/fallback
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
        
        setTemplates(mockTemplates);
        console.log('Using mock templates as fallback');
      }
      
      setError(null);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Failed to load templates');
      // Set empty array on error to prevent undefined
      setTemplates([]);
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
  const handleDeleteTemplate = (id: string) => {
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
              deleteTemplate(id);
              // After deletion, refresh the list
              loadTemplates();
            } catch (err) {
              console.error('Error deleting template:', err);
              setError('Failed to delete template');
            }
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
      <View style={styles.loadingContainer}>
        <View style={styles.skeletonContainer}>
          {[1, 2, 3].map((_, index) => (
            <View key={index} style={[styles.card, { backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5', marginBottom: 16 }]}>
              <Skeleton width="70%" height={24} style={{ marginBottom: 8 }} />
              <Skeleton width="100%" height={16} style={{ marginBottom: 4 }} />
              <Skeleton width="90%" height={16} style={{ marginBottom: 12 }} />
              <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                <Skeleton width={80} height={20} style={{ marginRight: 8 }} />
                <Skeleton width={80} height={20} />
              </View>
              <View style={{ flexDirection: 'row' }}>
                <Skeleton width={60} height={28} style={{ marginRight: 8, borderRadius: 14 }} />
                <Skeleton width={70} height={28} style={{ marginRight: 8, borderRadius: 14 }} />
                <Skeleton width={80} height={28} style={{ borderRadius: 14 }} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <IconButton
          icon="alert-circle"
          size={48}
          iconColor={theme.colors.error}
        />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        <Button 
          mode="contained" 
          onPress={loadTemplates} 
          style={styles.retryButton}
          icon="refresh"
        >
          Retry
        </Button>
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

  const renderTemplateItem = ({ item }: { item: Template }) => {
    // Safely get subtasks count
    const subtasksCount = item.subtasks?.length || 0;
    
    // Safely format date
    const formattedDate = item.createdAt 
      ? formatDate(new Date(item.createdAt)) 
      : 'Unknown date';
    
    // Get priority color safely
    const priorityColor = item.priority 
      ? getPriorityColor(item.priority) 
      : theme.colors.placeholder;

    return (
      <Card
        style={[
          styles.card,
          { backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5' }
        ]}
        onPress={() => item && item.id && handleSelectTemplate(item)}
      >
        <Card.Content>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {item.title || 'Untitled Template'}
            </Text>
            <View style={[styles.priorityIndicator, { backgroundColor: priorityColor }]} />
          </View>
          
          <Text style={[styles.description, { color: theme.colors.text }]} numberOfLines={2}>
            {item.description || 'No description'}
          </Text>
          
          <View style={styles.statsRow}>
            <Text style={[styles.stats, { color: theme.colors.text }]}>
              Subtasks: {subtasksCount}
            </Text>
            <Text style={[styles.stats, { color: theme.colors.text }]}>
              Est. time: {item.estimatedTime || 0} min
            </Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.tagsContainer}
          >
            {item.tags && item.tags.length > 0 ? (
              item.tags.map((tag, index) => (
                <Chip 
                  key={index} 
                  style={[styles.tag, { backgroundColor: tag.color || theme.colors.primary }]}
                  textStyle={{ color: '#fff' }}
                >
                  {tag.name}
                </Chip>
              ))
            ) : (
              <Chip 
                style={[styles.tag, { backgroundColor: theme.colors.placeholder }]}
                textStyle={{ color: '#fff' }}
              >
                No tags
              </Chip>
            )}
          </ScrollView>
          
          <Text style={[styles.date, { color: theme.colors.text }]}>
            Created: {formattedDate}
          </Text>
        </Card.Content>
        <Card.Actions>
          <Button
            mode="text"
            onPress={() => item && item.id && handleDeleteTemplate(item.id)}
            textColor={theme.colors.error}
          >
            Delete
          </Button>
          <Button
            mode="text"
            onPress={() => item && item.id && handleSelectTemplate(item)}
            textColor={theme.colors.primary}
          >
            Use Template
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.skeletonContainer}>
            {[1, 2, 3].map((_, index) => (
              <View key={index} style={[styles.card, { backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5', marginBottom: 16 }]}>
                <Skeleton width="70%" height={24} style={{ marginBottom: 8 }} />
                <Skeleton width="100%" height={16} style={{ marginBottom: 4 }} />
                <Skeleton width="90%" height={16} style={{ marginBottom: 12 }} />
                <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                  <Skeleton width={80} height={20} style={{ marginRight: 8 }} />
                  <Skeleton width={80} height={20} />
                </View>
                <View style={{ flexDirection: 'row' }}>
                  <Skeleton width={60} height={28} style={{ marginRight: 8, borderRadius: 14 }} />
                  <Skeleton width={70} height={28} style={{ marginRight: 8, borderRadius: 14 }} />
                  <Skeleton width={80} height={28} style={{ borderRadius: 14 }} />
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <IconButton
            icon="alert-circle"
            size={48}
            iconColor={theme.colors.error}
          />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          <Button 
            mode="contained" 
            onPress={loadTemplates} 
            style={styles.retryButton}
            icon="refresh"
          >
            Retry
          </Button>
        </View>
      ) : templates && templates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>No templates found</Text>
          <Button 
            mode="contained" 
            onPress={() => setShowForm(true)} 
            style={styles.createButton}
          >
            Create Your First Template
          </Button>
        </View>
      ) : (
        <FlatList
          data={templates || []}
          keyExtractor={(item) => item.id}
          renderItem={renderTemplateItem}
          contentContainerStyle={styles.list}
        />
      )}
      
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
    marginVertical: 16,
    fontSize: 16,
    textAlign: 'center',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  skeletonContainer: {
    width: '100%',
    padding: 16,
  },
  retryButton: {
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginBottom: 16,
  },
  createButton: {
    marginTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  stats: {
    marginRight: 16,
  },
  date: {
    marginTop: 8,
  },
  tag: {
    marginRight: 8,
    marginBottom: 8,
  },
});

export default TemplateList; 