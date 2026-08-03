export function toScheduledAt(date: Date, hour: number, minute: number, now: Date): string | null {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) {
    return null
  }

  const scheduledAt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute)
  return scheduledAt.getTime() > now.getTime() ? scheduledAt.toISOString() : null
}
