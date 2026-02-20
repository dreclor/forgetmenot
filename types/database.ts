export type ReminderFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'custom_days';
export type RelationshipHint = 'family' | 'friend' | 'coworker' | 'other';

export interface Person {
  id: string;
  user_id: string;
  name: string;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
  reminder_frequency: ReminderFrequency;
  custom_days: number | null;
  next_reminder_at: string;
  relationship_hint: RelationshipHint | null;
  created_at: string;
  updated_at: string;
}

export interface Outreach {
  id: string;
  person_id: string;
  contacted_at: string;
  note: string | null;
  created_at: string;
}
