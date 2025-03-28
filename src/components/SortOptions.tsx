import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export type SortOption = {
  id: string;
  label: string;
  value: string;
};

export type SortDirection = 'asc' | 'desc';

interface SortOptionsProps {
  visible: boolean;
  onClose: () => void;
  options: SortOption[];
  selectedOption: string;
  direction: SortDirection;
  onSelectOption: (option: string) => void;
  onToggleDirection: () => void;
}

export default function SortOptions({
  visible,
  onClose,
  options,
  selectedOption,
  direction,
  onSelectOption,
  onToggleDirection,
}: SortOptionsProps) {
  const { theme, isDark } = useTheme();

  const renderDirectionIcon = (isAsc: boolean) => {
    return (
      <View style={styles.directionIconContainer}>
        <View
          style={[
            styles.arrow,
            isAsc ? styles.arrowUp : styles.arrowDown,
            { borderBottomColor: theme.colors.text },
          ]}
        />
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.modalOverlay,
          { backgroundColor: 'rgba(0,0,0,0.5)' },
        ]}
      >
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline || theme.colors.text + '40',
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.headerText, { color: theme.colors.text }]}>
              Sort Tasks
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.closeButton, { color: theme.colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <View
            style={[styles.directionToggle, { borderColor: theme.colors.outline || theme.colors.text + '40' }]}
          >
            <Text style={[styles.directionText, { color: theme.colors.text }]}>
              Sort Direction:
            </Text>
            <TouchableOpacity
              style={[
                styles.directionButton,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
              onPress={onToggleDirection}
            >
              <Text style={[styles.directionButtonText, { color: theme.colors.text }]}>
                {direction === 'asc' ? 'Ascending' : 'Descending'}
              </Text>
              {renderDirectionIcon(direction === 'asc')}
            </TouchableOpacity>
          </View>

          <FlatList
            data={options}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  selectedOption === item.value && [
                    styles.selectedOption,
                    { backgroundColor: theme.colors.primaryContainer },
                  ],
                ]}
                onPress={() => onSelectOption(item.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: theme.colors.text },
                    selectedOption === item.value && { color: theme.colors.primary },
                  ]}
                >
                  {item.label}
                </Text>
                {selectedOption === item.value && (
                  <View
                    style={[
                      styles.checkmark,
                      { borderColor: theme.colors.primary },
                    ]}
                  >
                    <View
                      style={[
                        styles.checkmarkInner,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    />
                  </View>
                )}
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity
            style={[
              styles.applyButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={onClose}
          >
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    maxHeight: '60%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  directionToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    marginBottom: 15,
    borderBottomWidth: 1,
  },
  directionText: {
    fontSize: 16,
  },
  directionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  directionButtonText: {
    fontSize: 16,
    marginRight: 8,
  },
  directionIconContainer: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderLeftColor: 'transparent',
    borderRightWidth: 5,
    borderRightColor: 'transparent',
    borderBottomWidth: 8,
  },
  arrowUp: {
    transform: [{ rotate: '0deg' }],
  },
  arrowDown: {
    transform: [{ rotate: '180deg' }],
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedOption: {
    borderRadius: 8,
  },
  optionText: {
    fontSize: 16,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  applyButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 