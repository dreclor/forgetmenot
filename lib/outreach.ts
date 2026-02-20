import { supabase } from '@/lib/supabase';
import { updatePerson } from '@/lib/person';
import { getNextReminderAt, getSnoozedNextReminderAt } from '@/lib/reminderLogic';
import type { Person } from '@/types/database';

export async function recordOutreach(
  person: Person,
  contactedAt: Date = new Date(),
  note?: string | null
): Promise<{ error: Error | null }> {
  const { error: insertError } = await supabase.from('outreach').insert({
    person_id: person.id,
    contacted_at: contactedAt.toISOString(),
    note: note ?? null,
  });
  if (insertError) return { error: insertError };

  const next = getNextReminderAt(
    contactedAt,
    person.reminder_frequency,
    person.custom_days
  );
  return updatePerson(person.id, { next_reminder_at: next.toISOString() });
}

export async function snoozePerson(person: Person): Promise<{ error: Error | null }> {
  const next = getSnoozedNextReminderAt(
    person.next_reminder_at,
    person.reminder_frequency,
    person.custom_days
  );
  return updatePerson(person.id, { next_reminder_at: next.toISOString() });
}
