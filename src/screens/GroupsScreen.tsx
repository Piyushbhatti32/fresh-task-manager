import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { 
  Text, 
  Searchbar, 
  Button, 
  FAB, 
  Divider, 
  Card, 
  Avatar, 
  Badge, 
  Chip, 
  IconButton, 
  Menu 
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useGroupStore, Group, GroupInvitation } from '../stores/groupStore';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';

type GroupsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

export const GroupsScreen = () => {
  const navigation = useNavigation<GroupsScreenNavigationProp>();
  const { groups, invitations } = useGroupStore();
  const { user } = useAuth();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  
  // Filter groups by search query
  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Filter pending invitations
  const pendingInvitations = invitations.filter(
    inv => inv.status === 'pending' && inv.invitedEmail === user?.email
  );
  
  // Handle group selection
  const handleSelectGroup = (groupId: string) => {
    navigation.navigate('GroupDetail', { groupId });
  };
  
  // Create new group
  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  // Handle invitation response
  const handleInvitationResponse = (invitationId: string, accept: boolean) => {
    const { updateInvitationStatus } = useGroupStore.getState();
    updateInvitationStatus(invitationId, accept ? 'accepted' : 'declined');
  };
  
  // Toggle menu
  const openMenu = (groupId: string) => setMenuVisible(groupId);
  const closeMenu = () => setMenuVisible(null);
  
  // Render group item
  const renderGroupItem = ({ item }: { item: Group }) => {
    const isAdmin = item.members.some(
      member => member.id === user?.id && member.role === 'admin'
    );
    
    return (
      <Card style={styles.groupCard} onPress={() => handleSelectGroup(item.id)}>
        <Card.Content>
          <View style={styles.groupHeader}>
            <View style={styles.groupTitleContainer}>
              <Text style={styles.groupName}>{item.name}</Text>
              {isAdmin && <Chip compact style={styles.adminChip}>Admin</Chip>}
            </View>
            
            <Menu
              visible={menuVisible === item.id}
              onDismiss={closeMenu}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => openMenu(item.id)}
                />
              }
            >
              <Menu.Item title="View Details" onPress={() => {
                closeMenu();
                handleSelectGroup(item.id);
              }} />
              {isAdmin && (
                <Menu.Item title="Invite Members" onPress={() => {
                  closeMenu();
                  navigation.navigate('InviteMembers', { groupId: item.id });
                }} />
              )}
              {isAdmin && (
                <Menu.Item title="Delete Group" onPress={() => {
                  closeMenu();
                  useGroupStore.getState().deleteGroup(item.id);
                }} />
              )}
            </Menu>
          </View>
          
          <Text style={styles.groupDescription}>{item.description}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{item.members.length}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{item.tasks.length}</Text>
              <Text style={styles.statLabel}>Tasks</Text>
            </View>
          </View>
          
          <View style={styles.memberAvatars}>
            {item.members.slice(0, 3).map((member, index) => (
              <Avatar.Text
                key={member.id}
                size={36}
                label={member.name.substring(0, 2).toUpperCase()}
                style={[styles.memberAvatar, { zIndex: 5 - index }]}
              />
            ))}
            {item.members.length > 3 && (
              <Avatar.Text
                size={36}
                label={`+${item.members.length - 3}`}
                style={[styles.memberAvatar, { zIndex: 1 }]}
              />
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  // Render invitation item
  const renderInvitationItem = ({ item }: { item: GroupInvitation }) => (
    <Card style={styles.invitationCard}>
      <Card.Content>
        <Text style={styles.invitationTitle}>
          You've been invited to join "{item.groupName}"
        </Text>
        <View style={styles.invitationActions}>
          <Button 
            mode="contained" 
            onPress={() => handleInvitationResponse(item.id, true)}
            style={styles.acceptButton}
          >
            Accept
          </Button>
          <Button 
            mode="outlined" 
            onPress={() => handleInvitationResponse(item.id, false)}
            style={styles.declineButton}
          >
            Decline
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
  
  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Groups Yet</Text>
      <Text style={styles.emptySubtitle}>
        Create a group to collaborate with your team
      </Text>
      <Button 
        mode="contained" 
        onPress={handleCreateGroup}
        style={styles.createButton}
        icon="plus"
      >
        Create a Group
      </Button>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search groups..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        iconColor="#3498db"
      />
      
      {pendingInvitations.length > 0 && (
        <View style={styles.invitationsContainer}>
          <Text style={styles.sectionTitle}>Invitations</Text>
          <FlatList
            data={pendingInvitations}
            keyExtractor={(item) => item.id}
            renderItem={renderInvitationItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.invitationsList}
          />
        </View>
      )}
      
      <Text style={styles.sectionTitle}>My Groups</Text>
      
      {filteredGroups.length > 0 ? (
        <FlatList
          data={filteredGroups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroupItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.groupsList}
        />
      ) : (
        renderEmptyState()
      )}
      
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreateGroup}
        color="#fff"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  searchBar: {
    marginBottom: 16,
    backgroundColor: '#111',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    marginTop: 8,
  },
  groupsList: {
    paddingBottom: 80,
  },
  groupCard: {
    marginBottom: 16,
    backgroundColor: '#111',
    borderRadius: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  groupTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  adminChip: {
    backgroundColor: '#3498db',
    height: 24,
  },
  groupDescription: {
    color: '#ccc',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stat: {
    marginRight: 24,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
  },
  statLabel: {
    fontSize: 14,
    color: '#999',
  },
  memberAvatars: {
    flexDirection: 'row',
  },
  memberAvatar: {
    marginLeft: -8,
    backgroundColor: '#3498db',
  },
  invitationsContainer: {
    marginBottom: 16,
  },
  invitationsList: {
    paddingRight: 16,
  },
  invitationCard: {
    width: 280,
    marginRight: 12,
    backgroundColor: '#111',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  invitationTitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
  },
  invitationActions: {
    flexDirection: 'row',
  },
  acceptButton: {
    marginRight: 8,
    backgroundColor: '#3498db',
  },
  declineButton: {
    borderColor: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#3498db',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#3498db',
  },
});

export default GroupsScreen; 