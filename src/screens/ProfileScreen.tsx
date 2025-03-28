import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { 
  TextInput,
  Button,
  Switch,
  Text, 
  Avatar, 
  Divider, 
  List,
  SegmentedButtons,
  Portal,
  Dialog,
  ActivityIndicator,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../config/firebase';
import { userService } from '../services/userService';
import { UserProfile } from '../types/user';
import { sendEmailVerification } from 'firebase/auth';
import defaultAvatar from '../assets/default-avatar.png';

export default function ProfileScreen({ navigation }: any) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<string>('');
  const [tempSettings, setTempSettings] = useState<any>(null);

  const loadProfile = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const userProfile = await userService.getUserProfile(user.uid);
      if (userProfile) {
        setProfile(userProfile);
        setDisplayName(userProfile.displayName || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleUpdateProfile = useCallback(async () => {
    const user = auth.currentUser;
    if (!user || !profile) return;

    setIsLoading(true);
    try {
      await userService.updateUserProfile(user.uid, {
        displayName,
      });
      await loadProfile();
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  }, [displayName, profile, loadProfile]);

  const handleVerifyEmail = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    setIsLoading(true);
    try {
      await sendEmailVerification(user);
      Alert.alert(
        'Verification Email Sent',
        'Please check your email to verify your account'
      );
    } catch (error) {
      console.error('Error sending verification email:', error);
      Alert.alert('Error', 'Failed to send verification email');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8, // Reduced quality for faster upload
    });

    if (!result.canceled && result.assets[0].uri) {
      setIsLoading(true);
      try {
        const photoURL = result.assets[0].uri;
        await userService.updateUserProfile(auth.currentUser!.uid, { photoURL });
        await loadProfile();
      } catch (error) {
        console.error('Error updating profile picture:', error);
        Alert.alert('Error', 'Failed to update profile picture');
      } finally {
        setIsLoading(false);
      }
    }
  }, [loadProfile]);

  const openSettingsDialog = useCallback((setting: string) => {
    setSelectedSetting(setting);
    setTempSettings({ ...profile?.settings });
    setShowSettingsDialog(true);
  }, [profile?.settings]);

  const handleSaveSettings = useCallback(async () => {
    if (!profile || !auth.currentUser) return;

    setIsLoading(true);
    try {
      await userService.updateUserProfile(auth.currentUser.uid, {
        settings: tempSettings,
      });
      await loadProfile();
      setShowSettingsDialog(false);
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  }, [profile, tempSettings, loadProfile]);

  const handleNotificationToggle = useCallback(async (value: boolean) => {
    if (!profile || !auth.currentUser) return;
    
    try {
      await userService.updateUserProfile(auth.currentUser.uid, {
        settings: { ...profile.settings, notifications: value }
      });
      await loadProfile();
    } catch (error) {
      console.error('Error updating notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  }, [profile, loadProfile]);

  const avatarSource = useMemo(() => 
    profile?.photoURL ? { uri: profile.photoURL } : defaultAvatar,
    [profile?.photoURL]
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Failed to load profile</Text>
        <Button mode="contained" onPress={loadProfile} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
          <Avatar.Image 
            size={100}
            source={avatarSource}
          />
          <Button
            mode="outlined"
            onPress={handlePickImage}
            style={styles.changePhotoButton}
          >
            Change Photo
          </Button>
      </View>
      
        <View style={styles.form}>
          <TextInput
            label="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            mode="outlined"
            style={styles.input}
          />

          <Text style={styles.emailText}>{profile.email}</Text>
          {!profile.isEmailVerified && (
            <Button
              mode="contained"
              onPress={handleVerifyEmail}
              loading={isLoading}
              style={styles.verifyButton}
            >
              Verify Email
            </Button>
          )}
          
          <Divider style={styles.divider} />

          <List.Section>
            <List.Subheader>Settings</List.Subheader>
          
          <List.Item
              title="Theme"
              description={profile.settings.theme}
              onPress={() => openSettingsDialog('theme')}
              right={props => <List.Icon {...props} icon="chevron-right" />}
            />
            
            <List.Item
              title="Task View"
              description={profile.settings.taskView}
              onPress={() => openSettingsDialog('taskView')}
              right={props => <List.Icon {...props} icon="chevron-right" />}
            />
          
          <List.Item
              title="Notifications"
              right={() => (
                <Switch
                  value={profile.settings.notifications}
                  onValueChange={handleNotificationToggle}
                />
              )}
            />
          
          <List.Item
              title="Accessibility"
              onPress={() => openSettingsDialog('accessibility')}
              right={props => <List.Icon {...props} icon="chevron-right" />}
            />

            <List.Item
              title="Privacy"
              onPress={() => openSettingsDialog('privacy')}
              right={props => <List.Icon {...props} icon="chevron-right" />}
            />
          
          <List.Item
              title="Work Hours"
              onPress={() => openSettingsDialog('workHours')}
              right={props => <List.Icon {...props} icon="chevron-right" />}
            />
          </List.Section>
      
      <Button 
        mode="contained" 
            onPress={handleUpdateProfile}
            loading={isLoading}
            style={styles.saveButton}
          >
            Save Changes
      </Button>
        </View>

        <Portal>
          <Dialog
            visible={showSettingsDialog}
            onDismiss={() => setShowSettingsDialog(false)}
          >
            <Dialog.Title>
              {selectedSetting.charAt(0).toUpperCase() + selectedSetting.slice(1)}
            </Dialog.Title>
            <Dialog.Content>
              {selectedSetting === 'theme' && (
                <SegmentedButtons
                  value={tempSettings?.theme || 'system'}
                  onValueChange={value =>
                    setTempSettings({ ...tempSettings, theme: value })
                  }
                  buttons={[
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' },
                    { value: 'system', label: 'System' },
                  ]}
                />
              )}
              {/* Add more setting-specific UI components here */}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowSettingsDialog(false)}>Cancel</Button>
              <Button onPress={handleSaveSettings}>Save</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  changePhotoButton: {
    marginTop: 8,
  },
  form: {
    flex: 1,
  },
  input: {
    marginBottom: 16,
  },
  emailText: {
    fontSize: 16,
    marginBottom: 8,
  },
  verifyButton: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  saveButton: {
    marginTop: 24,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#ff0000',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
});