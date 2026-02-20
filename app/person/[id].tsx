import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getDueStatus } from '@/lib/dueStatus';
import { recordOutreach } from '@/lib/outreach';
import { pickSuggestions } from '@/lib/suggestions';
import { addCheckInEvent } from '@/lib/calendar';
import type { Person } from '@/types/database';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [reachingOut, setReachingOut] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [makingDue, setMakingDue] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const refresh = async () => {
    if (!id) return;
    const { data, error } = await supabase.from('person').select('*').eq('id', id).single();
    if (!error) setPerson(data as Person);
  };

  useEffect(() => {
    if (!id) return;
    refresh().finally(() => setLoading(false));
  }, [id]);

  const handleReachedOut = async () => {
    if (!person) return;
    setReachingOut(true);
    const { error } = await recordOutreach(person);
    setReachingOut(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    await refresh();
  };

  const handleAddToCalendar = async () => {
    if (!person) return;
    setCalendarError(null);
    const { success, error } = await addCheckInEvent(person.name);
    if (!success) setCalendarError(error ?? 'Could not add event');
  };

  const handleMakeDueNow = async () => {
    if (!person) return;
    setMakingDue(true);
    const past = new Date();
    past.setHours(past.getHours() - 1);
    const { error } = await supabase
      .from('person')
      .update({ next_reminder_at: past.toISOString() })
      .eq('id', person.id);
    setMakingDue(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    await refresh();
    Alert.alert(
      'Set to due',
      'This person is now due. Run the "Daily reminders" workflow in GitHub Actions (Actions tab → Run workflow), or wait for the scheduled run. You should get a push notification if your device has registered for push.'
    );
  };

  if (loading || !person) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.tint} />
        ) : (
          <Text style={{ color: colors.text }}>Not found</Text>
        )}
      </View>
    );
  }

  const due = getDueStatus(person.next_reminder_at);
  const suggestions = pickSuggestions(person.relationship_hint, 3);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.name, { color: colors.text }]}>{person.name}</Text>
      {person.phone ? (
        <Text style={[styles.detail, { color: colors.tabIconDefault }]}>{person.phone}</Text>
      ) : null}
      {person.email ? (
        <Text style={[styles.detail, { color: colors.tabIconDefault }]}>{person.email}</Text>
      ) : null}
      <View style={[styles.statusBadge, { backgroundColor: colors.tabIconDefault + '20' }]}>
        <Text style={[styles.statusText, { color: colors.tint }]}>{due.label}</Text>
      </View>
      {suggestions.length > 0 && (
        <View style={[styles.suggestions, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.suggestionsTitle, { color: colors.text }]}>Ideas to reach out</Text>
          {suggestions.map((s) => (
            <View key={s} style={[styles.chip, { backgroundColor: colors.tabIconDefault + '25' }]}>
              <Text style={[styles.chipText, { color: colors.text }]}>{s}</Text>
            </View>
          ))}
        </View>
      )}
      <TouchableOpacity
        style={[styles.calendarButton, { borderColor: colors.tabIconDefault }]}
        onPress={handleAddToCalendar}
      >
        <Text style={[styles.calendarButtonText, { color: colors.tint }]}>Add to calendar</Text>
      </TouchableOpacity>
      {calendarError ? (
        <Text style={[styles.errorText, { color: '#c00' }]}>{calendarError}</Text>
      ) : null}
      <TouchableOpacity
        style={[styles.reachedOutButton, { backgroundColor: colors.tint }]}
        onPress={handleReachedOut}
        disabled={reachingOut}
      >
        {reachingOut ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.reachedOutButtonText}>I reached out</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.testButton, { borderColor: colors.tabIconDefault }]}
        onPress={handleMakeDueNow}
        disabled={makingDue}
      >
        <Text style={[styles.testButtonText, { color: colors.tabIconDefault }]}>
          {makingDue ? '...' : 'Make due now (test)'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detail: {
    fontSize: 16,
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  suggestions: {
    marginTop: 24,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 14,
  },
  calendarButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  calendarButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    marginTop: 8,
  },
  reachedOutButton: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  reachedOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    marginTop: 24,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 14,
  },
});
