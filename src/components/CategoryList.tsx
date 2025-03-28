import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useCategoryStore } from '../stores/categoryStore';
import { TaskCategory } from '../types/Task';
import { MaterialIcons } from '@expo/vector-icons';

interface CategoryListProps {
  onSelectCategory?: (category: TaskCategory) => void;
  selectedCategoryId?: string;
  showManagement?: boolean;
}

export default function CategoryList({
  onSelectCategory,
  selectedCategoryId,
  showManagement = false
}: CategoryListProps) {
  const { theme, isDark } = useTheme();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategoryStore();
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TaskCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('#33A1FF');
  
  // Predefined colors for easy selection
  const colorOptions = [
    '#FF5733', '#33A1FF', '#33FF57', '#B533FF', 
    '#FF9F33', '#33FFD4', '#FF33A8', '#5733FF',
    '#FF3333', '#33FFEC', '#FFEC33', '#EC33FF'
  ];
  
  // Handle opening the modal for adding a new category
  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryColor('#33A1FF');
    setShowCategoryModal(true);
  };
  
  // Handle opening the modal for editing an existing category
  const handleEditCategory = (category: TaskCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryColor(category.color);
    setShowCategoryModal(true);
  };
  
  // Handle saving a category (add or update)
  const handleSaveCategory = () => {
    if (!categoryName.trim()) {
      Alert.alert('Error', 'Category name cannot be empty');
      return;
    }
    
    if (editingCategory) {
      updateCategory(editingCategory.id, categoryName, categoryColor);
    } else {
      addCategory(categoryName, categoryColor);
    }
    
    setShowCategoryModal(false);
  };
  
  // Handle deleting a category
  const handleDeleteCategory = (category: TaskCategory) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteCategory(category.id)
        }
      ]
    );
  };
  
  // Render a color option for selection
  const renderColorOption = (color: string) => (
    <TouchableOpacity
      key={color}
      style={[
        styles.colorOption,
        { backgroundColor: color },
        categoryColor === color && styles.selectedColorOption
      ]}
      onPress={() => setCategoryColor(color)}
    />
  );
  
  // Render an individual category in the list
  const renderCategoryItem = ({ item }: { item: TaskCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        { 
          backgroundColor: theme.colors.surface,
          borderLeftWidth: 4,
          borderLeftColor: item.color,
        },
        selectedCategoryId === item.id && {
          backgroundColor: isDark ? '#2c2c2c' : '#f0f9ff',
          borderColor: theme.colors.primary,
          borderWidth: 1,
        }
      ]}
      onPress={() => onSelectCategory ? onSelectCategory(item) : null}
    >
      <View style={styles.categoryContent}>
        <View style={[styles.categoryColorDot, { backgroundColor: item.color }]} />
        <Text style={[styles.categoryName, { color: theme.colors.text }]}>
          {item.name}
        </Text>
      </View>
      
      {showManagement && (
        <View style={styles.categoryActions}>
          <TouchableOpacity
            style={styles.categoryAction}
            onPress={() => handleEditCategory(item)}
          >
            <MaterialIcons name="edit" size={20} color={theme.colors.secondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.categoryAction}
            onPress={() => handleDeleteCategory(item)}
          >
            <MaterialIcons name="delete" size={20} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
      
      {showManagement && (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddCategory}
        >
          <Text style={styles.addButtonText}>Add Category</Text>
        </TouchableOpacity>
      )}
      
      {/* Modal for adding/editing categories */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCategoryModal(false)}
              >
                <MaterialIcons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Category Name</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    color: theme.colors.text,
                    backgroundColor: isDark ? '#2c2c2c' : '#f5f5f5',
                    borderColor: theme.colors.outline || theme.colors.text + '40'
                  }
                ]}
                value={categoryName}
                onChangeText={setCategoryName}
                placeholder="Enter category name"
                placeholderTextColor={theme.colors.text + '60'}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Category Color</Text>
              <View style={styles.colorPicker}>
                {colorOptions.map(renderColorOption)}
              </View>
            </View>
            
            <View style={styles.previewSection}>
              <Text style={[styles.previewLabel, { color: theme.colors.text }]}>Preview:</Text>
              <View style={[
                styles.previewCategory,
                { 
                  backgroundColor: theme.colors.background,
                  borderLeftWidth: 4,
                  borderLeftColor: categoryColor
                }
              ]}>
                <Text style={[styles.previewTitle, { color: theme.colors.text }]}>{categoryName || 'Category Name'}</Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSaveCategory}
            >
              <Text style={styles.saveButtonText}>Save Category</Text>
            </TouchableOpacity>
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
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryAction: {
    padding: 8,
    marginLeft: 8,
  },
  addButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 16,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 12,
    padding: 24,
    elevation: 5,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    margin: 8,
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  previewSection: {
    marginVertical: 16,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  previewCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 