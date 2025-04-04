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
import { 
  GoogleAuthProvider, 
  signInWithCredential, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signInAnonymously,
  User as FirebaseUser
} from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import { userService } from '../services/userService';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { UserProfile, UserProfileUpdate } from '../types/user';
import { UserCredential } from '../types/auth';
import Constants from 'expo-constants';

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
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [userName, setUserName] = useState<string | undefined>(undefined);

  useEffect(() => {
    checkStoredCredentials();
    
    // Hide welcome animation after 6 seconds
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 6000);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Check for existing auth state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.displayName) {
        setUserName(user.displayName);
      }
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

  const handleGoogleSignInSuccess = async (userCredential: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Firebase Sign-In Success:', userCredential.user.uid);
      
      // Set user name if available
      if (userCredential.user.displayName) {
        setUserName(userCredential.user.displayName);
      }
      
      // Check if this is a new user
      const isNewUser = userCredential.additionalUserInfo?.isNewUser || false;
      
      if (isNewUser) {
        // Create a new user profile for new users
        const userProfile: UserProfile = {
          uid: userCredential.user.uid,
          email: userCredential.user.email || 'anonymous@example.com',
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
          emailVerified: userCredential.user.emailVerified,
          isAnonymous: userCredential.user.isAnonymous,
          createdAt: new Date(),
          lastLogin: new Date(),
          settings: {
            theme: 'system' as const,
            notifications: true,
            language: 'en'
          }
        };
        
        await userService.createUserProfile(userProfile);
        console.log('New user profile created');
      } else {
        // Update last login for existing users
        await userService.updateUserProfile(userCredential.user.uid, {
          lastLogin: new Date()
        });
        console.log('Existing user profile updated');
      }
      
      // Navigation will be handled automatically by AppNavigator
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      setError('Google sign-in failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignInError = (error: Error) => {
    console.error('Google Sign-In Error:', error);
    setError(error.message || 'Google sign-in failed. Please try again.');
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;
      
      const userProfile: UserProfile = {
        uid: user.uid,
        email: `guest_${user.uid}@example.com`,
        displayName: 'Guest User',
        photoURL: null,
        emailVerified: false,
        isAnonymous: true,
        createdAt: new Date(),
        lastLogin: new Date(),
        settings: {
          theme: 'system' as const,
          notifications: true,
          language: 'en'
        }
      };
      
      await userService.createUserProfile(userProfile);
      
      // Navigation will be handled automatically by AppNavigator
    } catch (error: any) {
      console.error('Guest login error:', error);
      setError('Failed to sign in as guest. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile
      const userProfile: UserProfile = {
        uid: userCredential.user.uid,
        email: userCredential.user.email || 'anonymous@example.com',
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
        emailVerified: userCredential.user.emailVerified,
        isAnonymous: userCredential.user.isAnonymous,
        createdAt: new Date(),
        lastLogin: new Date(),
        settings: {
          theme: 'system' as const,
          notifications: true,
          language: 'en'
        }
      };
      
      await userService.createUserProfile(userProfile);
      
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

  const handleWelcomeFinish = () => {
    // Optional: Add any logic to execute after welcome animation
    console.log('Welcome animation finished');
  };

  if (showWelcome) {
    return <AnimatedWelcome onFinish={handleWelcomeFinish} />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <Surface style={[styles.logoSurface, { backgroundColor: 'transparent' }]}>
              <Image 
                source={require('../../assets/icon.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Surface>
            <Text style={[styles.appName, { color: theme.colors.onBackground }]}>
              Task Manager
            </Text>
            <Text style={[styles.tagline, { color: theme.colors.onBackground }]}>
              Organize your tasks efficiently
            </Text>
          </View>
        </View>
        
        <Surface style={[styles.formContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.title, { color: theme.colors.primary }]}>
            {isForgotPassword ? 'Reset Password' : (isSignUp ? 'Create Account' : 'Welcome')}
          </Text>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {error}
              </Text>
            </View>
          )}
          
          {!isForgotPassword && !isSignUp && (
            <View style={styles.socialButtonsContainer}>
              <GoogleSignInButton
                onSignInSuccess={handleGoogleSignInSuccess}
                onSignInError={handleGoogleSignInError}
                style={styles.googleButton}
              />
              
              <Button 
                mode="outlined" 
                onPress={handleGuestLogin}
                disabled={isLoading}
                icon="account"
                style={styles.guestButton}
              >
                Continue as Guest
              </Button>
            </View>
          )}
          
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
          
          <Button 
            mode="contained" 
            onPress={isSignUp ? handleSignUp : handleLogin}
            disabled={!validateForm() || isLoading}
            loading={isLoading}
            style={styles.loginButton}
          >
            {isSignUp ? 'Sign Up' : 'Log In'}
          </Button>
          
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.onBackground }]}>
              By logging in, you agree to our{' '}
              <Text 
                style={[styles.footerLink, { color: theme.colors.primary }]}
                onPress={() => {
                  // TODO: Navigate to Terms of Service
                  Alert.alert('Coming Soon', 'Terms of Service will be available soon.');
                }}
              >
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text 
                style={[styles.footerLink, { color: theme.colors.primary }]}
                onPress={() => {
                  // TODO: Navigate to Privacy Policy
                  Alert.alert('Coming Soon', 'Privacy Policy will be available soon.');
                }}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </View>
        </Surface>
        
        <View style={styles.spacer} />
        
        <View style={styles.creatorContainer}>
          <Text style={[styles.creatorText, { color: theme.colors.onBackground }]}>
            Created with ❤️ by Piyush
          </Text>
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
  },
  headerContainer: {
    alignItems: 'center',
    padding: 24,
    marginTop: 20,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
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
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: 10,
    borderRadius: 5,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    textAlign: 'center',
  },
  loginButton: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  guestButton: {
    marginBottom: 10,
  },
  footer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
  footerLink: {
    textDecorationLine: 'underline',
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
    marginBottom: 10,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  socialButtonsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  spacer: {
    minHeight: 20,
  },
  creatorContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  creatorText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
}); 