/**
 * Lucide React Native Polyfill
 * 
 * This file replaces imports from lucide-react-native with our custom mock implementation
 * that uses Expo's Ionicons instead of SVG components.
 */

// Import our mock implementation
import * as IconMock from './icon-mock';

// Replace the global lucide-react-native module with our mock
if (typeof global.require === 'function') {
  // Save the original require function
  const originalRequire = global.require;
  
  // Override require to intercept lucide-react-native imports
  global.require = (moduleName, ...args) => {
    if (moduleName === 'lucide-react-native') {
      return IconMock;
    }
    
    // Call the original require for all other modules
    return originalRequire(moduleName, ...args);
  };
}

// Export our mock implementation as default
export default IconMock; 