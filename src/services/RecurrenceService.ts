import { format, parse } from 'date-fns';

/**
 * Sets the time portion of a date object based on a formatted time string
 * @param date The date to set the time for
 * @param timeString The time in format 'HH:mm'
 * @returns A new date with the time set
 */
export function setTimeForDate(date: Date, timeString: string): Date {
  if (!timeString) return date;
  
  const timeParts = timeString.split(':');
  const hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);
  
  const newDate = new Date(date);
  newDate.setHours(hours);
  newDate.setMinutes(minutes);
  newDate.setSeconds(0);
  newDate.setMilliseconds(0);
  
  return newDate;
} 