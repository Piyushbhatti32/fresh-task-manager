import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, TextInput, Button, List } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type ShareTaskScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ShareTask'>;

export default function ShareTaskScreen() {
  const theme = useTheme();
  const navigation = useNavigation<ShareTaskScreenNavigationProp>();
  const route = useRoute();
  const { taskId } = route.params as { taskId: string };
  const [email, setEmail] = useState('');

  const handleShare = () => {
    // TODO: Implement task sharing logic
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TextInput
        label="Enter email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <Button mode="contained" onPress={handleShare} style={styles.button}>
        Share Task
      </Button>
      <List.Section>
        <List.Subheader>Recently Shared With</List.Subheader>
        {/* TODO: Add list of recent shares */}
      </List.Section>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
}); 