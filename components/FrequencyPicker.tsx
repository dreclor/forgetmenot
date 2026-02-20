import React from 'react';
import { StyleSheet, TouchableOpacity, Modal, View } from 'react-native';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import type { ReminderFrequency } from '@/types/database';

const OPTIONS: { value: ReminderFrequency; label: string }[] = [
  { value: 'weekly', label: 'Every week' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Every month' },
  { value: 'quarterly', label: 'Every 3 months' },
  { value: 'custom_days', label: 'Custom...' },
];

type Props = {
  visible: boolean;
  onSelect: (frequency: ReminderFrequency, customDays?: number) => void;
  onClose: () => void;
};

export function FrequencyPicker({ visible, onSelect, onClose }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]} onStartShouldSetResponder={() => true}>
          <Text style={[styles.title, { color: colors.text }]}>How often to remind you?</Text>
          {OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.option, { borderColor: colors.tabIconDefault }]}
              onPress={() => {
                if (opt.value === 'custom_days') {
                  onSelect('custom_days', 30);
                } else {
                  onSelect(opt.value);
                }
                onClose();
              }}
            >
              <Text style={[styles.optionText, { color: colors.text }]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  option: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 16,
  },
});
