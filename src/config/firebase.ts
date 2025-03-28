import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
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
  connectFirestoreEmulator
} from 'firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

// Replace this with your Firebase configuration from Firebase Console
// Project Settings > General > Your apps > Web app
const firebaseConfig = {
  apiKey: "AIzaSyBC1cpIK_tKqnylNgQSdrv7kxoEfzLGtDs",
  authDomain: "task-manager-8dad8.firebaseapp.com",
  projectId: "task-manager-8dad8",
  storageBucket: "task-manager-8dad8.firebasestorage.app",
  messagingSenderId: "865106052518",
  appId: "1:865106052518:web:a2c54ec13870d813617b67",
  measurementId: "G-5B3K05L5NZ"
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
  app = getApp();
}

// Initialize Auth with AsyncStorage persistence
let auth;
try {
  if (!getAuth()) {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } else {
    auth = getAuth(app);
  }
} catch (error) {
  console.error('Auth initialization error:', error);
  auth = getAuth(app);
}

// Initialize Firestore with memory cache for better compatibility
let db;
try {
  if (!getFirestore()) {
    db = initializeFirestore(app, {
      localCache: memoryLocalCache(),
      experimentalForceLongPolling: true,
      useFetchStreams: false
    });
  } else {
    db = getFirestore(app);
  }
} catch (error) {
  console.error('Firestore initialization error:', error);
  db = getFirestore(app);
}

// Monitor network state and enable/disable Firestore network
let unsubscribeNetInfo;
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