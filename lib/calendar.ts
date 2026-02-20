import * as Calendar from 'expo-calendar';

export async function requestCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

export async function addCheckInEvent(personName: string, startDate?: Date): Promise<{ success: boolean; error?: string }> {
  const hasAccess = await requestCalendarPermission();
  if (!hasAccess) {
    return { success: false, error: 'Calendar access denied' };
  }
  const defaultCalendar = await Calendar.getDefaultCalendarAsync();
  if (!defaultCalendar) {
    return { success: false, error: 'No calendar found' };
  }
  const start = startDate ?? new Date();
  start.setHours(19, 0, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 30);
  try {
    await Calendar.createEventAsync(defaultCalendar.id, {
      title: `Check in with ${personName}`,
      startDate: start,
      endDate: end,
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to create event' };
  }
}
