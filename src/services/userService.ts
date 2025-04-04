import { doc, setDoc, getDoc, updateDoc, serverTimestamp, getFirestore, Firestore } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile, UserProfileUpdate } from '../types/user';
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

export interface IUserService {
  createUserProfile(userProfile: UserProfile): Promise<void>;
  updateUserProfile(uid: string, updates: UserProfileUpdate): Promise<void>;
  getUserProfile(uid: string): Promise<UserProfile | null>;
}

class UserService implements IUserService {
  private db: Firestore;

  constructor() {
    this.db = db;
  }

  async createUserProfile(userProfile: UserProfile): Promise<void> {
    const userRef = doc(this.db, 'users', userProfile.uid);
    await setDoc(userRef, {
      ...userProfile,
      createdAt: userProfile.createdAt.toISOString(),
      lastLogin: userProfile.lastLogin.toISOString()
    });
  }

  async updateUserProfile(uid: string, updates: UserProfileUpdate): Promise<void> {
    const userRef = doc(this.db, 'users', uid);
    const updateData: Record<string, any> = { ...updates };
    
    if (updates.lastLogin) {
      updateData.lastLogin = updates.lastLogin.toISOString();
    }
    
    await updateDoc(userRef, updateData);
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(this.db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const data = userDoc.data();
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      lastLogin: new Date(data.lastLogin)
    } as UserProfile;
  }
}

export const userService = new UserService();

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