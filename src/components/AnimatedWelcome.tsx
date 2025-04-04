import React, { useRef, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Easing, 
  TouchableOpacity,
  Pressable,
  Dimensions
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';

export interface AnimatedWelcomeProps {
  userName?: string;
  onFinish?: () => void;
}

const AnimatedWelcome: React.FC<AnimatedWelcomeProps> = ({ userName = 'there', onFinish }) => {
  const { theme } = useTheme();
  const [isDismissing, setIsDismissing] = useState(false);
  const [pressedIcon, setPressedIcon] = useState<string | null>(null);
  
  // Animation values
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const fadeOutAnim = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Make sure animations start from a consistent position
    slideUpAnim.setValue(0); // Start from center, not below
    titleOpacity.setValue(0);
    subtitleOpacity.setValue(0);
    iconOpacity.setValue(0);
    bounceAnim.setValue(0);
    fadeOutAnim.setValue(1);
    buttonScale.setValue(1);
    buttonOpacity.setValue(0);

    // Sequential animations
    Animated.sequence([
      // Slide up from bottom (now it's already centered)
      Animated.spring(slideUpAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      
      // Title fade in
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      
      // Subtitle fade in
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      
      // Icons fade in
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),

      // Button fade in
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start(() => {
      if (onFinish) {
        onFinish();
      }
    });
    
    // Continuous bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.in(Easing.sin),
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);
  
  // Interpolate bounce animation
  const translateY = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  // Handle dismiss animation
  const handleDismiss = () => {
    setIsDismissing(true);
    Animated.sequence([
      Animated.timing(fadeOutAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start(() => {
      if (onFinish) {
        onFinish();
      }
    });
  };

  // Handle icon press animation
  const handleIconPress = (icon: string) => {
    setPressedIcon(icon);
    setTimeout(() => setPressedIcon(null), 200);
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity: fadeOutAnim,
          transform: [{ translateY: slideUpAnim }]
        }
      ]}
    >
      <LinearGradient
        colors={[theme.colors.primary + '20', theme.colors.background]}
        style={styles.gradient}
      />
      
      <Animated.Text 
        style={[
          styles.welcomeText, 
          { color: theme.colors.text, opacity: titleOpacity }
        ]}
      >
        Hi {userName}!
      </Animated.Text>
      
      <Animated.Text 
        style={[
          styles.subtitle, 
          { color: theme.colors.text, opacity: subtitleOpacity }
        ]}
      >
        Welcome to your Task Manager
      </Animated.Text>
      
      <View style={styles.iconContainer}>
        <Pressable
          onPress={() => handleIconPress('sparkle')}
          style={({ pressed }) => [
            styles.iconPressable,
            pressed && styles.iconPressed
          ]}
        >
          <Animated.View
            style={[
              styles.iconWrapper,
              { 
                backgroundColor: theme.colors.primary + '20',
                borderColor: theme.colors.primary + '50',
                opacity: iconOpacity,
                transform: [
                  { translateY },
                  { scale: pressedIcon === 'sparkle' ? 1.2 : 1 }
                ]
              }
            ]}
          >
            <Text style={styles.icon}>✨</Text>
          </Animated.View>
        </Pressable>
        
        <Pressable
          onPress={() => handleIconPress('list')}
          style={({ pressed }) => [
            styles.iconPressable,
            pressed && styles.iconPressed
          ]}
        >
          <Animated.View
            style={[
              styles.iconWrapper,
              { 
                backgroundColor: theme.colors.success + '20',
                borderColor: theme.colors.success + '50',
                opacity: iconOpacity,
                transform: [
                  { translateY: Animated.add(translateY, new Animated.Value(8)) },
                  { scale: pressedIcon === 'list' ? 1.2 : 1 }
                ]
              }
            ]}
          >
            <Text style={styles.icon}>📋</Text>
          </Animated.View>
        </Pressable>
        
        <Pressable
          onPress={() => handleIconPress('timer')}
          style={({ pressed }) => [
            styles.iconPressable,
            pressed && styles.iconPressed
          ]}
        >
          <Animated.View
            style={[
              styles.iconWrapper,
              { 
                backgroundColor: theme.colors.warning + '20',
                borderColor: theme.colors.warning + '50',
                opacity: iconOpacity,
                transform: [
                  { translateY: Animated.multiply(translateY, new Animated.Value(-1)) },
                  { scale: pressedIcon === 'timer' ? 1.2 : 1 }
                ]
              }
            ]}
          >
            <Text style={styles.icon}>⏰</Text>
          </Animated.View>
        </Pressable>
      </View>

      <Animated.View style={{ opacity: buttonOpacity }}>
        <TouchableOpacity
          onPress={handleDismiss}
          activeOpacity={0.8}
          style={styles.buttonContainer}
        >
          <Animated.View
            style={[
              styles.button,
              { backgroundColor: theme.colors.primary },
              { transform: [{ scale: buttonScale }] }
            ]}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
    height: '100%',
    zIndex: 1000, // Increased to ensure it appears above all other elements
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: -1,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    marginBottom: 24,
    opacity: 0.8,
    textAlign: 'center',
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 100,
    marginBottom: 32,
  },
  iconPressable: {
    marginHorizontal: 12,
  },
  iconPressed: {
    opacity: 0.7,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  icon: {
    fontSize: 28,
  },
  buttonContainer: {
    marginTop: 16,
  },
  button: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});

export default AnimatedWelcome; 