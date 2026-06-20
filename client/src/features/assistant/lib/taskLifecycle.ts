import type { Task, TaskStatus } from "@/entities";

/**
 * Canonical Assistant lifecycle keys (what the worker actually sees).
 * Maps from legacy seed values ("assigned" → "todo", "approved" → "editor-approved").
 */
export type AssistantStatus =
  | "todo"
  | "in-progress"
  | "submitted"
  | "revision-requested"
  | "mangaka-approved"
  | "editor-approved"
  | "rejected"
  | "cancelled";

export function normalizeStatus(status: TaskStatus): AssistantStatus {
  if (status === "assigned") return "todo";
  if (status === "approved") return "editor-approved";
  return status;
}

export const LIFECYCLE_META: Record<
  AssistantStatus,
  { label: string; hint: string; order: number }
> = {
  todo: { label: "To do", hint: "Not started yet", order: 0 },
  "in-progress": { label: "In progress", hint: "You're working on it", order: 1 },
  submitted: { label: "Waiting review", hint: "Awaiting Mangaka", order: 2 },
  "revision-requested": {
    label: "Revision requested",
    hint: "Needs changes",
    order: 3,
  },
  "mangaka-approved": {
    label: "Mangaka approved",
    hint: "Awaiting Editor final review",
    order: 4,
  },
  "editor-approved": { label: "Completed", hint: "Editor approved", order: 5 },
  rejected: { label: "Rejected", hint: "Task rejected", order: 6 },
  cancelled: { label: "Cancelled", hint: "No longer needed", order: 7 },
};

export const KANBAN_COLUMNS: AssistantStatus[] = [
  "todo",
  "in-progress",
  "submitted",
  "revision-requested",
];

export type CtaIntent = "primary" | "destructive" | "neutral" | "disabled";

export function ctaFor(status: TaskStatus): { label: string; intent: CtaIntent } {
  const s = normalizeStatus(status);
  switch (s) {
    case "todo":
      return { label: "Start Task", intent: "primary" };
    case "in-progress":
      return { label: "Open Task Studio", intent: "primary" };
    case "submitted":
      return { label: "View Submission", intent: "neutral" };
    case "revision-requested":
      return { label: "Fix Now", intent: "destructive" };
    case "mangaka-approved":
      return { label: "Awaiting Editor", intent: "disabled" };
    case "editor-approved":
      return { label: "View Completed", intent: "neutral" };
    case "rejected":
      return { label: "View Reason", intent: "neutral" };
    case "cancelled":
      return { label: "Cancelled", intent: "disabled" };
  }
}

export function isOpenTask(task: Task) {
  const s = normalizeStatus(task.status);
  return s !== "editor-approved" && s !== "rejected" && s !== "cancelled";
}
