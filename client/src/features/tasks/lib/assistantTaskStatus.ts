import type { Task } from "@/entities";

export type ColumnKey = "assigned" | "in-progress" | "submitted" | "rejected" | "approved";

export const COLUMN_META: Record<ColumnKey, { label: string; hint: string; order: number }> = {
  assigned: { label: "Todo", hint: "New tasks waiting to start", order: 0 },
  "in-progress": { label: "In progress", hint: "Currently being worked on", order: 1 },
  submitted: { label: "Waiting review", hint: "Submitted, awaiting Mangaka/Editor", order: 2 },
  rejected: { label: "Needs revision", hint: "Sent back for changes", order: 3 },
  approved: { label: "Approved", hint: "Editor approved", order: 4 },
};

export const DEFAULT_COLUMNS: ColumnKey[] = ["assigned", "in-progress", "submitted", "rejected"];

export function statusLabel(status: Task["status"]) {
  return COLUMN_META[status as ColumnKey]?.label ?? status;
}

export function statusHint(status: Task["status"]): string | null {
  switch (status) {
    case "rejected":
      return "Revision requested — open in Task Studio to address feedback.";
    case "submitted":
      return "Waiting for Mangaka review.";
    case "approved":
      return "Editor approved.";
    default:
      return null;
  }
}
