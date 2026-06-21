import type { Task } from "@/entities";

export type ColumnKey =
  | "todo"
  | "in-progress"
  | "submitted"
  | "revision-requested"
  | "editor-approved";

export const COLUMN_META: Record<ColumnKey, { label: string; hint: string; order: number }> = {
  todo: { label: "Todo", hint: "New tasks waiting to start", order: 0 },
  "in-progress": { label: "In progress", hint: "Currently being worked on", order: 1 },
  submitted: { label: "Waiting review", hint: "Submitted, awaiting Mangaka/Editor", order: 2 },
  "revision-requested": { label: "Needs revision", hint: "Sent back for changes", order: 3 },
  "editor-approved": { label: "Approved", hint: "Editor approved", order: 4 },
};

export const DEFAULT_COLUMNS: ColumnKey[] = [
  "todo",
  "in-progress",
  "submitted",
  "revision-requested",
];

export function statusLabel(status: Task["status"]) {
  return COLUMN_META[status as ColumnKey]?.label ?? status;
}

export function statusHint(status: Task["status"]): string | null {
  switch (status) {
    case "revision-requested":
      return "Revision requested — open in Task Studio to address feedback.";
    case "submitted":
      return "Waiting for Mangaka review.";
    case "editor-approved":
      return "Editor approved.";
    default:
      return null;
  }
}
