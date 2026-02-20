export function getDueStatus(nextReminderAt: string): { status: 'overdue' | 'due_soon' | 'due' | 'upcoming'; label: string; days: number } {
  const next = new Date(nextReminderAt);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  next.setHours(0, 0, 0, 0);
  const days = Math.ceil((next.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

  if (days < 0) {
    return { status: 'overdue', label: `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`, days };
  }
  if (days === 0) {
    return { status: 'due', label: 'Due today', days: 0 };
  }
  if (days <= 7) {
    return { status: 'due_soon', label: `Due in ${days} day${days === 1 ? '' : 's'}`, days };
  }
  return { status: 'upcoming', label: `Due in ${days} days`, days };
}
