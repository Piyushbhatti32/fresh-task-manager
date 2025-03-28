import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';
import App from './app.js';

// Register with both methods to ensure compatibility
AppRegistry.registerComponent('main', () => App);
registerRootComponent(App);
