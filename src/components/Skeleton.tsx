import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface SkeletonProps {
  width: number | string;
  height: number;
  style?: ViewStyle;
  borderRadius?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  width, 
  height, 
  style, 
  borderRadius = 4 
}) => {
  const { isDark } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulseAnimation = Animated.sequence([
      Animated.timing(opacity, {
        toValue: 0.6,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.3,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulseAnimation).start();

    return () => {
      opacity.stopAnimation();
    };
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? '#444' : '#E1E9EE',
          opacity,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
});

export default Skeleton; 