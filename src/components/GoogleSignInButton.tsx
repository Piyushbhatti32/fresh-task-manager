import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Button } from 'react-native-paper';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { ResponseType } from 'expo-auth-session';
import { GoogleAuthProvider, signInWithCredential, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

WebBrowser.maybeCompleteAuthSession();

interface GoogleSignInButtonProps {
  onSignInSuccess: (userCredential: any) => void;
  onSignInError: (error: Error) => void;
  style?: ViewStyle;
}

/**
 * A button component for Google Sign-In
 */
export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSignInSuccess,
  onSignInError,
  style
}) => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '865106052518-26mpbiv13vgjn77ck7dtroo8e57b6jql.apps.googleusercontent.com',
    iosClientId: '865106052518-26mpbiv13vgjn77ck7dtroo8e57b6jql.apps.googleusercontent.com',
    webClientId: '865106052518-26mpbiv13vgjn77ck7dtroo8e57b6jql.apps.googleusercontent.com',
    responseType: ResponseType.Token,
    scopes: ['profile', 'email'],
    redirectUri: 'https://auth.expo.io/@piyushbhatti32/fresh-task-manager',
  });

  // Clear any existing authentication state
  React.useEffect(() => {
    const clearAuthState = async () => {
      try {
        await signOut(auth);
        await WebBrowser.maybeCompleteAuthSession();
      } catch (error) {
        console.error('Error clearing auth state:', error);
      }
    };

    clearAuthState();
  }, []);

  React.useEffect(() => {
    if (response?.type === 'success' && response.authentication?.accessToken) {
      const { accessToken } = response.authentication;
      
      // Create a Google credential with the token
      const credential = GoogleAuthProvider.credential(accessToken);
      
      // Sign in with Firebase
      signInWithCredential(auth, credential)
        .then((userCredential) => {
          onSignInSuccess(userCredential);
        })
        .catch((error) => {
          console.error('Firebase Sign-In Error:', error);
          onSignInError(new Error(error.message || 'Sign in failed'));
        });
    } else if (response?.type === 'error') {
      console.error('Google Sign-In Error:', response.error);
      onSignInError(new Error(response.error?.message || 'Sign in failed'));
    }
  }, [response, onSignInSuccess, onSignInError]);

  const handlePress = React.useCallback(async () => {
    try {
      // Clear any existing auth state before starting new sign-in
      await signOut(auth);
      await WebBrowser.maybeCompleteAuthSession();
      
      // Start new sign-in process
      await promptAsync();
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      onSignInError(error instanceof Error ? error : new Error('Sign in failed'));
    }
  }, [promptAsync]);

  return (
    <Button
      mode="contained"
      onPress={handlePress}
      disabled={!request}
      icon="google"
      style={[styles.button, style]}
    >
      Sign in with Google
    </Button>
  );
};

const styles = StyleSheet.create({
  button: {
    marginVertical: 8,
  },
}); 