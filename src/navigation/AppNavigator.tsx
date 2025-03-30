import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { IconButton } from 'react-native-paper';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { List } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';

// Import screens
import TasksScreen from '../screens/TasksScreen';
import CalendarScreen from '../screens/CalendarScreen';
import StatsScreen from '../screens/StatsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import TeamScreen from '../screens/TeamScreen';
import GroupsScreen from '../screens/GroupsScreen';
import CreateTaskScreen from '../screens/CreateTaskScreen';
import EditTaskScreen from '../screens/EditTaskScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CompletedScreen from '../screens/CompletedScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import TemplatesScreen from '../screens/TemplatesScreen';
import CreateTemplateScreen from '../screens/CreateTemplateScreen';
import TemplateDetailScreen from '../screens/TemplateDetailScreen';

// Import types
import { RootStackParamList, MainTabsParamList } from './types';

// Create new screens for Templates and Pomodoro
import { View, Text } from 'react-native';
import PomodoroTimer from '../components/PomodoroTimer';
import TemplateList from '../components/TemplateList';

// Focus Screen (Pomodoro)
function FocusScreen() {
  return (
    <View style={{ flex: 1 }}>
      <PomodoroTimer 
        showCloseButton={false}
        onClose={() => {}} 
        initialTaskId={undefined} 
      />
    </View>
  );
}

// Templates Screen (internal version - not used)
// Remove or comment out this function since we're importing the real TemplatesScreen
/* function TemplatesScreen() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TemplateList onSelectTemplate={() => {}} />
    </View>
  );
} */

// Create navigators
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabsParamList>();

// Bottom Tab Navigator
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'list';
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Tasks') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Focus') {
            iconName = focused ? 'timer' : 'timer-outline';
          } else if (route.name === 'More') {
            iconName = focused ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="Tasks" 
        component={TasksScreen}
        options={{ title: 'Tasks' }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarScreen}
        options={{ title: 'Calendar' }}
      />
      <Tab.Screen 
        name="Focus" 
        component={FocusScreen}
        options={{ title: 'Focus' }}
      />
      <Tab.Screen 
        name="More" 
        component={MoreScreen}
        options={{ title: 'More' }}
      />
    </Tab.Navigator>
  );
}

type MoreScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// More Screen with grouped options
function MoreScreen({ navigation }: { navigation: MoreScreenNavigationProp }) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Navigation will be handled automatically by AppNavigator
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <List.Section>
        <List.Subheader>Task Management</List.Subheader>
        <List.Item
          title="Templates"
          left={props => <List.Icon {...props} icon="file-document-outline" />}
          onPress={() => navigation.navigate('Templates')}
        />
        <List.Item
          title="Completed Tasks"
          left={props => <List.Icon {...props} icon="check-circle-outline" />}
          onPress={() => navigation.navigate('Completed')}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>Team & Groups</List.Subheader>
        <List.Item
          title="Team"
          left={props => <List.Icon {...props} icon="account-group-outline" />}
          onPress={() => navigation.navigate('Team')}
        />
        <List.Item
          title="Groups"
          left={props => <List.Icon {...props} icon="folder-outline" />}
          onPress={() => navigation.navigate('Groups')}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>Analytics</List.Subheader>
        <List.Item
          title="Statistics"
          left={props => <List.Icon {...props} icon="chart-bar" />}
          onPress={() => navigation.navigate('Stats')}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>Settings</List.Subheader>
        <List.Item
          title="Profile"
          left={props => <List.Icon {...props} icon="account-outline" />}
          onPress={() => navigation.navigate('Profile')}
        />
        <List.Item
          title="Settings"
          left={props => <List.Icon {...props} icon="cog-outline" />}
          onPress={() => navigation.navigate('Settings')}
        />
      </List.Section>

      <List.Section>
        <List.Item
          title="Logout"
          left={props => <List.Icon {...props} icon="logout" />}
          onPress={handleLogout}
          titleStyle={{ color: '#FF3B30' }}
        />
      </List.Section>
    </View>
  );
}

// Root Stack Navigator
function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
      ) : (
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabNavigator} 
          options={{ headerShown: false }}
        />
      )}
      <Stack.Screen 
        name="TaskDetail" 
        component={TaskDetailScreen}
        options={{ title: 'Task Details' }}
      />
      <Stack.Screen 
        name="CreateTask" 
        component={CreateTaskScreen}
        options={{ title: 'Create Task' }}
      />
      <Stack.Screen 
        name="EditTask" 
        component={EditTaskScreen}
        options={{ title: 'Edit Task' }}
      />
      <Stack.Screen 
        name="Groups" 
        component={GroupsScreen}
        options={{ title: 'Groups' }}
      />
      <Stack.Screen 
        name="CreateGroup" 
        component={CreateGroupScreen}
        options={{ title: 'Create Group' }}
      />
      <Stack.Screen 
        name="Completed" 
        component={CompletedScreen}
        options={{ title: 'Completed Tasks' }}
      />
      <Stack.Screen 
        name="Templates" 
        component={TemplatesScreen}
        options={{ title: 'Templates' }}
      />
      <Stack.Screen 
        name="Team" 
        component={TeamScreen}
        options={{ title: 'Team' }}
      />
      <Stack.Screen 
        name="Stats" 
        component={StatsScreen}
        options={{ title: 'Statistics' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen 
        name="CreateTemplate" 
        component={CreateTemplateScreen} 
        options={{ 
          title: 'Create Template',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="TemplateDetail" 
        component={TemplateDetailScreen} 
        options={{ 
          title: 'Template Details',
          headerShown: true 
        }} 
      />
    </Stack.Navigator>
  );
}

export default AppNavigator; 