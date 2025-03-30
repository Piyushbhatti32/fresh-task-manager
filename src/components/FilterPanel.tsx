import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Platform 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTaskStore } from '../stores/taskStore';
import { TaskFilter, Priority, TaskCategory } from '../types/Task';
import { useCategoryStore } from '../stores/categoryStore';
interface FilterPanelProps {
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  categories: TaskCategory[];
}

const FilterPanel: React.FC<FilterPanelProps> = ({ 
  onFilterChange, 
  filter,
  categories
}) => {
  const { categories: storeCategories } = useCategoryStore();
  
  const [localFilter, setLocalFilter] = useState<TaskFilter>(
    filter || {
      status: 'all',
      priority: 'all',
      category: 'all',
      dueDate: 'all'
    }
  );

  const handleFilterChange = (key: keyof TaskFilter, value: string) => {
    const newFilter = { ...localFilter, [key]: value };
    setLocalFilter(newFilter);
    onFilterChange(newFilter);
  };

  const priorityOptions = [
    { label: 'All Priorities', value: 'all' },
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' }
  ];

  const statusOptions = [
    { label: 'All Tasks', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Completed', value: 'completed' }
  ];

  const dueDateOptions = [
    { label: 'All Dates', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'Tomorrow', value: 'tomorrow' },
    { label: 'This Week', value: 'week' }
  ];

  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Filter Tasks</Text>
      
      <ScrollView horizontal={!isWeb} style={styles.filtersContainer}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Status</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={localFilter.status}
              style={styles.picker}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              {statusOptions.map(option => (
                <Picker.Item 
                  key={option.value} 
                  label={option.label} 
                  value={option.value} 
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Priority</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={localFilter.priority}
              style={styles.picker}
              onValueChange={(value) => handleFilterChange('priority', value)}
            >
              {priorityOptions.map(option => (
                <Picker.Item 
                  key={option.value} 
                  label={option.label} 
                  value={option.value} 
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Due Date</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={localFilter.dueDate}
              style={styles.picker}
              onValueChange={(value) => handleFilterChange('dueDate', value)}
            >
              {dueDateOptions.map(option => (
                <Picker.Item 
                  key={option.value} 
                  label={option.label} 
                  value={option.value} 
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Category</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={localFilter.category}
              style={styles.picker}
              onValueChange={(value) => handleFilterChange('category', value)}
            >
              <Picker.Item label="All Categories" value="all" />
              {storeCategories.map((category: TaskCategory) => (
                <Picker.Item 
                  key={category.id} 
                  label={category.name} 
                  value={category.id} 
                />
              ))}
            </Picker>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.resetButton}
        onPress={() => {
          const defaultFilter: TaskFilter = {
            status: 'all',
            priority: 'all',
            category: 'all',
            dueDate: 'all'
          };
          setLocalFilter(defaultFilter);
          onFilterChange(defaultFilter);
        }}
      >
        <Text style={styles.resetButtonText}>Reset Filters</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  filterGroup: {
    marginRight: 15,
    marginBottom: 8,
    minWidth: 150,
  },
  filterLabel: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
    width: Platform.OS === 'web' ? 200 : 150,
  },
  resetButton: {
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 5,
  },
  resetButtonText: {
    color: '#333',
    fontWeight: '500',
  },
});

export default FilterPanel; 