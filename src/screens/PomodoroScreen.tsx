import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import PomodoroTimer from '../components/PomodoroTimer';

type PomodoroScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Pomodoro'>;

export default function PomodoroScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<PomodoroScreenNavigationProp>();
  const route = useRoute();
  const { taskId } = route.params as { taskId: string };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <PomodoroTimer initialTaskId={taskId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 