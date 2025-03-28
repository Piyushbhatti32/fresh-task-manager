import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { appTheme } from '../theme/AppTheme';

type EditTaskScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type EditTaskScreenRouteProp = RouteProp<RootStackParamList, 'EditTask'>;

export default function EditTaskScreen() {
  const navigation = useNavigation<EditTaskScreenNavigationProp>();
  const route = useRoute<EditTaskScreenRouteProp>();
  const { taskId } = route.params;

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Edit Task</Text>
      <Text variant="bodyLarge" style={styles.subtitle}>Task ID: {taskId}</Text>
      <Button 
        mode="contained" 
        onPress={() => navigation.goBack()}
        style={styles.button}
      >
        Go Back
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    color: appTheme.colors.onBackground,
    marginBottom: 16,
  },
  subtitle: {
    color: appTheme.colors.onSurfaceVariant,
    marginBottom: 24,
  },
  button: {
    backgroundColor: appTheme.colors.primary,
  }
}); 