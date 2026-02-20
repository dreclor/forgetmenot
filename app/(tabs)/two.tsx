import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/context/AuthContext';
import { usePeople } from '@/hooks/usePeople';
import { getDueStatus } from '@/lib/dueStatus';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import type { Person } from '@/types/database';

function PersonRow({ person, colors }: { person: Person; colors: typeof Colors.light }) {
  const router = useRouter();
  const due = getDueStatus(person.next_reminder_at);

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.background, borderColor: colors.tabIconDefault }]}
      onPress={() => router.push(`/person/${person.id}`)}
    >
      <View style={[styles.rowContent, { backgroundColor: 'transparent' }]}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {person.name}
        </Text>
        <Text
          style={[
            styles.due,
            {
              color:
                due.status === 'overdue'
                  ? '#c00'
                  : due.status === 'due' || due.status === 'due_soon'
                    ? colors.tint
                    : colors.tabIconDefault,
            },
          ]}
        >
          {due.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function PeopleScreen() {
  const { session } = useAuth();
  const { people, loading, error } = usePeople(session?.user?.id);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.text }]}>Failed to load people.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={people}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PersonRow person={item} colors={colors} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
              No people yet. Import from contacts or add manually.
            </Text>
            <Link href="/import/swipe" asChild>
              <TouchableOpacity style={[styles.importButton, { backgroundColor: colors.tint }]}>
                <Text style={styles.importButtonText}>Import from contacts</Text>
              </TouchableOpacity>
            </Link>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  row: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  rowContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  due: {
    fontSize: 14,
    marginLeft: 8,
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 16,
  },
  importButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    fontSize: 16,
  },
});
