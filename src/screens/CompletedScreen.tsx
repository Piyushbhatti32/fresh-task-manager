import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Chip, Divider, Menu } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { appTheme } from '../theme/AppTheme';
import { useTaskStore } from '../stores/taskStore';
import { Task } from '../types/Task';
import { Check, ChevronDown } from 'lucide-react-native';

// Helper function to format relative time
const getRelativeTime = (dateString: string | Date | undefined): string => {
  if (!dateString) return 'Unknown';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  // Format logic here...
  return 'Recently';
};

// Helper function to format date for display
const formatDateDisplay = (dateString: string | Date | undefined): string => {
  if (!dateString) return 'N/A';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString();
};

// Helper function to format time for display
const formatTimeDisplay = (dateString: string | Date | undefined): string => {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

type CompletedScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Completed'>;

export default function CompletedScreen() {
  const navigation = useNavigation<CompletedScreenNavigationProp>();
  const { tasks } = useTaskStore();
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'title'>('recent');
  const [menuVisible, setMenuVisible] = useState(false);
  
  const completedTasks = tasks.filter(task => task.completed);
  
  const sortedCompletedTasks = [...completedTasks].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(String(b.updatedAt || new Date())).getTime() - 
             new Date(String(a.updatedAt || new Date())).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(String(a.updatedAt || new Date())).getTime() - 
             new Date(String(b.updatedAt || new Date())).getTime();
    } else {
      return a.title.localeCompare(b.title);
    }
  });
  
  const navigateToTask = (taskId: string) => {
    navigation.navigate('TaskDetail', { taskId });
  };
  
  const renderTaskItem = ({ item }: { item: Task }) => (
    <TouchableOpacity 
      style={styles.taskItem}
      onPress={() => navigateToTask(item.id)}
    >
      <View style={styles.taskContent}>
        <View style={styles.titleContainer}>
          <View style={styles.checkIconContainer}>
            <Check size={16} />
          </View>
          <Text style={styles.taskTitle}>{item.title}</Text>
        </View>
        <Text style={styles.completionTime}>
          Completed {getRelativeTime(String(item.updatedAt || new Date()))}
        </Text>
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.taskMeta}>
        <Text style={styles.taskDeadline}>
          Due: {formatDateDisplay(String(item.dueDate || ''))} {formatTimeDisplay(String(item.dueDate || ''))}
        </Text>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <FlatList
        data={sortedCompletedTasks}
        renderItem={renderTaskItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Completed Tasks</Text>
            <Text style={styles.subtitle}>
              {completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''} completed
            </Text>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <TouchableOpacity 
                  style={styles.sortButton}
                  onPress={() => setMenuVisible(true)}
                >
                  <Text style={styles.sortButtonText}>
                    Sort: {sortBy === 'recent' ? 'Recent' : sortBy === 'oldest' ? 'Oldest' : 'Title'}
                  </Text>
                  <ChevronDown size={16} />
                </TouchableOpacity>
              }
              contentStyle={styles.menuContent}
            >
              <Menu.Item 
                onPress={() => { setSortBy('recent'); setMenuVisible(false); }} 
                title="Recent" 
              />
              <Menu.Item 
                onPress={() => { setSortBy('oldest'); setMenuVisible(false); }} 
                title="Oldest" 
              />
              <Menu.Item 
                onPress={() => { setSortBy('title'); setMenuVisible(false); }} 
                title="By Title" 
              />
            </Menu>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: appTheme.colors.background },
  listContent: { padding: 16 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: appTheme.colors.onBackground, marginBottom: 4 },
  subtitle: { fontSize: 16, color: appTheme.colors.onSurfaceVariant, marginBottom: 16 },
  sortButton: { flexDirection: 'row', alignItems: 'center' },
  sortButtonText: { marginRight: 4, color: appTheme.colors.onSurfaceVariant },
  menuContent: { marginTop: 4 },
  taskItem: { marginBottom: 16, backgroundColor: appTheme.colors.surface, borderRadius: 12, padding: 16 },
  taskContent: { marginBottom: 8 },
  titleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  checkIconContainer: { 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    backgroundColor: appTheme.colors.primaryContainer, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginRight: 8
  },
  taskTitle: { fontSize: 16, fontWeight: '600', color: appTheme.colors.onSurface },
  completionTime: { fontSize: 14, color: appTheme.colors.onSurfaceVariant, marginLeft: 32 },
  divider: { marginVertical: 8 },
  taskMeta: { flexDirection: 'row', alignItems: 'center' },
  taskDeadline: { fontSize: 14, color: appTheme.colors.onSurfaceVariant },
  taskAssignee: { fontSize: 14, color: appTheme.colors.onSurfaceVariant, marginLeft: 4 },
}); 