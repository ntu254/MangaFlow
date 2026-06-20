export type DeadlineTone = "overdue" | "soon" | "normal";

// Mock data uses strings like "Jun 19" without a year. For demo purposes we
// treat the deadline as belonging to the current year and derive a tone
// relative to "today". If parsing fails, fall back to "normal".
export function parseDeadline(input: string): Date | null {
  if (!input) return null;
  const year = new Date().getFullYear();
  const parsed = new Date(`${input}, ${year}`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function deadlineTone(input: string, now: Date = new Date()): DeadlineTone {
  const d = parseDeadline(input);
  if (!d) return "normal";
  const diffDays = Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays <= 2) return "soon";
  return "normal";
}

export function deadlineClass(tone: DeadlineTone): string {
  switch (tone) {
    case "overdue":
      return "text-destructive font-medium";
    case "soon":
      return "text-foreground font-medium";
    default:
      return "text-foreground/60";
  }
}

export function deadlineLabel(input: string, tone: DeadlineTone): string {
  if (tone === "overdue") return `Overdue · ${input}`;
  if (tone === "soon") return `Due ${input}`;
  return `Due ${input}`;
}
