import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { appTheme } from '../theme/AppTheme';
import { useTaskStore } from '../stores/taskStore';
import { Search } from 'lucide-react-native';

type TeamScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

// Sample team data
const teamMembers = [
  {
    id: '1',
    name: 'John Doe',
    role: 'Project Manager',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=0066FF&color=fff&size=128',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    role: 'UI/UX Designer',
    email: 'sarah.johnson@example.com',
    phone: '+1 (555) 987-6543',
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=0066FF&color=fff&size=128',
  },
  {
    id: '3',
    name: 'Mike Chen',
    role: 'Frontend Developer',
    email: 'mike.chen@example.com',
    phone: '+1 (555) 456-7890',
    avatar: 'https://ui-avatars.com/api/?name=Mike+Chen&background=0066FF&color=fff&size=128',
  },
  {
    id: '4',
    name: 'Emily Rodriguez',
    role: 'Backend Developer',
    email: 'emily.rodriguez@example.com',
    phone: '+1 (555) 234-5678',
    avatar: 'https://ui-avatars.com/api/?name=Emily+Rodriguez&background=0066FF&color=fff&size=128',
  },
  {
    id: '5',
    name: 'David Kim',
    role: 'QA Engineer',
    email: 'david.kim@example.com',
    phone: '+1 (555) 876-5432',
    avatar: 'https://ui-avatars.com/api/?name=David+Kim&background=0066FF&color=fff&size=128',
  },
];

export default function TeamScreen() {
  const navigation = useNavigation<TeamScreenNavigationProp>();
  const { tasks } = useTaskStore();
  const [searchQuery, setSearchQuery] = React.useState('');

  // Get tasks assigned to each team member
  const getAssignedTasks = (name: string) => {
    // In a production app, you would use the proper property from the Task type
    return tasks.filter(task => {
      // Using type assertion to access a property that might not exist in the Task type
      const taskAny = task as any;
      return taskAny.assignee === name;
    });
  };

  const filteredTeamMembers = teamMembers.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTeamMember = ({ item }: { item: typeof teamMembers[0] }) => {
    const assignedTasks = getAssignedTasks(item.name);
    const pendingTasks = assignedTasks.filter(task => !task.completed).length;
    const completedTasks = assignedTasks.filter(task => task.completed).length;

    return (
      <TouchableOpacity 
        style={styles.memberCard}
        onPress={() => {
          // In a real app, this would navigate to a team member detail screen
          // For now, we'll just console log the team member details
          console.log(`Team member selected: ${item.name}`);
        }}
      >
        <Image 
          source={{ uri: item.avatar }} 
          style={styles.avatar} 
        />
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberRole}>{item.role}</Text>
          <View style={styles.taskStats}>
            <View style={styles.taskStat}>
              <Text style={styles.taskStatNumber}>{pendingTasks}</Text>
              <Text style={styles.taskStatLabel}>Pending</Text>
            </View>
            <View style={styles.taskStat}>
              <Text style={styles.taskStatNumber}>{completedTasks}</Text>
              <Text style={styles.taskStatLabel}>Completed</Text>
            </View>
            <View style={styles.taskStat}>
              <Text style={styles.taskStatNumber}>{assignedTasks.length}</Text>
              <Text style={styles.taskStatLabel}>Total</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Team</Text>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search team members..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor={appTheme.colors.onSurfaceVariant}
          placeholderTextColor={appTheme.colors.onSurfaceVariant}
          theme={{ colors: { text: appTheme.colors.onSurface } }}
        />
      </View>

      <FlatList
        data={filteredTeamMembers}
        renderItem={renderTeamMember}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.membersList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: appTheme.colors.onBackground,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    backgroundColor: appTheme.colors.surface,
    elevation: 0,
    borderRadius: 8,
  },
  searchInput: {
    color: appTheme.colors.onSurface,
  },
  membersList: {
    padding: 16,
  },
  memberCard: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
    backgroundColor: appTheme.colors.primary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: appTheme.colors.onSurface,
    marginBottom: 4,
  },
  memberRole: {
    fontSize: 14,
    color: appTheme.colors.onSurfaceVariant,
    marginBottom: 12,
  },
  taskStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskStat: {
    alignItems: 'center',
  },
  taskStatNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: appTheme.colors.onSurface,
  },
  taskStatLabel: {
    fontSize: 12,
    color: appTheme.colors.onSurfaceVariant,
  },
}); 