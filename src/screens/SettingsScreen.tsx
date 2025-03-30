import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { Text, List, Divider, Button, Dialog, Portal, RadioButton, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { SettingsScreenNavigationProp } from '../navigation/types';
import { useTaskStore } from '../stores/taskStore';
import { useTheme } from '../theme/ThemeProvider';
import { ThemeMode } from '../theme/ThemeTypes';

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { tasks } = useTaskStore();
  const { isDark, toggleTheme, setThemeMode, theme } = useTheme();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [confirmDeleteEnabled, setConfirmDeleteEnabled] = useState(true);
  const [defaultPriority, setDefaultPriority] = useState('medium');
  const [showPriorityDialog, setShowPriorityDialog] = useState(false);
  const [showConfirmResetDialog, setShowConfirmResetDialog] = useState(false);
  const [showThemeModeDialog, setShowThemeModeDialog] = useState(false);

  const handleToggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    // In a real app, you would store this preference
  };

  const handleToggleConfirmDelete = () => {
    setConfirmDeleteEnabled(!confirmDeleteEnabled);
    // In a real app, you would store this preference
  };

  const handleResetApp = () => {
    // In a real app, you would implement actual data reset logic
    Alert.alert('App Reset', 'All data has been reset successfully.');
    setShowConfirmResetDialog(false);
  };

  const handleAbout = () => {
    Alert.alert(
      'About Task Manager',
      'Version 1.0.0\n\nA simple and efficient task management app built with React Native and Expo.'
    );
  };

  const renderStatCard = (title: string, value: string) => (
    <Card style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
      <Card.Content>
        <Text style={[styles.statTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.statValue, { color: theme.colors.primary }]}>{value}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.section}>
        <List.Section>
          <List.Subheader style={{ color: theme.colors.text }}>Appearance</List.Subheader>
          <List.Item
            title="Dark Mode"
            description={isDark ? "On" : "Off"}
            left={props => <List.Icon {...props} icon="theme-light-dark" />}
            right={() => (
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: "#767577", true: theme.colors.primary }}
                thumbColor={isDark ? theme.colors.card : "#f4f3f4"}
              />
            )}
            onPress={() => setShowThemeModeDialog(true)}
          />
        </List.Section>

        <List.Section>
          <List.Subheader style={{ color: theme.colors.text }}>Notifications</List.Subheader>
          <List.Item
            title="Enable Notifications"
            left={props => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: "#767577", true: theme.colors.primary }}
                thumbColor={notificationsEnabled ? theme.colors.card : "#f4f3f4"}
              />
            )}
          />
        </List.Section>

        <List.Section>
          <List.Subheader style={{ color: theme.colors.text }}>Task Settings</List.Subheader>
          <List.Item
            title="Confirm Before Delete"
            left={props => <List.Icon {...props} icon="trash-can" />}
            right={() => (
              <Switch
                value={confirmDeleteEnabled}
                onValueChange={handleToggleConfirmDelete}
                trackColor={{ false: "#767577", true: theme.colors.primary }}
                thumbColor={confirmDeleteEnabled ? theme.colors.card : "#f4f3f4"}
              />
            )}
          />
          <List.Item
            title="Default Priority"
            description={defaultPriority.charAt(0).toUpperCase() + defaultPriority.slice(1)}
            left={props => <List.Icon {...props} icon="flag" />}
            onPress={() => setShowPriorityDialog(true)}
          />
        </List.Section>

        <List.Section>
          <List.Subheader style={{ color: theme.colors.text }}>Statistics</List.Subheader>
          <View style={styles.statsContainer}>
            {renderStatCard('Total Tasks', tasks.length.toString())}
            {renderStatCard('Completed', tasks.filter(t => t.completed).length.toString())}
            {renderStatCard('Active', tasks.filter(t => !t.completed).length.toString())}
          </View>
        </List.Section>

        <List.Section>
          <List.Subheader style={{ color: theme.colors.text }}>About</List.Subheader>
          <List.Item
            title="Version"
            description="1.0.0"
            left={props => <List.Icon {...props} icon="information" />}
            onPress={handleAbout}
          />
        </List.Section>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <Button
            mode="contained"
            buttonColor="#dc3545"
            onPress={() => setShowConfirmResetDialog(true)}
          >
            Reset App Data
          </Button>
        </View>
      </View>

      <Portal>
        <Dialog visible={showPriorityDialog} onDismiss={() => setShowPriorityDialog(false)}>
          <Dialog.Title>Default Priority</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group onValueChange={value => {
              setDefaultPriority(value);
              setShowPriorityDialog(false);
            }} value={defaultPriority}>
              <RadioButton.Item label="High" value="high" />
              <RadioButton.Item label="Medium" value="medium" />
              <RadioButton.Item label="Low" value="low" />
            </RadioButton.Group>
          </Dialog.Content>
        </Dialog>

        <Dialog visible={showThemeModeDialog} onDismiss={() => setShowThemeModeDialog(false)}>
          <Dialog.Title>Select Theme Mode</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group onValueChange={value => {
              setThemeMode(value as ThemeMode);
              setShowThemeModeDialog(false);
            }} value={theme.mode}>
              <View style={styles.radioItem}>
                <RadioButton value="light" />
                <Text>Light</Text>
              </View>
              <View style={styles.radioItem}>
                <RadioButton value="dark" />
                <Text>Dark</Text>
              </View>
              <View style={styles.radioItem}>
                <RadioButton value="system" />
                <Text>System</Text>
              </View>
            </RadioButton.Group>
          </Dialog.Content>
        </Dialog>

        <Dialog visible={showConfirmResetDialog} onDismiss={() => setShowConfirmResetDialog(false)}>
          <Dialog.Title>Reset App Data</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to reset all app data? This action cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowConfirmResetDialog(false)}>Cancel</Button>
            <Button onPress={handleResetApp}>Reset</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    padding: 16,
  },
  statCard: {
    width: '30%',
    marginBottom: 8,
    elevation: 2,
  },
  statTitle: {
    fontSize: 12,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dangerZone: {
    padding: 16,
    marginTop: 16,
  },
  dangerTitle: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
}); 