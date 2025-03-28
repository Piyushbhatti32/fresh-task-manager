import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import type { User } from '@react-native-google-signin/google-signin';

// Constants
const AUTH_STORAGE_KEY = 'auth_data';
const GUEST_STORAGE_KEY = 'guest_auth';

// Initialize Google Sign In
GoogleSignin.configure({
  webClientId: '757253114955-fs14dlmo7pi86p00ce0rbcr8qh9hkid5.apps.googleusercontent.com',
  offlineAccess: true
});

// Interface for auth state
export interface AuthData {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    name: string;
    photoUrl?: string;
  };
  expiresAt: number;
  isGuest?: boolean;
  provider?: string;
}

// Define the internal structure for type safety
interface GoogleUserInfo {
  id: string;
  email: string;
  name: string | null;
  photo: string | null;
  familyName: string | null;
  givenName: string | null;
}

// Google Sign-In function
export const signInWithGoogle = async (): Promise<AuthData> => {
  try {
    await GoogleSignin.hasPlayServices();
    
    // Sign in and get user info - use type assertion since API types may be outdated
    const signInResult = await GoogleSignin.signIn();
    const tokens = await GoogleSignin.getTokens();
    
    // Access user data with type assertion
    const userData = (signInResult as any).user as GoogleUserInfo;
    
    const authData: AuthData = {
      accessToken: tokens.accessToken,
      idToken: tokens.idToken,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name || userData.email.split('@')[0],
        photoUrl: userData.photo || undefined,
      },
      expiresAt: Date.now() + 3600000, // 1 hour from now
      provider: 'google'
    };

    // Store auth data
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    return authData;
  } catch (error) {
    console.error('Google sign in error:', error);
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = (error as any).code;
      if (errorCode === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('User cancelled the login flow');
      } else if (errorCode === statusCodes.IN_PROGRESS) {
        throw new Error('Sign in is in progress');
      } else if (errorCode === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Play services not available');
      }
    }
    throw error;
  }
};

// Sign out function
export const signOut = async (): Promise<void> => {
  try {
    const authData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (authData) {
      const { provider } = JSON.parse(authData);
      if (provider === 'google') {
        await GoogleSignin.signOut();
      }
    }
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    console.log('User logged out successfully');
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const authData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (!authData) return false;
    
    const data: AuthData = JSON.parse(authData);
    if (data.isGuest) return true;
    
    // Check if token is expired
    if (data.expiresAt < Date.now()) {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
};

// Get stored auth data
export const getAuthData = async (): Promise<AuthData | null> => {
  try {
    const authData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    return authData ? JSON.parse(authData) : null;
  } catch (error) {
    console.error('Get auth data error:', error);
    return null;
  }
};

// Sign in as guest
export const signInAsGuest = async (): Promise<AuthData> => {
  const guestData: AuthData = {
    accessToken: 'guest-token',
    user: {
      id: 'guest-' + Date.now(),
      email: 'guest@example.com',
      name: 'Guest User',
    },
    expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
    isGuest: true,
    provider: 'guest'
  };
  
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(guestData));
  return guestData;
}; 