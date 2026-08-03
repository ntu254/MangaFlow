export function toScheduledAt(date: Date, hour: number, minute: number, now: Date): string | null {
  const scheduledAt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute)
  return scheduledAt.getTime() > now.getTime() ? scheduledAt.toISOString() : null
}
