import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Create a mock icon component that uses Expo's Ionicons
const createIconComponent = (name: string, ionIconName?: string) => {
  const IconComponent = (props: any) => {
    const { size = 24, color = '#000', style, ...rest } = props;
    
    // Use Ionicons if available, otherwise show text
    return (
      <View style={[styles.container, { width: size, height: size }, style]} {...rest}>
        {ionIconName ? (
          <Ionicons name={ionIconName as any} size={size} color={color} />
        ) : (
          <Text style={[styles.text, { fontSize: size / 2.5, color }]}>{name}</Text>
        )}
      </View>
    );
  };
  
  return IconComponent;
};

// Map lucide icon names to Ionicons names
const iconMap: Record<string, string> = {
  Calendar: 'calendar',
  Clock: 'time',
  Check: 'checkmark',
  X: 'close',
  Trash: 'trash',
  Edit: 'create',
  Search: 'search',
  Home: 'home',
  Settings: 'settings',
  User: 'person',
  Plus: 'add',
};

// Export mock components for commonly used icons
export const Calendar = createIconComponent('Calendar', iconMap.Calendar);
export const Clock = createIconComponent('Clock', iconMap.Clock);
export const ClipboardCheck = createIconComponent('ClipboardCheck');
export const Plus = createIconComponent('Plus', iconMap.Plus);
export const Check = createIconComponent('Check', iconMap.Check);
export const X = createIconComponent('X', iconMap.X);
export const Trash = createIconComponent('Trash', iconMap.Trash);
export const Edit = createIconComponent('Edit', iconMap.Edit);
export const Filter = createIconComponent('Filter');
export const Search = createIconComponent('Search', iconMap.Search);
export const AlertCircle = createIconComponent('AlertCircle');
export const Bell = createIconComponent('Bell');
export const Home = createIconComponent('Home', iconMap.Home);
export const List = createIconComponent('List');
export const Settings = createIconComponent('Settings', iconMap.Settings);
export const User = createIconComponent('User', iconMap.User);
export const Tag = createIconComponent('Tag');
export const Star = createIconComponent('Star');
export const Flag = createIconComponent('Flag');
export const ChevronDown = createIconComponent('ChevronDown');
export const ChevronUp = createIconComponent('ChevronUp');
export const ChevronLeft = createIconComponent('ChevronLeft');
export const ChevronRight = createIconComponent('ChevronRight');
export const MoreVertical = createIconComponent('MoreVertical');
export const MoreHorizontal = createIconComponent('MoreHorizontal');

// Default export for dynamic icon usage
export default {
  Calendar,
  Clock,
  ClipboardCheck,
  Plus,
  Check,
  X,
  Trash,
  Edit,
  Filter,
  Search,
  AlertCircle,
  Bell,
  Home,
  List,
  Settings,
  User,
  Tag,
  Star,
  Flag,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  MoreHorizontal,
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
}); 