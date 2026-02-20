import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { requestContactsPermission, getContacts, type DeviceContact } from '@/lib/contacts';
import { createPerson } from '@/lib/person';
import { FrequencyPicker } from '@/components/FrequencyPicker';
import type { ReminderFrequency } from '@/types/database';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function ImportSwipeScreen() {
  const { session } = useAuth();
  const [contacts, setContacts] = useState<DeviceContact[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [frequencyModalVisible, setFrequencyModalVisible] = useState(false);
  const [pendingContact, setPendingContact] = useState<DeviceContact | null>(null);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  useEffect(() => {
    (async () => {
      const ok = await requestContactsPermission();
      if (!ok) {
        setPermissionDenied(true);
        setLoading(false);
        return;
      }
      const list = await getContacts();
      setContacts(list.filter((c) => c.name && c.name !== 'Unknown'));
      setLoading(false);
    })();
  }, []);

  const current = contacts[index];

  const handleAdd = () => {
    if (!current) return;
    setPendingContact(current);
    setFrequencyModalVisible(true);
  };

  const handleFrequencySelect = async (frequency: ReminderFrequency, customDays?: number) => {
    if (!session?.user?.id || !pendingContact) return;
    const { error } = await createPerson(session.user.id, {
      name: pendingContact.name,
      phone: pendingContact.phone,
      email: pendingContact.email,
      reminder_frequency: frequency,
      custom_days: frequency === 'custom_days' ? customDays ?? 30 : null,
    });
    setPendingContact(null);
    setFrequencyModalVisible(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    if (index >= contacts.length - 1) {
      router.back();
    } else {
      setIndex((i) => i + 1);
    }
  };

  const handleSkip = () => {
    if (index >= contacts.length - 1) {
      router.back();
    } else {
      setIndex((i) => i + 1);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.text }]}>
          Contact access was denied. Enable it in Settings to import contacts.
        </Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.tint }]} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!current) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.text }]}>No contacts to show.</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.tint }]} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { borderColor: colors.tabIconDefault }]}>
        {current.imageUri ? (
          <Image source={{ uri: current.imageUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.tabIconDefault }]}>
            <Text style={styles.avatarText}>{current.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <Text style={[styles.name, { color: colors.text }]}>{current.name}</Text>
        {current.phone ? (
          <Text style={[styles.detail, { color: colors.tabIconDefault }]}>{current.phone}</Text>
        ) : null}
        {current.email ? (
          <Text style={[styles.detail, { color: colors.tabIconDefault }]}>{current.email}</Text>
        ) : null}
      </View>
      <Text style={[styles.hint, { color: colors.tabIconDefault }]}>
        {index + 1} of {contacts.length}
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.skipButton, { borderColor: colors.tabIconDefault }]}
          onPress={handleSkip}
        >
          <Text style={[styles.skipButtonText, { color: colors.text }]}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.addButton, { backgroundColor: colors.tint }]}
          onPress={handleAdd}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <FrequencyPicker
        visible={frequencyModalVisible}
        onSelect={handleFrequencySelect}
        onClose={() => {
          setFrequencyModalVisible(false);
          setPendingContact(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detail: {
    fontSize: 14,
  },
  hint: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  skipButton: {
    borderWidth: 1,
  },
  skipButtonText: {},
  addButton: {},
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    padding: 16,
    borderRadius: 12,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
