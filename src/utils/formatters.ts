/**
 * Utility functions for formatting data
 */

/**
 * Formats a date for storage by converting it to ISO string
 * @param date The date to format
 * @returns ISO string representation of the date
 */
export const formatDateForStorage = (date: Date): string => {
  return date.toISOString();
};

/**
 * Formats a date for display in a readable format
 * @param dateString ISO date string
 * @returns Formatted date string (e.g., "Jan 1, 2023")
 */
export const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Formats a time for display in a readable format
 * @param dateString ISO date string
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export const formatTimeForDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
};

/**
 * Formats a date and time for display
 * @param dateString ISO date string
 * @returns Formatted date and time string (e.g., "Jan 1, 2023 at 2:30 PM")
 */
export const formatDateTimeForDisplay = (dateString: string): string => {
  return `${formatDateForDisplay(dateString)} at ${formatTimeForDisplay(dateString)}`;
}; 