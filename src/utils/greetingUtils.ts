/**
 * Returns a time-based greeting with optional user name
 * @param name Optional user name to include in the greeting
 * @returns A greeting string based on the current time of day
 */
export const getTimeBasedGreeting = (name?: string): string => {
  const hour = new Date().getHours();
  let greeting = '';
  
  if (hour >= 5 && hour < 12) greeting = 'Good Morning';
  else if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
  else if (hour >= 17 && hour < 21) greeting = 'Good Evening';
  else greeting = 'Good Night';
  
  return name ? `${greeting}, ${name}` : greeting;
}; 