import { parseISO, format, isToday, isTomorrow, isPast, formatDistanceToNow } from 'date-fns';

// Parse ISO date string
export const parseDate = (dateString: string): Date => {
  return parseISO(dateString);
};

// Format a date for display
export const formatDateDisplay = (dateString: string): string => {
  return format(parseISO(dateString), 'MMM d, yyyy');
};

// Format a time for display
export const formatTimeDisplay = (dateString: string): string => {
  return format(parseISO(dateString), 'h:mm a');
};

// Get a human-readable deadline label
export const getDeadlineLabel = (dateString: string): string => {
  const date = parseISO(dateString);
  
  if (isToday(date)) {
    return `Today, ${format(date, 'h:mm a')}`;
  } else if (isTomorrow(date)) {
    return `Tomorrow, ${format(date, 'h:mm a')}`;
  } else {
    return format(date, 'MMM d, h:mm a');
  }
};

// Check if a deadline is overdue
export const isDeadlineOverdue = (dateString: string): boolean => {
  const date = parseISO(dateString);
  return isPast(date);
};

// Get a color for task status
export const getTaskStatusColor = (dateString: string, completed: boolean): string => {
  if (completed) {
    return '#10b981'; // Green for completed tasks
  }
  
  const date = parseISO(dateString);
  
  if (isPast(date)) {
    return '#ef4444'; // Red for overdue tasks
  } else if (isToday(date)) {
    return '#f59e0b'; // Amber for tasks due today
  } else {
    return '#3b82f6'; // Blue for upcoming tasks
  }
};

// Get relative time (e.g., "2 hours ago")
export const getRelativeTime = (dateString: string): string => {
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
}; 