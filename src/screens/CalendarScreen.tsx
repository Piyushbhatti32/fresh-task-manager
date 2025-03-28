import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Text, useTheme, Portal, Modal } from 'react-native-paper';
import { format } from 'date-fns';
import TaskList from '../components/TaskList';
import TaskDetail from '../components/TaskDetail';
import databaseService from '../database/DatabaseService';

type MarkedDates = {
  [date: string]: {
    marked: boolean;
    dotColor?: string;
  };
};

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const theme = useTheme();

  useEffect(() => {
    loadTaskDates();
  }, []);

  const loadTaskDates = async () => {
    try {
      const result = await databaseService.executeSql(`
        SELECT dueDate, priority FROM tasks
        WHERE completed = 0
        GROUP BY date(dueDate)
      `);

      const marked: MarkedDates = {};
      result.rows._array.forEach((row: { dueDate: string; priority: string }) => {
        const date = format(new Date(row.dueDate), 'yyyy-MM-dd');
        marked[date] = {
          marked: true,
          dotColor: row.priority === 'high' ? '#EF4444' :
                    row.priority === 'medium' ? '#F59E0B' : '#10B981'
        };
      });

      setMarkedDates(marked);
    } catch (error) {
      console.error('Error loading task dates:', error);
    }
  };

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
  };

  const handleTaskPress = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  return (
    <View style={styles.container}>
      <Calendar
        current={selectedDate}
        onDayPress={handleDayPress}
        markedDates={{
          ...markedDates,
          [selectedDate]: {
            ...(markedDates[selectedDate] || {}),
            selected: true,
            selectedColor: theme.colors.primary,
          },
        }}
        theme={{
          backgroundColor: theme.colors.background,
          calendarBackground: theme.colors.background,
          textSectionTitleColor: theme.colors.primary,
          selectedDayBackgroundColor: theme.colors.primary,
          selectedDayTextColor: '#ffffff',
          todayTextColor: theme.colors.primary,
          dayTextColor: theme.colors.onBackground,
          textDisabledColor: theme.colors.outline,
          dotColor: theme.colors.primary,
          monthTextColor: theme.colors.onBackground,
          arrowColor: theme.colors.primary,
          indicatorColor: theme.colors.primary,
        }}
      />

      <View style={styles.taskList}>
        <Text variant="titleMedium" style={styles.dateHeader}>
          Tasks for {format(new Date(selectedDate), 'MMMM d, yyyy')}
        </Text>
        
        <TaskList
          onTaskPress={handleTaskPress}
          filter={{
            status: 'pending',
          }}
          sortBy="deadline"
          sortOrder="asc"
        />
      </View>

      <Portal>
        {selectedTaskId && (
          <Modal
            visible={true}
            onDismiss={() => setSelectedTaskId(null)}
            contentContainerStyle={styles.modalContent}
          >
            <TaskDetail
              taskId={selectedTaskId}
              onEdit={() => {
                // Handle edit navigation
                setSelectedTaskId(null);
              }}
              onDelete={() => {
                // Handle delete
                setSelectedTaskId(null);
                loadTaskDates(); // Refresh calendar markers
              }}
              onBack={() => setSelectedTaskId(null)}
            />
          </Modal>
        )}
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  taskList: {
    flex: 1,
    padding: 16,
  },
  dateHeader: {
    marginBottom: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 8,
    maxHeight: '90%',
  },
}); 