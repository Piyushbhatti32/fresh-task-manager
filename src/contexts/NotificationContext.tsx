import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { 
  Animated, 
  Text, 
  View, 
  StyleSheet, 
  TouchableOpacity,
  Dimensions,
  Platform
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

// Type definitions
type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationAction {
  label: string;
  onPress: () => void;
}

interface NotificationProps {
  message: string;
  title?: string;
  type?: NotificationType;
  duration?: number;
  showClose?: boolean;
  action?: NotificationAction;
}

interface NotificationContextType {
  showNotification: (params: NotificationProps) => void;
  hideNotification: () => void;
}

// Create the context
const NotificationContext = createContext<NotificationContextType>({
  showNotification: () => {},
  hideNotification: () => {},
});

// Custom hook for easy access to notification functions
export const useNotification = () => useContext(NotificationContext);

// Main provider component
export const NotificationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [notification, setNotification] = useState<NotificationProps>({
    message: '',
    type: 'info',
    duration: 3000,
    showClose: true,
  });
  const animationValue = useRef(new Animated.Value(-100)).current;
  const timeout = useRef<NodeJS.Timeout | null>(null);
  
  // Show notification with animation
  const showNotification = (params: NotificationProps) => {
    // Clear any existing timeout
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
    
    // Update notification content
    setNotification({
      ...notification,
      ...params
    });
    
    // Show notification
    setVisible(true);
    
    // Animate in
    Animated.timing(animationValue, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start();
    
    // Auto-hide unless duration is 0
    if (params.duration !== 0) {
      timeout.current = setTimeout(() => {
        hideNotification();
      }, params.duration || 3000);
    }
  };
  
  // Hide notification with animation
  const hideNotification = () => {
    Animated.timing(animationValue, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      setVisible(false);
    });
    
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, []);
  
  // Get the appropriate color for the notification type
  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      case 'info': default: return '#2196F3';
    }
  };
  
  // Get the appropriate icon character for the notification type
  const getNotificationIconChar = (type: NotificationType) => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': default: return 'ℹ';
    }
  };

  // Render the notification component
  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      {visible && (
        <Animated.View 
          style={[
            styles.container,
            { 
              transform: [{ translateY: animationValue }],
              backgroundColor: getNotificationColor(notification.type || 'info'),
              shadowColor: theme.colors.shadow,
            }
          ]}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>
                {getNotificationIconChar(notification.type || 'info')}
              </Text>
            </View>
            
            <View style={styles.textContainer}>
              {notification.title && (
                <Text style={styles.title}>{notification.title}</Text>
              )}
              <Text style={styles.message}>{notification.message}</Text>
              
              {/* Add action button if provided */}
              {notification.action && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => {
                    if (notification.action?.onPress) {
                      notification.action.onPress();
                    }
                    hideNotification();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionButtonText}>
                    {notification.action.label}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {notification.showClose && (
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={hideNotification}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}
    </NotificationContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    right: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  message: {
    color: 'white',
    fontSize: 14,
  },
  closeButton: {
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  actionButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
}); 