export interface DeadlineMultiplierResult {
  multiplier: number
  isLate: boolean
}

export function calculateDeadlineMultiplier(dueDate: Date, completedAt: Date): DeadlineMultiplierResult {
  const oneDayMs = 24 * 60 * 60 * 1000
  const delta = completedAt.getTime() - dueDate.getTime()

  if (delta <= -oneDayMs) {
    // Completed 1+ day early: 10% bonus
    return { multiplier: 1.1, isLate: false }
  }
  if (delta <= 0) {
    // On time
    return { multiplier: 1, isLate: false }
  }
  if (delta <= oneDayMs) {
    // 0–1 day late: 5% penalty
    return { multiplier: 0.95, isLate: true }
  }
  if (delta <= 3 * oneDayMs) {
    // 1–3 days late: 10% penalty
    return { multiplier: 0.9, isLate: true }
  }
  // >3 days late: 20% penalty
  return { multiplier: 0.8, isLate: true }
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}
