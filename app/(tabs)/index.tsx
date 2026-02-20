import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { usePeople } from '@/hooks/usePeople';
import { getDueStatus } from '@/lib/dueStatus';
import { pickSuggestions } from '@/lib/suggestions';
import { recordOutreach, snoozePerson } from '@/lib/outreach';
import { addCheckInEvent } from '@/lib/calendar';
import type { Person } from '@/types/database';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

function DueCard({
  person,
  colors,
  onAlreadyDid,
  onSnooze,
  onAddToCalendar,
  loading,
}: {
  person: Person;
  colors: typeof Colors.light;
  onAlreadyDid: (p: Person) => void;
  onSnooze: (p: Person) => void;
  onAddToCalendar: (p: Person) => void;
  loading: string | null;
}) {
  const due = getDueStatus(person.next_reminder_at);
  const suggestions = pickSuggestions(person.relationship_hint, 3);
  const isPending = loading === person.id;

  return (
    <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.tabIconDefault }]}>
      <Text style={[styles.cardName, { color: colors.text }]}>{person.name}</Text>
      <Text
        style={[
          styles.cardDue,
          {
            color:
              due.status === 'overdue' ? '#c00' : due.status === 'due' || due.status === 'due_soon' ? colors.tint : colors.tabIconDefault,
          },
        ]}
      >
        {due.label}
      </Text>
      <View style={[styles.suggestions, { backgroundColor: 'transparent' }]}>
        {suggestions.map((s) => (
          <View key={s} style={[styles.chip, { backgroundColor: colors.tabIconDefault + '25' }]}>
            <Text style={[styles.chipText, { color: colors.text }]} numberOfLines={1}>
              {s}
            </Text>
          </View>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.calendarButton, { borderColor: colors.tabIconDefault }]}
        onPress={() => onAddToCalendar(person)}
      >
        <Text style={[styles.calendarButtonText, { color: colors.tint }]}>Add to calendar</Text>
      </TouchableOpacity>
      <View style={[styles.actions, { backgroundColor: 'transparent' }]}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.snoozeBtn, { borderColor: colors.tabIconDefault }]}
          onPress={() => onSnooze(person)}
          disabled={isPending}
        >
          <Text style={[styles.snoozeBtnText, { color: colors.text }]}>Snooze</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.didBtn, { backgroundColor: colors.tint }]}
          onPress={() => onAlreadyDid(person)}
          disabled={isPending}
        >
          <Text style={styles.didBtnText}>I already did</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const { session } = useAuth();
  const { people, loading: peopleLoading } = usePeople(session?.user?.id);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const now = new Date();
  const duePeople = people.filter((p) => {
    const next = new Date(p.next_reminder_at);
    return next <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  });

  const handleAlreadyDid = async (person: Person) => {
    setActionLoading(person.id);
    const { error } = await recordOutreach(person);
    setActionLoading(null);
    if (error) Alert.alert('Error', error.message);
  };

  const handleSnooze = async (person: Person) => {
    setActionLoading(person.id);
    const { error } = await snoozePerson(person);
    setActionLoading(null);
    if (error) Alert.alert('Error', error.message);
  };

  const handleAddToCalendar = async (person: Person) => {
    const { success, error } = await addCheckInEvent(person.name);
    if (!success) Alert.alert('Calendar', error ?? 'Could not add event');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Your people</Text>
      <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
        Add people you want to stay in touch with. We'll remind you when it's time to check in.
      </Text>
      <Link href="/import/swipe" asChild>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.tint }]}>
          <Text style={styles.primaryButtonText}>Import from contacts</Text>
        </TouchableOpacity>
      </Link>

      {peopleLoading ? (
        <ActivityIndicator size="small" color={colors.tint} style={styles.loader} />
      ) : duePeople.length > 0 ? (
        <View style={[styles.section, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Due to check in</Text>
          {duePeople.map((p) => (
            <DueCard
              key={p.id}
              person={p}
              colors={colors}
              onAlreadyDid={handleAlreadyDid}
              onSnooze={handleSnooze}
              onAddToCalendar={handleAddToCalendar}
              loading={actionLoading}
            />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  primaryButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: { marginVertical: 16 },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDue: {
    fontSize: 14,
    marginBottom: 12,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 12,
  },
  calendarButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  snoozeBtn: {
    borderWidth: 1,
  },
  snoozeBtnText: {},
  didBtn: {},
  didBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
