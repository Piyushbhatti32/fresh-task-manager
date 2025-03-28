import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Switch,
} from 'react-native';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

// Define the tab type to match SimpleApp
type TabType = 'home' | 'calendar' | 'add' | 'completed' | 'pomodoro' | 'templates';

interface DrawerMenuProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onClose: () => void;
  isOpen: boolean;
  onLogout?: () => void;
}

const DrawerMenu: React.FC<DrawerMenuProps> = ({
  activeTab,
  onSelectTab,
  onClose,
  isOpen,
  onLogout
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { logout, user } = useAuth();

  const menuItems = [
    { id: 'home' as TabType, label: 'Home', icon: 'home' },
    { id: 'calendar' as TabType, label: 'Calendar', icon: 'date-range' }, // Fixed icon name
    { id: 'completed' as TabType, label: 'Completed Tasks', icon: 'check-circle' },
    { id: 'pomodoro' as TabType, label: 'Pomodoro Timer', icon: 'timer' },
    { id: 'templates' as TabType, label: 'Templates', icon: 'content-copy' },
  ];

  const handleMenuItemPress = (tabId: TabType) => {
    onSelectTab(tabId);
    onClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
      if (onLogout) {
        onLogout();
      }
      onClose();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Task Manager</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <AntDesign name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.menuItemsContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                activeTab === item.id && [
                  styles.activeMenuItem, 
                  { backgroundColor: theme.colors.primary + '20' }
                ]
              ]}
              onPress={() => handleMenuItemPress(item.id)}
            >
              <MaterialIcons
                name={item.icon as any}
                size={24}
                color={activeTab === item.id ? theme.colors.primary : theme.colors.text}
              />
              <Text
                style={[
                  styles.menuItemText,
                  { color: activeTab === item.id ? theme.colors.primary : theme.colors.text }
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
          
          {/* Theme toggle switch */}
          <View style={[styles.themeToggleContainer, { borderTopColor: theme.colors.outline || theme.colors.text + '40' }]}>
            <View style={styles.themeToggleRow}>
              <MaterialIcons
                name={isDark ? "nightlight-round" : "wb-sunny"}
                size={24}
                color={theme.colors.text}
              />
              <Text style={[styles.themeToggleText, { color: theme.colors.text }]}>
                {isDark ? "Dark Mode" : "Light Mode"}
              </Text>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: "#767577", true: theme.colors.primary + '80' }}
                thumbColor={isDark ? theme.colors.primary : "#f4f3f4"}
              />
            </View>
          </View>
        </ScrollView>
        
        <View style={[styles.footer, { borderTopColor: theme.colors.outline || theme.colors.text + '40' }]}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <MaterialIcons
              name="logout"
              size={24}
              color={theme.colors.error}
            />
            <Text style={[styles.logoutText, { color: theme.colors.error }]}>
              Logout
            </Text>
          </TouchableOpacity>
          
          {user && (
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: theme.colors.text }]}>
                {user.name}
              </Text>
              <Text style={[styles.userEmail, { color: theme.colors.text + '80' }]}>
                {user.email}
              </Text>
            </View>
          )}
          
          <Text style={[styles.footerText, { color: theme.colors.text + '80' }]}>
            App Version 1.0.0
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  menuItemsContainer: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 5,
  },
  activeMenuItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 16,
    fontWeight: '500',
  },
  themeToggleContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    paddingTop: 15,
    paddingHorizontal: 20,
  },
  themeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  themeToggleText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginLeft: 15,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoutText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  userInfo: {
    marginBottom: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 12,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default DrawerMenu; 