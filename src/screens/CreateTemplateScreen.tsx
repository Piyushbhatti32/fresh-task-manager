import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import TemplateForm from '../components/TemplateForm';
import { useTheme } from '../theme/ThemeProvider';

export default function CreateTemplateScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  
  const handleClose = () => {
    navigation.goBack();
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TemplateForm
        isVisible={true}
        onClose={handleClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 