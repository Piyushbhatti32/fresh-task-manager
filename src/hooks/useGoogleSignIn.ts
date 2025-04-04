import { useState, useCallback } from 'react';
import { googleSignInService } from '../services/googleSignInService';

/**
 * Hook for Google Sign-In functionality
 * @param webClientId The web client ID from Google Cloud Console
 */
export const useGoogleSignIn = (webClientId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Configure Google Sign-In
  const configure = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await googleSignInService.configure(webClientId);
      const signedIn = await googleSignInService.isSignedIn();
      setIsSignedIn(signedIn);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to configure Google Sign-In'));
    } finally {
      setIsLoading(false);
    }
  }, [webClientId]);

  // Sign in with Google
  const signIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const idToken = await googleSignInService.signIn();
      setIsSignedIn(true);
      return idToken;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sign in with Google'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign out from Google
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await googleSignInService.signOut();
      setIsSignedIn(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sign out from Google'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if user is signed in
  const checkSignInStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const signedIn = await googleSignInService.isSignedIn();
      setIsSignedIn(signedIn);
      return signedIn;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to check sign-in status'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    isSignedIn,
    configure,
    signIn,
    signOut,
    checkSignInStatus,
  };
}; 