export function toScheduledAt(date: Date, hour: number, minute: number, now: Date): string | null {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) {
    return null
  }

  const scheduledAt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute)
  return scheduledAt.getTime() > now.getTime() ? scheduledAt.toISOString() : null
}

export function formatSelectedSchedule(date: Date, hour: number, minute: number): string {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute)
  const dateLabel = day.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
  return `${dateLabel} · ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

export function monthCalendarDates(month: Date): Array<Date | null> {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const leadingDays = new Date(year, monthIndex, 1).getDay()
  const dayCount = new Date(year, monthIndex + 1, 0).getDate()
  return [
    ...Array.from({ length: leadingDays }, () => null),
    ...Array.from({ length: dayCount }, (_, index) => new Date(year, monthIndex, index + 1)),
  ]
}
