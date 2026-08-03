// Low-level formatting shared by any screen that shows a backend timestamp.
// Presentation *models* stay role-specific; only this primitive is shared.
export function formatWorkflowTimestamp(value: string | null): string {
  if (!value) return "Unknown time"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}
