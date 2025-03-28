import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity 
} from 'react-native';
import { 
  Text, 
  Searchbar, 
  FAB, 
  Card,
  IconButton,
  useTheme
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { TemplatesScreenNavigationProp } from '../navigation/types';

export default function TemplatesScreen() {
  const navigation = useNavigation<TemplatesScreenNavigationProp>();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<any[]>([]); // Initialize with empty array

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTemplateItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('TemplateDetail', { templateId: item.id })}
    >
      <Card style={styles.templateCard}>
        <Card.Content>
          <View style={styles.templateHeader}>
            <Text style={styles.templateName}>{item.name}</Text>
            <IconButton
              icon="dots-vertical"
              size={20}
              onPress={() => {}}
            />
          </View>
          <Text style={styles.templateDescription}>
            {item.description || 'No description'}
          </Text>
          <View style={styles.templateStats}>
            <Text style={styles.templateStat}>
              {item.tasks?.length || 0} tasks
            </Text>
            <Text style={styles.templateStat}>
              Last used: {item.lastUsed || 'Never'}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Searchbar
        placeholder="Search templates..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      {filteredTemplates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No templates found</Text>
          <Text style={styles.emptySubtext}>
            Create a template to save your task configurations
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTemplates}
          renderItem={renderTemplateItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
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
  searchBar: {
    margin: 16,
    elevation: 0,
  },
  listContent: {
    padding: 16,
  },
  templateCard: {
    marginBottom: 16,
    elevation: 2,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
  },
  templateDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  templateStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  templateStat: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
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
}); 