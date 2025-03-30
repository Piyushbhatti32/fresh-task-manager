import { doc, setDoc, getDoc, updateDoc, serverTimestamp, getFirestore } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from '../types/user';
import { User } from 'firebase/auth';
import NetInfo from '@react-native-community/netinfo';

const MAX_RETRIES = 1;
const RETRY_DELAY = 500; // 500ms
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes (increased from 5 minutes)

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
    if (!uid) {
      console.error('getUserProfile called with invalid uid');
      return null;
    }
    
    // Check memory cache first before initializing Firestore
    const cachedProfile = memoryCache.get(uid);
    if (cachedProfile && isCacheValid(uid)) {
      console.log('Using cached profile for user:', uid);
      return cachedProfile;
    }
    
    try {
      await ensureFirestoreInitialized();
      const userRef = doc(db, 'users', uid);
      
      // Try to get from Firestore with timeout
      const userDoc = await Promise.race([
        getDoc(userRef),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)) // 5 second timeout
      ]);
      
      if (userDoc && 'exists' in userDoc && userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;
        // Update cache with longer expiry
        memoryCache.set(uid, profile);
        cacheExpiry.set(uid, Date.now() + CACHE_DURATION);
        return profile;
      }
      
      // If not in Firestore but in cache, use cache
      if (cachedProfile) {
        return cachedProfile;
      }
      
      // No profile found, return null
      return null;
    } catch (error: any) {
      console.error('Error getting user profile:', error);
      
      // Return cached profile if available, even if expired
      if (cachedProfile) {
        return cachedProfile;
      }
      
      // Return null on error
      return null;
    }
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

// Add a function to preload user profile in background
export const preloadUserProfile = async (uid: string): Promise<void> => {
  try {
    if (memoryCache.has(uid) && isCacheValid(uid)) {
      return; // Already in cache
    }
    const userProfile = await userService.getUserProfile(uid);
    console.log('Profile preloaded successfully for user:', uid);
  } catch (error) {
    console.error('Error preloading profile:', error);
    // Silently fail on preload
  }
}; 