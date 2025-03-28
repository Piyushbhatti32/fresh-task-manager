import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { Task } from '../types/Task';

// Define the root stack param list which includes all screens
export type RootStackParamList = {
  MainTabs: undefined;
  TaskDetail: { taskId: string };
  Login: undefined;
  Signup: undefined;
  CreateTask: undefined;
  EditTask: { taskId: string };
  GroupDetail: { groupId: string };
  CreateGroup: undefined;
  InviteMembers: { groupId: string };
  TemplateDetail: { templateId: string };
  CreateTemplate: undefined;
  Settings: undefined;
  Main: undefined;
  Home: undefined;
  Profile: undefined;
  Groups: undefined;
  Completed: undefined;
};

// Define bottom tab param list
export type MainTabsParamList = {
  Home: undefined;
  Tasks: undefined;
  Calendar: undefined;
  Groups: undefined;
  Profile: undefined;
  Settings: undefined;
  Stats: undefined;
  Focus: undefined;
  Templates: undefined;
  Team: undefined;
};

// Define composite navigation types for tab screens that need access to stack navigation
export type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
>;

export type TasksScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, 'Tasks'>,
  StackNavigationProp<RootStackParamList>
>;

export type CalendarScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, 'Calendar'>,
  StackNavigationProp<RootStackParamList>
>;

export type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, 'Profile'>,
  StackNavigationProp<RootStackParamList>
>;

export type GroupsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, 'Groups'>,
  StackNavigationProp<RootStackParamList>
>;

export type SettingsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, 'Settings'>,
  StackNavigationProp<RootStackParamList>
>;

export type FocusScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, 'Focus'>,
  StackNavigationProp<RootStackParamList>
>;

export type TemplatesScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, 'Templates'>,
  StackNavigationProp<RootStackParamList>
>;

export type TeamScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, 'Team'>,
  StackNavigationProp<RootStackParamList>
>;

export type TaskDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'TaskDetail'
>;

export type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>;

export type CompletedScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Completed'
>;

export type CreateTaskScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'CreateTask'
>;

export type EditTaskScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'EditTask'
>;

export type CreateGroupScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'CreateGroup'
>; 