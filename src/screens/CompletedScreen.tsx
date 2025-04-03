import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Chip, Divider, Menu, Surface, IconButton, Portal, Modal, Button, useTheme as usePaperTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeProvider';
import { useTaskStore } from '../stores/taskStore';
import { Task } from '../types/Task';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';

// Helper function to format relative time
const getRelativeTime = (dateString: string | Date | undefined): string => {
  if (!dateString) return 'Unknown';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isThisWeek(date)) return format(date, 'EEEE');
  if (isThisMonth(date)) return format(date, 'MMMM d');
  return format(date, 'MMM d, yyyy');
};

type CompletedScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Completed'>;

type TimeFilter = 'all' | 'today' | 'week' | 'month';

// Add new sort type definition
type SortOption = {
  id: 'recent' | 'oldest' | 'title' | 'priority' | 'dueDate' | 'subtasks';
  label: string;
  icon: string;
};

const SORT_OPTIONS: SortOption[] = [
  { id: 'recent', label: 'Most Recent', icon: 'clock' },
  { id: 'oldest', label: 'Oldest First', icon: 'clock-outline' },
  { id: 'title', label: 'By Title', icon: 'sort-alphabetical-ascending' },
  { id: 'priority', label: 'By Priority', icon: 'alert-circle-outline' },
  { id: 'dueDate', label: 'By Due Date', icon: 'calendar' },
  { id: 'subtasks', label: 'By Subtasks', icon: 'format-list-checks' },
];

