import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  Animated,
  ScrollView
} from 'react-native';
import { 
  Text, 
  Searchbar, 
  FAB, 
  Card,
  Chip,
  IconButton,
  Button,
  Menu,
  Divider,
  SegmentedButtons,
  ActivityIndicator,
  useTheme
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { TemplatesScreenNavigationProp } from '../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTaskStore } from '../stores/taskStore';
import Skeleton from '../components/Skeleton';

interface Template {
  id: string;
  name: string;
  description: string;
  tasks: any[];
  lastUsed?: string;
  priority?: 'high' | 'medium' | 'low';
  tags?: string[];
  createdAt?: string;
}

export default function TemplatesScreen() {
  const navigation = useNavigation<TemplatesScreenNavigationProp>();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent');
  const [filterVisible, setFilterVisible] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Get templates from store
  const { templates: storeTemplates } = useTaskStore() as any;
  
  useEffect(() => {
    // Fetch templates on component mount
    const loadData = async () => {
      setLoading(true);
      try {
        await useTaskStore.getState().fetchTemplates();
        // Get templates from store after fetching
        const storeData = useTaskStore.getState().templates || [];
        // Convert TaskTemplate[] to Template[] by adding required properties
        const formattedTemplates = storeData.map((template: any) => ({
          id: template.id,
          name: template.name || template.title,
          description: template.description || '',
          tasks: template.subtasks || [],
          priority: template.priority,
          tags: Array.isArray(template.subtasks) 
            ? template.subtasks.map((s: any) => s.title) 
            : [],
          createdAt: template.createdAt ? new Date(template.createdAt).toISOString() : new Date().toISOString()
        }));
        setTemplates(formattedTemplates);
        
        // Fade in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        }).start();
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading templates:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Add another effect to update when storeTemplates changes
  useEffect(() => {
    if (storeTemplates && Array.isArray(storeTemplates) && storeTemplates.length > 0) {
      // Convert TaskTemplate[] to Template[] by adding required properties
      const formattedTemplates = storeTemplates.map((template: any) => ({
        id: template.id,
        name: template.name || template.title,
        description: template.description || '',
        tasks: template.subtasks || [],
        priority: template.priority,
        tags: Array.isArray(template.subtasks) 
          ? template.subtasks.map((s: any) => s.title) 
          : [],
        createdAt: template.createdAt ? new Date(template.createdAt).toISOString() : new Date().toISOString()
      }));
      setTemplates(formattedTemplates);
      
      // Start fade in animation (without checking value)
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }).start();
    }
  }, [storeTemplates]);
  
  // Filter and sort templates
  const processedTemplates = templates
    // Filter by search query
    .filter(template => 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    // Filter by priority
    .filter(template => 
      !selectedPriority || template.priority === selectedPriority
    )
    // Filter by tags
    .filter(template => 
      filterTags.length === 0 || 
      (template.tags && template.tags.some(tag => filterTags.includes(tag)))
    )
    // Sort templates
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'tasks':
          return (b.tasks?.length || 0) - (a.tasks?.length || 0);
        default:
          return 0;
      }
    });
  
  // Extract all unique tags from templates
  const allTags = Array.from(new Set(
    templates.flatMap(template => template.tags || [])
  ));
  
  const renderGridItem = ({ item }: { item: Template }) => (
    <Animated.View style={{ opacity: fadeAnim, width: '48%' }}>
      <TouchableOpacity
        onPress={() => navigation.navigate('TemplateDetail', { templateId: item.id })}
        style={styles.gridItem}
      >
        <Card style={[styles.templateCard, { backgroundColor: colors.surface }]}>
          <Card.Content>
            {item.priority && (
              <View style={[
                styles.priorityIndicator, 
                { backgroundColor: getPriorityColor(item.priority) }
              ]} />
            )}
            
            <Text style={styles.templateName} numberOfLines={1}>
              {item.name}
            </Text>
            
            <Text style={styles.templateDescription} numberOfLines={2}>
              {item.description || 'No description'}
            </Text>
            
            {item.tags && item.tags.length > 0 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.tagsContainer}
              >
                {item.tags.map((tag, index) => (
                  <Chip 
                    key={index}
                    style={styles.tag}
                    textStyle={{ fontSize: 10 }}
                    compact
                  >
                    {tag}
                  </Chip>
                ))}
              </ScrollView>
            )}
            
            <View style={styles.templateStats}>
              <Text style={styles.templateStat}>
                <MaterialCommunityIcons name="checkbox-marked-outline" size={12} color={colors.primary} />
                {' '}{item.tasks?.length || 0} tasks
              </Text>
              <Text style={styles.templateStat}>
                {item.lastUsed ? `Last used: ${formatDate(new Date(item.lastUsed))}` : 'Never used'}
              </Text>
            </View>
          </Card.Content>
          
          <Card.Actions style={styles.cardActions}>
            <IconButton
              icon="content-copy"
              size={20}
              onPress={() => handleDuplicateTemplate(item)}
            />
            <IconButton
              icon="arrow-right"
              size={20}
              onPress={() => navigation.navigate('TemplateDetail', { templateId: item.id })}
            />
          </Card.Actions>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
  
  const renderListItem = ({ item }: { item: Template }) => (
    <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
      <Card style={[styles.listCard, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <View style={styles.listItemHeader}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.templateName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.templateDescription} numberOfLines={2}>
                {item.description || 'No description'}
              </Text>
            </View>
            
            {item.priority && (
              <Chip style={{ backgroundColor: getPriorityColor(item.priority) }}>
                {item.priority}
              </Chip>
            )}
          </View>
          
          {item.tags && item.tags.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.tagsContainer}
            >
              {item.tags.map((tag, index) => (
                <Chip 
                  key={index}
                  style={styles.tag}
                  textStyle={{ fontSize: 10 }}
                  compact
                >
                  {tag}
                </Chip>
              ))}
            </ScrollView>
          )}
          
          <View style={styles.templateStats}>
            <Text style={styles.templateStat}>
              <MaterialCommunityIcons name="checkbox-marked-outline" size={12} color={colors.primary} />
              {' '}{item.tasks?.length || 0} tasks
            </Text>
            <Text style={styles.templateStat}>
              {item.lastUsed ? `Last used: ${formatDate(new Date(item.lastUsed))}` : 'Never used'}
            </Text>
          </View>
        </Card.Content>
        
        <Card.Actions style={styles.cardActions}>
          <Button 
            mode="text" 
            onPress={() => handleDuplicateTemplate(item)}>
            Duplicate
          </Button>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('TemplateDetail', { templateId: item.id })}>
            View
          </Button>
        </Card.Actions>
      </Card>
    </Animated.View>
  );
  
  const handleDuplicateTemplate = (template: Template) => {
    // Implementation would depend on the store's methods
    console.log('Duplicate template:', template.id);
  };
  
  // Helper function to format dates
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get color based on priority
  const getPriorityColor = (priority: string) => {
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
  
  // Mock data for development
  const mockTemplates: Template[] = [
    {
      id: '1',
      name: 'Daily Standup',
      description: 'Template for daily team meetings',
      tasks: [{id: '1'}, {id: '2'}, {id: '3'}],
      lastUsed: new Date().toISOString(),
      priority: 'medium',
      tags: ['Meeting', 'Daily', 'Team'],
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Sprint Planning',
      description: 'Prepare for next sprint planning session',
      tasks: [{id: '4'}, {id: '5'}, {id: '6'}, {id: '7'}],
      priority: 'high',
      tags: ['Planning', 'Sprint', 'Agile'],
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '3',
      name: 'Bug Fixing Process',
      description: 'Standard procedure for addressing and documenting bugs',
      tasks: [{id: '8'}, {id: '9'}],
      lastUsed: new Date(Date.now() - 172800000).toISOString(),
      priority: 'high',
      tags: ['Development', 'Bugs'],
      createdAt: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: '4',
      name: 'Client Meeting',
      description: 'Prepare for client status meetings',
      tasks: [{id: '10'}, {id: '11'}, {id: '12'}, {id: '13'}],
      priority: 'low',
      tags: ['Client', 'Meeting', 'External'],
      createdAt: new Date(Date.now() - 259200000).toISOString()
    }
  ];
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Templates</Text>
        
        <View style={styles.headerActions}>
          <IconButton
            icon={viewMode === 'grid' ? 'view-list' : 'view-grid'}
            size={24}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          />
          
          <IconButton
            icon="filter-variant"
            size={24}
            onPress={() => setFilterVisible(!filterVisible)}
            style={{
              backgroundColor: (selectedPriority || filterTags.length > 0) 
                ? colors.primary + '20' 
                : undefined
            }}
          />
          
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={24}
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            <Menu.Item 
              onPress={() => {
                setSortBy('recent');
                setMenuVisible(false);
              }} 
              title="Sort by recent" 
              leadingIcon={sortBy === 'recent' ? 'check' : undefined}
            />
            <Menu.Item 
              onPress={() => {
                setSortBy('name');
                setMenuVisible(false);
              }} 
              title="Sort by name" 
              leadingIcon={sortBy === 'name' ? 'check' : undefined}
            />
            <Menu.Item 
              onPress={() => {
                setSortBy('tasks');
                setMenuVisible(false);
              }} 
              title="Sort by tasks count" 
              leadingIcon={sortBy === 'tasks' ? 'check' : undefined}
            />
            <Divider />
            <Menu.Item 
              onPress={() => {
                navigation.navigate('CreateTemplate');
                setMenuVisible(false);
              }} 
              title="Create template" 
              leadingIcon="plus"
            />
          </Menu>
        </View>
      </View>
      
      <Searchbar
        placeholder="Search templates..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      {filterVisible && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterTitle}>Filter by:</Text>
          
          <Text style={styles.filterLabel}>Priority</Text>
          <SegmentedButtons
            value={selectedPriority || ''}
            onValueChange={(value) => setSelectedPriority(value === '' ? null : value)}
            buttons={[
              { value: '', label: 'All', style: { backgroundColor: 'transparent' } },
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
            style={styles.segmentedButtons}
          />
          
          <Text style={styles.filterLabel}>Tags</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.tagFilters}
          >
            {allTags.map((tag, index) => (
              <Chip
                key={index}
                style={[
                  styles.tagChip,
                  { 
                    backgroundColor: filterTags.includes(tag) ? colors.primary : colors.surfaceVariant,
                  }
                ]}
                textStyle={{ 
                  color: filterTags.includes(tag) ? 'white' : '#1C1B1F'
                }}
                onPress={() => {
                  if (filterTags.includes(tag)) {
                    setFilterTags(filterTags.filter(t => t !== tag));
                  } else {
                    setFilterTags([...filterTags, tag]);
                  }
                }}
              >
                {tag}
              </Chip>
            ))}
          </ScrollView>
          
          <Button 
            mode="text" 
            onPress={() => {
              setSelectedPriority(null);
              setFilterTags([]);
            }}
            style={styles.clearButton}
          >
            Clear Filters
          </Button>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map((_, index) => (
            <View key={index} style={[styles.templateCard, { marginBottom: 16 }]}>
              <Skeleton width="70%" height={24} style={{ marginBottom: 8 }} />
              <Skeleton width="100%" height={16} style={{ marginBottom: 4 }} />
              <Skeleton width="90%" height={16} style={{ marginBottom: 12 }} />
              <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                <Skeleton width={80} height={20} style={{ marginRight: 8 }} />
                <Skeleton width={80} height={20} />
              </View>
            </View>
          ))}
        </View>
      ) : processedTemplates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: '#1C1B1F' }]}>
            No templates yet
          </Text>
          <Text style={[styles.emptySubtext, { color: '#49454F' }]}>
            Create templates to speed up your task creation process
          </Text>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('CreateTemplate')}
            style={{ marginTop: 16 }}
          >
            Create Your First Template
          </Button>
        </View>
      ) : (
        <FlatList
          data={processedTemplates}
          renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          numColumns={viewMode === 'grid' ? 2 : 1}
          columnWrapperStyle={viewMode === 'grid' ? styles.gridColumnWrapper : undefined}
          key={viewMode} // Forces remount when switching view modes
        />
      )}

      <FAB
        style={[styles.fab, { backgroundColor: colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate('CreateTemplate')}
      />
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
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
  },
  searchBar: {
    margin: 16,
    marginTop: 8,
    elevation: 0,
  },
  listContent: {
    padding: 16,
    width: '100%', 
  },
  gridItem: {
    flex: 1,
    margin: 4,
    maxWidth: '100%',
  },
  gridColumnWrapper: {
    justifyContent: 'space-between',
    width: '100%',
  },
  templateCard: {
    elevation: 2,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  listCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    width: '100%',  
  },
  priorityIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  templateDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  templateStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  templateStat: {
    fontSize: 12,
    color: '#666',
  },
  tagsContainer: {
    flexDirection: 'row',
    marginVertical: 8,
    maxWidth: '100%',
  },
  tag: {
    marginRight: 4,
    marginBottom: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    padding: 16,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    width: '100%',
  },
  cardActions: {
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  filterContainer: {
    padding: 16,
    paddingTop: 0,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  tagFilters: {
    marginBottom: 16,
  },
  tagChip: {
    marginRight: 8,
  },
  clearButton: {
    alignSelf: 'flex-end',
  }
}); 