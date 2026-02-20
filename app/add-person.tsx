import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { createPerson } from '@/lib/person';
import { FrequencyPicker } from '@/components/FrequencyPicker';
import type { ReminderFrequency } from '@/types/database';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function AddPersonScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [frequency, setFrequency] = useState<ReminderFrequency>('monthly');
  const [customDays, setCustomDays] = useState<number | null>(null);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const frequencyLabel =
    frequency === 'custom_days'
      ? `Every ${customDays ?? 30} days`
      : frequency === 'weekly'
        ? 'Every week'
        : frequency === 'biweekly'
          ? 'Every 2 weeks'
          : frequency === 'monthly'
            ? 'Every month'
            : 'Every 3 months';

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    if (!session?.user?.id) return;
    setSaving(true);
    const { data, error } = await createPerson(session.user.id, {
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      reminder_frequency: frequency,
      custom_days: frequency === 'custom_days' ? customDays ?? 30 : null,
    });
    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    router.back();
    if (data) router.push(`/person/${data.id}`);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.label, { color: colors.text }]}>Name *</Text>
      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.tabIconDefault }]}
        placeholder="Name"
        placeholderTextColor={colors.tabIconDefault}
        value={name}
        onChangeText={setName}
      />
      <Text style={[styles.label, { color: colors.text }]}>Phone</Text>
      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.tabIconDefault }]}
        placeholder="Phone"
        placeholderTextColor={colors.tabIconDefault}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <Text style={[styles.label, { color: colors.text }]}>Email</Text>
      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.tabIconDefault }]}
        placeholder="Email"
        placeholderTextColor={colors.tabIconDefault}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Text style={[styles.label, { color: colors.text }]}>Remind me</Text>
      <TouchableOpacity
        style={[styles.frequencyButton, { borderColor: colors.tabIconDefault }]}
        onPress={() => setShowFrequencyPicker(true)}
      >
        <Text style={[styles.frequencyButtonText, { color: colors.text }]}>{frequencyLabel}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.tint }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Add person</Text>
        )}
      </TouchableOpacity>
      <FrequencyPicker
        visible={showFrequencyPicker}
        onSelect={(f, days) => {
          setFrequency(f);
          if (days != null) setCustomDays(days);
          setShowFrequencyPicker(false);
        }}
        onClose={() => setShowFrequencyPicker(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  frequencyButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  frequencyButtonText: {
    fontSize: 16,
  },
  saveButton: {
    marginTop: 32,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
