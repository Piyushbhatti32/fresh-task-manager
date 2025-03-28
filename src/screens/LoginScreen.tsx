import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Checkbox,
  Surface,
  ActivityIndicator,
  useTheme,
  Divider
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import AnimatedWelcome from '../components/AnimatedWelcome';
import { Storage } from '../utils/storage';
import { auth } from '../config/firebase';
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { ResponseType } from 'expo-auth-session';
import { userService } from '../services/userService';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '865106052518-26mpbiv13vgjn77ck7dtroo8e57b6jql.apps.googleusercontent.com',
    responseType: ResponseType.Token,
    scopes: ['profile', 'email'],
    redirectUri: 'https://auth.expo.io/@piyushbhatti32/fresh-task-manager',
  });

  useEffect(() => {
    checkStoredCredentials();
    
    // Hide welcome animation after 6 seconds
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 6000);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSignInSuccess(response.authentication?.accessToken);
    }
  }, [response]);

  useEffect(() => {
    // Check for existing auth state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // No need to navigate manually - AppNavigator will handle this
      // based on auth.currentUser
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const checkStoredCredentials = async () => {
    try {
      const storedEmail = await Storage.getItem('user_email');
      const storedPassword = await Storage.getItem('user_password');
      
      if (storedEmail && storedPassword) {
        setEmail(storedEmail);
        setPassword(storedPassword);
        setRememberMe(true);
        // Auto login if credentials exist
        handleLogin();
      }
    } catch (error) {
      console.error('Error retrieving stored credentials:', error);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Sign in with Firebase Auth
      await signInWithEmailAndPassword(auth, email, password);
      // Navigation will be handled automatically by AppNavigator
    } catch (error: any) {
      console.error('Login Error:', error);
      let errorMessage = 'Login failed. Please check your credentials and try again.';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email. Please sign up first.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        default:
          errorMessage = 'Login failed. Please try again.';
      }
      
      setError(errorMessage);
      Alert.alert(
        'Login Failed',
        errorMessage,
        [
          {
            text: 'Try Again',
            onPress: () => setPassword('')
          },
          {
            text: 'Forgot Password',
            onPress: () => {
              // TODO: Implement forgot password
              Alert.alert('Coming Soon', 'Password reset functionality will be available soon.');
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignInSuccess = async (accessToken: string | undefined) => {
    if (!accessToken) {
      setError('Failed to get access token');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(null, accessToken);
      
      // Sign-in the user with the credential
      await signInWithCredential(auth, googleCredential);
      // Navigation will be handled automatically by AppNavigator
    } catch (error) {
      console.error('Google Sign In Error:', error);
      setError('Google sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await promptAsync();
      
      if (result?.type !== 'success') {
        setError('Google sign in was cancelled or failed');
      }
    } catch (error) {
      console.error('Google Sign In Error:', error);
      setError('Google sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Sign in anonymously with Firebase Auth
      const userCredential = await signInAnonymously(auth);
      
      // Create a guest user profile
      await userService.createUserProfile(userCredential.user);
      
      // Navigation will be handled automatically by AppNavigator
    } catch (error: any) {
      console.error('Guest Login Error:', error);
      let errorMessage = 'Guest login failed. Please try again.';
      
      switch (error.code) {
        case 'auth/admin-restricted-operation':
          errorMessage = 'Guest login is currently disabled. Please sign in with email or Google.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later.';
          break;
        default:
          errorMessage = 'Unable to continue as guest. Please try another sign-in method.';
      }
      
      setError(errorMessage);
      // Show error in a more user-friendly way
      Alert.alert(
        'Guest Login Failed',
        errorMessage,
        [
          {
            text: 'Try Email Login',
            onPress: () => setIsSignUp(false)
          },
          {
            text: 'Try Google Login',
            onPress: handleGoogleSignIn
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      Alert.alert(
        'Password Mismatch',
        'The passwords you entered do not match. Please try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile
      await userService.createUserProfile(userCredential.user);
      
      // Send verification email
      await sendEmailVerification(userCredential.user);
      
      // Show success message
      Alert.alert(
        'Account Created',
        'A verification email has been sent to your email address. Please verify your email to continue.',
        [
          {
            text: 'OK',
            onPress: () => setIsSignUp(false)
          }
        ]
      );
    } catch (error: any) {
      console.error('Sign Up Error:', error);
      let errorMessage = 'Sign up failed. Please try again.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists. Please log in instead.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled. Please contact support.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Please choose a stronger password (at least 6 characters).';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        default:
          errorMessage = 'Sign up failed. Please try again.';
      }
      
      setError(errorMessage);
      Alert.alert(
        'Sign Up Failed',
        errorMessage,
        [
          {
            text: 'Try Again',
            onPress: () => {
              setPassword('');
              setConfirmPassword('');
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    return email.includes('@') && password.length >= 6;
  };

  if (showWelcome) {
    return <AnimatedWelcome onFinish={() => setShowWelcome(false)} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <Surface style={styles.logoSurface}>
              <Image 
                source={require('../../assets/icon.png')}
                style={styles.logoImage}
              />
            </Surface>
            <Text style={styles.appName}>Task Manager</Text>
          </View>
          <Text style={styles.tagline}>Organize your day, boost your productivity</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            autoCapitalize="none"
            keyboardType="email-address"
            left={<TextInput.Icon icon="email" />}
            style={styles.input}
          />
          
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            right={
              <TextInput.Icon 
                icon={showPassword ? "eye-off" : "eye"} 
                onPress={() => setShowPassword(!showPassword)} 
              />
            }
            left={<TextInput.Icon icon="lock" />}
            style={styles.input}
          />
          
          {isSignUp && (
            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              right={
                <TextInput.Icon 
                  icon={showPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowPassword(!showPassword)} 
                />
              }
              left={<TextInput.Icon icon="lock" />}
              style={styles.input}
            />
          )}
          
          <View style={styles.checkboxContainer}>
            <Checkbox
              status={rememberMe ? 'checked' : 'unchecked'}
              onPress={() => setRememberMe(!rememberMe)}
            />
            <Text style={styles.checkboxLabel}>Remember me</Text>
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
          
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          
          <Button 
            mode="contained" 
            onPress={isSignUp ? handleSignUp : handleLogin}
            disabled={!validateForm() || isLoading}
            loading={isLoading}
            style={styles.loginButton}
          >
            {isSignUp ? 'Sign Up' : 'Log In'}
          </Button>

          <View style={styles.dividerContainer}>
            <Divider style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <Divider style={styles.divider} />
          </View>

          <Button 
            mode="outlined" 
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            icon="google"
            style={styles.googleButton}
          >
            Continue with Google
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={handleGuestLogin}
            style={styles.guestButton}
          >
            Continue as Guest
          </Button>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </Text>
          <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={styles.signupText}>{isSignUp ? 'Log In' : 'Sign Up'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    padding: 32,
    marginTop: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoSurface: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  formContainer: {
    padding: 24,
  },
  input: {
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxLabel: {
    marginLeft: 8,
  },
  forgotPassword: {
    marginLeft: 'auto',
  },
  forgotPasswordText: {
    color: '#007BFF',
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
  loginButton: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  guestButton: {
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  footerText: {
    marginRight: 8,
  },
  signupText: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
  },
  googleButton: {
    marginBottom: 12,
    borderColor: '#4285F4',
  },
}); 