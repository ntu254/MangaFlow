export interface DeadlineMultiplierResult {
  multiplier: number
  isLate: boolean
}

export function calculateDeadlineMultiplier(taskStatus: string, dueDate: Date, completedAt: Date): DeadlineMultiplierResult {
  if (taskStatus === "REJECTED") {
    return { multiplier: 0, isLate: false }
  }

  const oneDayMs = 24 * 60 * 60 * 1000
  const delta = completedAt.getTime() - dueDate.getTime()

  if (delta <= -oneDayMs) {
    return { multiplier: 1.1, isLate: false }
  }
  if (delta <= 0) {
    return { multiplier: 1, isLate: false }
  }
  if (delta <= oneDayMs) {
    return { multiplier: 0.95, isLate: true }
  }
  return { multiplier: 1, isLate: true }
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}
