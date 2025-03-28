/**
 * Generates a unique ID for use within the app
 * This is a simpler alternative to uuid that doesn't require crypto.getRandomValues()
 */
export const generateId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}`;
}; 