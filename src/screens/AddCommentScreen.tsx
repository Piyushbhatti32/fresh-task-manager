import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, TextInput, Button } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type AddCommentScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddComment'>;

export default function AddCommentScreen() {
  const theme = useTheme();
  const navigation = useNavigation<AddCommentScreenNavigationProp>();
  const route = useRoute();
  const { taskId } = route.params as { taskId: string };
  const [comment, setComment] = useState('');

  const handleAddComment = () => {
    // TODO: Implement comment addition logic
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TextInput
        label="Add a comment"
        value={comment}
        onChangeText={setComment}
        multiline
        style={styles.input}
      />
      <Button mode="contained" onPress={handleAddComment} style={styles.button}>
        Add Comment
      </Button>
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