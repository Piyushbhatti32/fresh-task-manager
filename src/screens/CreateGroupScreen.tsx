import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Appbar, 
  useTheme 
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useGroupStore } from '../stores/groupStore';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';

type CreateGroupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateGroup'>;

export const CreateGroupScreen = () => {
  const navigation = useNavigation<CreateGroupScreenNavigationProp>();
  const theme = useTheme();
  const { user } = useAuth();
  
  // State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');
  
  // Handle create group
  const handleCreateGroup = async () => {
    // Reset errors
    setNameError('');
    
    // Validate form
    let isValid = true;
    
    if (!name.trim()) {
      setNameError('Group name is required');
      isValid = false;
    }
    
    if (!isValid) return;
    
    // Submit form
    setIsSubmitting(true);
    
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      const { createGroup } = useGroupStore.getState();
      const newGroup = createGroup(
        name, 
        description, 
        user.id, 
        new Date().toISOString(), // createdAt timestamp
        "public" // visibility type
      );
      
      // Navigate to the group detail screen
      navigation.replace('GroupDetail', { groupId: newGroup.id });
    } catch (error) {
      console.error('Error creating group:', error);
      // Show error message
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Create New Group" />
      </Appbar.Header>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.formContainer}>
              <Text style={styles.formLabel}>Group Information</Text>
              
              <TextInput
                label="Group Name"
                value={name}
                onChangeText={setName}
                style={styles.input}
                mode="outlined"
                error={!!nameError}
                outlineColor="#333"
                activeOutlineColor="#3498db"
                disabled={isSubmitting}
              />
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
              
              <TextInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={4}
                outlineColor="#333"
                activeOutlineColor="#3498db"
                disabled={isSubmitting}
              />
              
              <Text style={styles.helperText}>
                You'll be able to invite team members after creating the group.
              </Text>
            </View>
            
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleCreateGroup}
                loading={isSubmitting}
                disabled={isSubmitting}
                style={styles.createButton}
                contentStyle={styles.buttonContent}
              >
                Create Group
              </Button>
              
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                disabled={isSubmitting}
                style={styles.cancelButton}
                contentStyle={styles.buttonContent}
              >
                Cancel
              </Button>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  formContainer: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#111',
  },
  errorText: {
    color: '#f44336',
    marginTop: -12,
    marginBottom: 16,
    fontSize: 12,
  },
  helperText: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 'auto',
    marginBottom: 16,
  },
  createButton: {
    marginBottom: 12,
    backgroundColor: '#3498db',
  },
  cancelButton: {
    borderColor: '#555',
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default CreateGroupScreen; 