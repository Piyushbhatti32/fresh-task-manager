import { NativeModules, Platform } from 'react-native';

const { GoogleSignIn } = NativeModules;

/**
 * Service for handling Google Sign-In functionality
 */
class GoogleSignInService {
  private isConfigured = false;

  /**
   * Configure the Google Sign-In module with the web client ID
   * @param webClientId The web client ID from Google Cloud Console
   */
  async configure(webClientId: string): Promise<void> {
    if (Platform.OS !== 'android') {
      console.warn('GoogleSignInService is only supported on Android');
      return;
    }

    try {
      await GoogleSignIn.configure(webClientId);
      this.isConfigured = true;
      console.log('Google Sign-In configured successfully');
    } catch (error) {
      console.error('Failed to configure Google Sign-In:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google
   * @returns The ID token from Google
   */
  async signIn(): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('Google Sign-In is not configured. Call configure() first.');
    }

    try {
      const idToken = await GoogleSignIn.signIn();
      return idToken;
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      throw error;
    }
  }

  /**
   * Sign out from Google
   */
  async signOut(): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('Google Sign-In is not configured. Call configure() first.');
    }

    try {
      await GoogleSignIn.signOut();
      console.log('Google Sign-In signed out successfully');
    } catch (error) {
      console.error('Google Sign-In sign out failed:', error);
      throw error;
    }
  }

  /**
   * Check if the user is already signed in
   * @returns True if the user is signed in, false otherwise
   */
  async isSignedIn(): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      // This is a workaround since the native module doesn't have an isSignedIn method
      // We try to get the current user, and if it fails, the user is not signed in
      await GoogleSignIn.signIn();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const googleSignInService = new GoogleSignInService(); 