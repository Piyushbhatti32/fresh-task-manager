import { doc, setDoc, getDoc, updateDoc, serverTimestamp, getFirestore } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from '../types/user';
import { User } from 'firebase/auth';
import NetInfo from '@react-native-community/netinfo';

const MAX_RETRIES = 1;
const RETRY_DELAY = 500; // 500ms
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory cache for user profiles
const memoryCache = new Map<string, UserProfile>();
const cacheExpiry = new Map<string, number>();

const isCacheValid = (uid: string): boolean => {
  const expiry = cacheExpiry.get(uid);
  return expiry ? Date.now() < expiry : false;
};

const isOnline = async (): Promise<boolean> => {
  const netInfo = await NetInfo.fetch();
  return netInfo.isConnected ?? false;
};

const ensureFirestoreInitialized = async () => {
  try {
    // Check if Firestore is initialized
    if (!getFirestore()) {
      await delay(100); // Small delay to ensure initialization
    }
  } catch (error) {
    console.error('Error checking Firestore initialization:', error);
    await delay(100); // Delay on error
  }
};

export const userService = {
  async createUserProfile(user: User): Promise<void> {
    await ensureFirestoreInitialized();
    const userRef = doc(db, 'users', user.uid);
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.isAnonymous ? 'guest@example.com' : (user.email || ''),
      displayName: user.isAnonymous ? 'Guest User' : user.displayName,
      photoURL: user.photoURL,
      createdAt: new Date(),
      lastLogin: new Date(),
      isAnonymous: user.isAnonymous,
      settings: {
        theme: 'system',
        notifications: true,
        language: 'en'
      }
    };

    try {
      await setDoc(userRef, userProfile, { merge: true });
      memoryCache.set(user.uid, userProfile);
      cacheExpiry.set(user.uid, Date.now() + CACHE_DURATION);
    } catch (error: any) {
      console.error('Error creating user profile:', error);
      if (error.code === 'unavailable' || error.code === 'failed-precondition') {
        console.log('Device is offline, data will be synced when online');
        memoryCache.set(user.uid, userProfile);
        cacheExpiry.set(user.uid, Date.now() + CACHE_DURATION);
      }
    }
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    await ensureFirestoreInitialized();
    // Check memory cache first
    const cachedProfile = memoryCache.get(uid);
    if (cachedProfile && isCacheValid(uid)) {
      return cachedProfile;
    }

    const userRef = doc(db, 'users', uid);
    
    try {
      // Try to get from Firestore
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;
        // Update cache with expiry
        memoryCache.set(uid, profile);
        cacheExpiry.set(uid, Date.now() + CACHE_DURATION);
        return profile;
      }
      
      // If not in Firestore, check if we have a valid cached profile
      if (cachedProfile) {
        return cachedProfile;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error getting user profile:', error);
      if (error.code === 'unavailable' || error.code === 'failed-precondition') {
        // If offline, return cached data if available
        console.log('Device is offline, using cached data');
        if (cachedProfile) {
          return cachedProfile;
        }
      }
    }

    // Return a default profile if offline or error
    return {
      uid,
      email: 'guest@example.com',
      displayName: 'Guest User',
      photoURL: null,
      createdAt: new Date(),
      lastLogin: new Date(),
      isAnonymous: true,
      settings: {
        theme: 'system',
        notifications: true,
        language: 'en'
      }
    };
  },

  async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    await ensureFirestoreInitialized();
    const userRef = doc(db, 'users', uid);
    let retries = 0;

    while (retries < MAX_RETRIES) {
      try {
        const updateData = {
          ...data,
          lastLogin: serverTimestamp()
        };
        await updateDoc(userRef, updateData);
        
        // Update memory cache
        const currentProfile = memoryCache.get(uid);
        if (currentProfile) {
          memoryCache.set(uid, { ...currentProfile, ...updateData });
        }
        
        return;
      } catch (error: any) {
        console.error(`Error updating user profile (attempt ${retries + 1}):`, error);
        if (error.code === 'unavailable' || error.code === 'failed-precondition') {
          // If offline, update memory cache
          console.log('Device is offline, changes will be synced when online');
          const currentProfile = memoryCache.get(uid);
          if (currentProfile) {
            memoryCache.set(uid, { ...currentProfile, ...data });
          }
          return;
        }
        retries++;
        if (retries < MAX_RETRIES) {
          await delay(RETRY_DELAY);
        }
      }
    }
  },

  async updateUserSettings(uid: string, settings: Partial<UserProfile['settings']>): Promise<void> {
    await ensureFirestoreInitialized();
    const userRef = doc(db, 'users', uid);
    let retries = 0;

    while (retries < MAX_RETRIES) {
      try {
        await updateDoc(userRef, {
          'settings': settings
        });
        
        // Update memory cache
        const currentProfile = memoryCache.get(uid);
        if (currentProfile) {
          memoryCache.set(uid, {
            ...currentProfile,
            settings: { ...currentProfile.settings, ...settings }
          });
        }
        
        return;
      } catch (error: any) {
        console.error(`Error updating user settings (attempt ${retries + 1}):`, error);
        if (error.code === 'unavailable' || error.code === 'failed-precondition') {
          // If offline, update memory cache
          console.log('Device is offline, settings will be synced when online');
          const currentProfile = memoryCache.get(uid);
          if (currentProfile) {
            memoryCache.set(uid, {
              ...currentProfile,
              settings: { ...currentProfile.settings, ...settings }
            });
          }
          return;
        }
        retries++;
        if (retries < MAX_RETRIES) {
          await delay(RETRY_DELAY);
        }
      }
    }
  },

  async isAnonymousUser(uid: string): Promise<boolean> {
    await ensureFirestoreInitialized();
    try {
      const userProfile = await this.getUserProfile(uid);
      return userProfile?.isAnonymous || false;
    } catch (error: any) {
      console.error('Error checking anonymous status:', error);
      if (error.code === 'unavailable' || error.code === 'failed-precondition') {
        // If offline, use cached data
        console.log('Device is offline, using cached data');
        const cachedProfile = memoryCache.get(uid);
        return cachedProfile?.isAnonymous || false;
      }
      return true; // Default to true if error
    }
  }
}; 