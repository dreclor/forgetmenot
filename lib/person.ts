import { supabase } from '@/lib/supabase';
import { getNextReminderAt } from '@/lib/reminderLogic';
import type { Person } from '@/types/database';
import type { ReminderFrequency } from '@/types/database';

export async function createPerson(
  userId: string,
  data: {
    name: string;
    photo_url?: string | null;
    phone?: string | null;
    email?: string | null;
    reminder_frequency: ReminderFrequency;
    custom_days?: number | null;
    relationship_hint?: string | null;
  }
): Promise<{ data: Person | null; error: Error | null }> {
  const next = getNextReminderAt(null, data.reminder_frequency, data.custom_days ?? null);
  const { data: row, error } = await supabase
    .from('person')
    .insert({
      user_id: userId,
      name: data.name,
      photo_url: data.photo_url ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      reminder_frequency: data.reminder_frequency,
      custom_days: data.custom_days ?? null,
      next_reminder_at: next.toISOString(),
      relationship_hint: data.relationship_hint ?? null,
    })
    .select()
    .single();
  return { data: row as Person, error: error ?? null };
}

export async function updatePerson(
  id: string,
  data: Partial<{
    name: string;
    photo_url: string | null;
    phone: string | null;
    email: string | null;
    reminder_frequency: ReminderFrequency;
    custom_days: number | null;
    next_reminder_at: string;
    relationship_hint: string | null;
  }>
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('person').update(data).eq('id', id);
  return { error: error ?? null };
}

export async function deletePerson(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('person').delete().eq('id', id);
  return { error: error ?? null };
}
