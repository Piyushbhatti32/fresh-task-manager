import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  enableNetwork,
  disableNetwork,
  initializeFirestore,
  memoryLocalCache,
  connectFirestoreEmulator,
  Firestore
} from 'firebase/firestore';
import NetInfo, { NetInfoSubscription } from '@react-native-community/netinfo';
import { Platform } from 'react-native';

// Check for required environment variables
const requiredEnvVars = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID'
] as const;

const missingEnvVars = requiredEnvVars.filter(
  varName => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables:\n${missingEnvVars.join('\n')}\n` +
    'Please check your .env file and ensure all required variables are set.'
  );
}

// Disable WebChannel warnings
if (Platform.OS !== 'web') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0]?.includes?.('@firebase/firestore')) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

// Replace this with your Firebase configuration from Firebase Console
// Project Settings > General > Your apps > Web app
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
let app;
try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

// Initialize Auth
let auth: Auth;
try {
  auth = getAuth(app);
} catch (error) {
  console.error('Auth initialization error:', error);
  throw error;
}

// Initialize Firestore with memory cache for better compatibility
let db: Firestore;
try {
  db = initializeFirestore(app, {
    localCache: memoryLocalCache(),
    experimentalForceLongPolling: true
  });
} catch (error) {
  console.error('Firestore initialization error:', error);
  throw error;
}

// Monitor network state and enable/disable Firestore network
let unsubscribeNetInfo: NetInfoSubscription | undefined;
try {
  unsubscribeNetInfo = NetInfo.addEventListener(state => {
    if (state.isConnected) {
      console.log('Network connected');
      enableNetwork(db).catch(console.error);
    } else {
      console.log('Network disconnected');
      disableNetwork(db).catch(console.error);
    }
  });
} catch (error) {
  console.error('Network monitoring error:', error);
}

// Initialize Analytics only if supported
let analytics = null;
isSupported().then(yes => {
  if (yes) {
    try {
      analytics = getAnalytics(app);
    } catch (error) {
      console.error('Analytics initialization error:', error);
    }
  }
});

// Cleanup function
export const cleanup = () => {
  if (unsubscribeNetInfo) {
    unsubscribeNetInfo();
  }
};

// Export initialized services
export { auth, db, analytics }; 