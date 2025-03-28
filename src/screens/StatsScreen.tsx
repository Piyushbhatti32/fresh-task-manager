import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import databaseService from '../database/DatabaseService';

type TaskStats = {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  meetings: number;
  completionRate: number;
  averageCompletionTime: number;
};

type DailyStats = {
  date: string;
  completed: number;
  added: number;
};

export default function StatsScreen() {
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Get overall task statistics
      const overallStats = await databaseService.executeSql(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN completed = 0 AND dueDate < datetime('now') THEN 1 ELSE 0 END) as overdue,
          SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as highPriority,
          SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) as mediumPriority,
          SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) as lowPriority,
          SUM(CASE WHEN isMeeting = 1 THEN 1 ELSE 0 END) as meetings,
          AVG(CASE 
            WHEN completed = 1 
            THEN julianday(updatedAt) - julianday(createdAt)
            ELSE NULL 
          END) as avgCompletionDays
        FROM tasks
      `);

      const row = overallStats.rows.item(0);
      const completionRate = row.total > 0 ? (row.completed / row.total) * 100 : 0;

      setStats({
        total: row.total,
        completed: row.completed,
        pending: row.pending,
        overdue: row.overdue,
        highPriority: row.highPriority,
        mediumPriority: row.mediumPriority,
        lowPriority: row.lowPriority,
        meetings: row.meetings,
        completionRate,
        averageCompletionTime: row.avgCompletionDays || 0,
      });

      // Get weekly statistics
      const startDate = startOfWeek(new Date());
      const endDate = endOfWeek(new Date());
      const days = eachDayOfInterval({ start: startDate, end: endDate });

      const weeklyData = await Promise.all(days.map(async (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const result = await databaseService.executeSql(`
          SELECT
            (SELECT COUNT(*) FROM tasks 
             WHERE date(createdAt) = date(?) AND completed = 1) as completed,
            (SELECT COUNT(*) FROM tasks 
             WHERE date(createdAt) = date(?)) as added
        `, [dateStr, dateStr]);

        return {
          date: dateStr,
          completed: result.rows.item(0).completed,
          added: result.rows.item(0).added,
        };
      }));

      setWeeklyStats(weeklyData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading stats:', error);
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <View style={styles.centered}>
        <Text>Loading statistics...</Text>
      </View>
    );
  }

  const renderStatCard = (title: string, value: number | string, subtitle?: string) => (
    <Surface style={styles.statCard}>
      <Text variant="titleLarge" style={styles.statValue}>
        {typeof value === 'number' && !isNaN(value) ? 
          value.toFixed(value % 1 === 0 ? 0 : 1) : 
          value}
      </Text>
      <Text variant="labelMedium" style={styles.statTitle}>{title}</Text>
      {subtitle && (
        <Text variant="labelSmall" style={styles.statSubtitle}>{subtitle}</Text>
      )}
    </Surface>
  );

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineSmall" style={styles.sectionTitle}>Overview</Text>
      <View style={styles.statsGrid}>
        {renderStatCard('Total Tasks', stats.total)}
        {renderStatCard('Completed', stats.completed)}
        {renderStatCard('Pending', stats.pending)}
        {renderStatCard('Overdue', stats.overdue)}
      </View>

      <Text variant="headlineSmall" style={styles.sectionTitle}>Task Breakdown</Text>
      <View style={styles.statsGrid}>
        {renderStatCard('High Priority', stats.highPriority)}
        {renderStatCard('Medium Priority', stats.mediumPriority)}
        {renderStatCard('Low Priority', stats.lowPriority)}
        {renderStatCard('Meetings', stats.meetings)}
      </View>

      <Text variant="headlineSmall" style={styles.sectionTitle}>Performance</Text>
      <View style={styles.statsGrid}>
        {renderStatCard('Completion Rate', `${stats.completionRate.toFixed(1)}%`)}
        {renderStatCard(
          'Avg. Completion Time', 
          stats.averageCompletionTime.toFixed(1),
          'days'
        )}
      </View>

      <Text variant="headlineSmall" style={styles.sectionTitle}>This Week</Text>
      <Surface style={styles.weeklyChart}>
        {weeklyStats.map((day, index) => (
          <View key={day.date} style={styles.weekDay}>
            <View style={styles.barContainer}>
              <View style={[
                styles.bar,
                { 
                  height: `${(day.completed / Math.max(...weeklyStats.map(d => d.added))) * 100}%`,
                  backgroundColor: theme.colors.primary
                }
              ]} />
              <View style={[
                styles.bar,
                { 
                  height: `${(day.added / Math.max(...weeklyStats.map(d => d.added))) * 100}%`,
                  backgroundColor: theme.colors.secondary,
                  opacity: 0.5
                }
              ]} />
            </View>
            <Text variant="labelSmall">
              {format(new Date(day.date), 'EEE')}
            </Text>
          </View>
        ))}
      </Surface>
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
          <Text variant="labelSmall">Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.secondary, opacity: 0.5 }]} />
          <Text variant="labelSmall">Added</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  statSubtitle: {
    marginTop: 4,
    opacity: 0.5,
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    height: 150,
    width: 20,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    position: 'absolute',
    bottom: 0,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
}); 