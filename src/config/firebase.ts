import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  initializeAuth, 
  getAuth, 
  Auth, 
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { 
  getFirestore, 
  CACHE_SIZE_UNLIMITED,
  enableNetwork,
  disableNetwork,
  initializeFirestore,
  Firestore,
  FirestoreSettings,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import NetInfo, { NetInfoSubscription } from '@react-native-community/netinfo';
import { Platform } from 'react-native';

// Validate environment variables
const validateEnvVars = () => {
  const requiredVars = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: Platform.select({
    ios: process.env.EXPO_PUBLIC_FIREBASE_IOS_APP_ID,
    android: process.env.EXPO_PUBLIC_FIREBASE_ANDROID_APP_ID,
    default: process.env.EXPO_PUBLIC_FIREBASE_WEB_APP_ID
  })
};

// Initialize Firebase
let app;
let auth: Auth;
let db: Firestore;

try {
  // Validate environment variables before initialization
  validateEnvVars();

  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    
    // Initialize Auth with proper persistence
    if (Platform.OS === 'web') {
      auth = getAuth(app);
      // Set persistence for web
      setPersistence(auth, browserLocalPersistence).catch(console.error);
    } else {
      auth = getAuth(app);
      // For native platforms, persistence is handled automatically
    }

    // Initialize Firestore with platform-specific settings
    const firestoreSettings: FirestoreSettings = {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      experimentalForceLongPolling: Platform.OS === 'web',
      localCache: Platform.OS === 'web' 
        ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
        : undefined
    };

    db = initializeFirestore(app, firestoreSettings);
  } else {
    app = getApp();
    auth = getAuth();
    db = getFirestore();
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
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
export { app, auth, db, analytics }; 