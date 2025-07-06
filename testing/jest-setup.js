import 'react-native-gesture-handler/jestSetup';

// Mock the native animated module
jest.mock('react-native/Libraries/Animated/NativeAnimatedModule', () => ({
  createAnimatedNode: jest.fn(),
  connectAnimatedNodes: jest.fn(),
  disconnectAnimatedNodes: jest.fn(),
  startAnimatingNode: jest.fn(),
  stopAnimation: jest.fn(),
  setAnimatedNodeValue: jest.fn(),
  setAnimatedNodeOffset: jest.fn(),
  flattenAnimatedNodeOffset: jest.fn(),
  extractAnimatedNodeOffset: jest.fn(),
  connectAnimatedNodeToView: jest.fn(),
  disconnectAnimatedNodeFromView: jest.fn(),
  dropAnimatedNode: jest.fn(),
  addAnimatedEventToView: jest.fn(),
  removeAnimatedEventFromView: jest.fn(),
  startListeningToAnimatedNodeValue: jest.fn(),
  stopListeningToAnimatedNodeValue: jest.fn(),
  getValue: jest.fn(),
}));

// Mock NativeAnimatedHelper
jest.mock('react-native/Libraries/Animated/src/NativeAnimatedHelper', () => {
  return {
    API: {
      createAnimatedNode: jest.fn(),
      updateAnimatedNodeConfig: jest.fn(),
      getValue: jest.fn(),
      startListeningToAnimatedNodeValue: jest.fn(),
      stopListeningToAnimatedNodeValue: jest.fn(),
      connectAnimatedNodes: jest.fn(),
      disconnectAnimatedNodes: jest.fn(),
      startAnimatingNode: jest.fn(),
      stopAnimation: jest.fn(),
      setAnimatedNodeValue: jest.fn(),
      setAnimatedNodeOffset: jest.fn(),
      flattenAnimatedNodeOffset: jest.fn(),
      extractAnimatedNodeOffset: jest.fn(),
      connectAnimatedNodeToView: jest.fn(),
      disconnectAnimatedNodeFromView: jest.fn(),
      restoreDefaultValues: jest.fn(),
      dropAnimatedNode: jest.fn(),
      addAnimatedEventToView: jest.fn(),
      removeAnimatedEventFromView: jest.fn(),
    },
    nativeEventEmitter: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    transaction: jest.fn(),
    close: jest.fn(),
  })),
})); 