export default function CompletedScreen() {
  const navigation = useNavigation<CompletedScreenNavigationProp>();
  const { tasks, updateTask, fetchTasks } = useTaskStore();
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const colors = theme?.colors || paperTheme.colors; // Fallback to Paper theme if custom theme is undefined
  const [sortBy, setSortBy] = useState<SortOption['id']>('recent');
  const [sortAscending, setSortAscending] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [showStats, setShowStats] = useState(true);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  
  // Get completed tasks and apply filters
  const completedTasks = useMemo(() => {
    let filtered = tasks.filter(task => task.completed);
    
    // Apply time filter
    if (timeFilter !== 'all') {
      filtered = filtered.filter(task => {
        const completedDate = new Date(String(task.updatedAt));
        switch (timeFilter) {
          case 'today':
            return isToday(completedDate);
          case 'week':
            return isThisWeek(completedDate);
          case 'month':
            return isThisMonth(completedDate);
          default:
            return true;
        }
      });
    }
    
    // Apply sorting
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'recent':
          comparison = new Date(String(b.updatedAt)).getTime() - 
                      new Date(String(a.updatedAt)).getTime();
          break;
        case 'oldest':
          comparison = new Date(String(a.updatedAt)).getTime() - 
                      new Date(String(b.updatedAt)).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = (priorityOrder[b.priority || 'low'] || 0) - 
                      (priorityOrder[a.priority || 'low'] || 0);
          break;
        case 'dueDate':
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          comparison = aDate - bDate;
          break;
        case 'subtasks':
          comparison = (b.subtasks?.length || 0) - (a.subtasks?.length || 0);
          break;
        default:
          comparison = 0;
      }
      
      return sortAscending ? comparison : -comparison;
    });
  }, [tasks, timeFilter, sortBy, sortAscending]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = completedTasks.length;
    const today = completedTasks.filter(task => 
      isToday(new Date(String(task.updatedAt)))
    ).length;
    const thisWeek = completedTasks.filter(task =>
      isThisWeek(new Date(String(task.updatedAt)))
    ).length;
    const thisMonth = completedTasks.filter(task =>
      isThisMonth(new Date(String(task.updatedAt)))
    ).length;

    return { total, today, thisWeek, thisMonth };
  }, [completedTasks]);

  const handleRestoreTasks = async () => {
    try {
      const updatePromises = selectedTasks.map(taskId => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          return updateTask({ 
            ...task, 
            completed: false, 
            updatedAt: new Date().toISOString() 
          });
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
      
      // Clear selection and close modal immediately
      setSelectedTasks([]);
      setShowRestoreModal(false);
      
      // Immediately fetch updated tasks to refresh the UI
      await fetchTasks();
    } catch (error) {
      console.error('Error restoring tasks:', error);
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };
  
  const navigateToTask = (taskId: string) => {
    navigation.navigate('TaskDetail', { taskId });
  };
  
  const renderTaskItem = ({ item }: { item: Task }) => (
    <Surface style={[styles.taskItem, { backgroundColor: colors.surface }]}>
    <TouchableOpacity 
        style={styles.taskContent}
      onPress={() => navigateToTask(item.id)}
        onLongPress={() => toggleTaskSelection(item.id)}
    >
        <View style={styles.taskHeader}>
        <View style={styles.titleContainer}>
            <IconButton
              icon={selectedTasks.includes(item.id) ? "checkbox-marked" : "checkbox-blank-outline"}
              size={20}
              onPress={() => toggleTaskSelection(item.id)}
              style={styles.checkbox}
            />
            <Text style={[styles.taskTitle, { color: colors.onSurface }]} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
          <Chip 
            icon="check-circle"
            compact
            style={[styles.completedChip, { backgroundColor: colors.primaryContainer }]}
          >
            {getRelativeTime(item.updatedAt)}
          </Chip>
        </View>
        
        {item.description && (
          <Text style={[styles.description, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.taskMeta}>
          {item.updatedAt && (
            <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
              Completed: {format(new Date(item.updatedAt), 'MMM d, yyyy h:mm a')}
            </Text>
          )}
          {item.dueDate && (
            <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
              • Due: {format(new Date(item.dueDate), 'MMM d, yyyy')}
            </Text>
          )}
          {item.subtasks && item.subtasks.length > 0 && (
            <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
              • {item.subtasks.length} subtasks
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Surface>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={[styles.title, { color: colors.onBackground }]}>Completed Tasks</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {stats.total} task{stats.total !== 1 ? 's' : ''} completed
        </Text>
        </View>
        <IconButton
          icon={showStats ? "chevron-up" : "chevron-down"}
          onPress={() => setShowStats(!showStats)}
        />
      </View>
      
      {showStats && (
        <View style={styles.statsContainer}>
          <Surface style={[styles.statCard, { backgroundColor: colors.primaryContainer }]}>
            <Text style={[styles.statValue, { color: colors.onPrimaryContainer }]}>{stats.today}</Text>
            <Text style={[styles.statLabel, { color: colors.onPrimaryContainer }]}>Today</Text>
          </Surface>
          <Surface style={[styles.statCard, { backgroundColor: colors.primaryContainer }]}>
            <Text style={[styles.statValue, { color: colors.onPrimaryContainer }]}>{stats.thisWeek}</Text>
            <Text style={[styles.statLabel, { color: colors.onPrimaryContainer }]}>This Week</Text>
          </Surface>
          <Surface style={[styles.statCard, { backgroundColor: colors.primaryContainer }]}>
            <Text style={[styles.statValue, { color: colors.onPrimaryContainer }]}>{stats.thisMonth}</Text>
            <Text style={[styles.statLabel, { color: colors.onPrimaryContainer }]}>This Month</Text>
          </Surface>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        <Chip
          selected={timeFilter === 'all'}
          onPress={() => setTimeFilter('all')}
          style={styles.filterChip}
        >
          All Time
        </Chip>
        <Chip
          selected={timeFilter === 'today'}
          onPress={() => setTimeFilter('today')}
          style={styles.filterChip}
        >
          Today
        </Chip>
        <Chip
          selected={timeFilter === 'week'}
          onPress={() => setTimeFilter('week')}
          style={styles.filterChip}
        >
          This Week
        </Chip>
        <Chip
          selected={timeFilter === 'month'}
          onPress={() => setTimeFilter('month')}
          style={styles.filterChip}
        >
          This Month
        </Chip>
      </ScrollView>

      {renderSortSection()}
    </View>
  );

  const renderSortSection = () => (
    <View style={styles.sortContainer}>
      <TouchableOpacity 
        style={styles.sortButton}
        onPress={(event) => {
          const { pageX, pageY } = event.nativeEvent;
          setMenuAnchor({ x: pageX, y: pageY });
          setMenuVisible(true);
        }}
      >
        <MaterialCommunityIcons 
          name="sort" 
          size={20} 
          color={colors.onSurfaceVariant} 
        />
        <Text style={[styles.sortButtonText, { color: colors.onSurfaceVariant }]}>
          Sort: {SORT_OPTIONS.find(opt => opt.id === sortBy)?.label}
        </Text>
        <MaterialCommunityIcons 
          name={sortAscending ? "arrow-up" : "arrow-down"} 
          size={16} 
          color={colors.onSurfaceVariant}
          style={{ marginLeft: 4 }}
        />
      </TouchableOpacity>
      </View>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={completedTasks}
        renderItem={renderTaskItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="check-circle-outline" size={48} color={colors.onSurfaceVariant} />
            <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
              No completed tasks found
            </Text>
          </View>
        }
      />

      {selectedTasks.length > 0 && (
        <Surface style={[styles.bottomBar, { backgroundColor: colors.surface }]}>
          <Text style={{ color: colors.onSurface }}>
            {selectedTasks.length} selected
          </Text>
          <Button
            mode="contained"
            onPress={() => setShowRestoreModal(true)}
            style={styles.restoreButton}
          >
            Restore Tasks
          </Button>
        </Surface>
      )}

            <Menu
              visible={menuVisible}
        onDismiss={() => {
          setMenuVisible(false);
          setMenuAnchor(null);
        }}
        anchor={menuAnchor ? { x: menuAnchor.x, y: menuAnchor.y } : undefined}
        contentStyle={styles.menuContent}
      >
        {SORT_OPTIONS.map((option) => (
          <Menu.Item
            key={option.id}
            onPress={() => {
              if (sortBy === option.id) {
                setSortAscending(!sortAscending);
              } else {
                setSortBy(option.id);
                setSortAscending(false);
              }
              setMenuVisible(false);
              setMenuAnchor(null);
            }}
            title={option.label}
            leadingIcon={option.icon}
            trailingIcon={
              sortBy === option.id
                ? sortAscending
                  ? "arrow-up"
                  : "arrow-down"
                : undefined
            }
          />
        ))}
        <Divider />
              <Menu.Item 
          onPress={() => {
            setSortAscending(!sortAscending);
            setMenuVisible(false);
            setMenuAnchor(null);
          }}
          title={`Order: ${sortAscending ? 'Ascending' : 'Descending'}`}
          leadingIcon={sortAscending ? "sort-ascending" : "sort-descending"}
              />
            </Menu>

      <Portal>
        <Modal
          visible={showRestoreModal}
          onDismiss={() => setShowRestoreModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
            Restore Tasks
          </Text>
          <Text style={[styles.modalText, { color: colors.onSurfaceVariant }]}>
            Are you sure you want to restore {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''}?
          </Text>
          <View style={styles.modalActions}>
            <Button onPress={() => setShowRestoreModal(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleRestoreTasks}>
              Restore
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
  listContent: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  statCard: {
    flex: 1,
    margin: 4,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterChip: {
    marginRight: 8,
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  sortButtonText: {
    marginLeft: 4,
  },
  taskItem: {
    marginBottom: 12,
    borderRadius: 12, 
    elevation: 2,
  },
  taskContent: {
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    margin: 0,
    padding: 0,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  completedChip: {
    height: 28,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 28,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 28,
  },
  metaText: {
    fontSize: 12,
    marginRight: 8,
  },
  emptyState: {
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    elevation: 4,
  },
  restoreButton: {
    marginLeft: 16,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  menuContent: {
    marginTop: 8,
    borderRadius: 8,
    elevation: 4,
  },
  sortDirectionButton: {
    marginLeft: 8,
  },
}); 