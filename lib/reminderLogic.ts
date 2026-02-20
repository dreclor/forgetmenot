import type { ReminderFrequency } from '@/types/database';

const INTERVAL_DAYS: Record<ReminderFrequency, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  quarterly: 90,
  custom_days: 0, // use custom_days param
};

export function getIntervalDays(frequency: ReminderFrequency, customDays: number | null): number {
  if (frequency === 'custom_days' && customDays != null) {
    return customDays;
  }
  return INTERVAL_DAYS[frequency] ?? 30;
}

export function getNextReminderAt(
  lastContactedAt: Date | null,
  frequency: ReminderFrequency,
  customDays: number | null
): Date {
  const base = lastContactedAt ?? new Date();
  const days = getIntervalDays(frequency, customDays);
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

export function getSnoozeDays(frequency: ReminderFrequency, customDays: number | null): number {
  const interval = getIntervalDays(frequency, customDays);
  if (interval <= 7) return 1;
  if (interval <= 14) return 2;
  if (interval <= 30) return 7;
  return Math.min(21, Math.max(1, Math.floor(interval / 7)));
}

export function getSnoozedNextReminderAt(
  currentNextReminderAt: string,
  frequency: ReminderFrequency,
  customDays: number | null
): Date {
  const current = new Date(currentNextReminderAt);
  const days = getSnoozeDays(frequency, customDays);
  const next = new Date(current);
  next.setDate(next.getDate() + days);
  return next;
}
