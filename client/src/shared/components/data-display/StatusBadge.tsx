import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
  size?: "sm" | "md";
};

const statusStyles: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: "#f1edf7", text: "#6d5d7c" },
  IN_PROGRESS: { bg: "#ece5ff", text: "#9065d5" },
  SUBMITTED: { bg: "#ffe6f2", text: "#e560bc" },
  EDITOR_REVIEW: { bg: "#fff0dc", text: "#d97706" },
  BOARD_REVIEW: { bg: "#fff0dc", text: "#d97706" },
  REVIEW: { bg: "#fff0dc", text: "#d97706" },
  APPROVED: { bg: "#f4ffd2", text: "#7a8f00" },
  MANGAKA_APPROVED: { bg: "#f4ffd2", text: "#7a8f00" },
  EDITOR_APPROVED: { bg: "#f4ffd2", text: "#7a8f00" },
  REVISION: { bg: "#ffe7de", text: "#e15f2f" },
  REVISION_REQUESTED: { bg: "#ffe7de", text: "#e15f2f" },
  REJECTED: { bg: "#ffe1e8", text: "#e11d48" },
  AT_RISK: { bg: "#fff0c2", text: "#b45309" },
  WARNING: { bg: "#fff0c2", text: "#b45309" },
  PUBLISHED: { bg: "#f9f871", text: "#5f6500" },
  NORMAL: { bg: "#f4ffd2", text: "#7a8f00" },
  TASK_ASSIGNED: { bg: "#ece5ff", text: "#9065d5" },
  TASK_SUBMITTED: { bg: "#ffe6f2", text: "#e560bc" },
  TASK_APPROVED: { bg: "#f4ffd2", text: "#7a8f00" },
  OPEN: { bg: "#fff0dc", text: "#d97706" },
  FIXED_BY_ASSISTANT: { bg: "#ffe6f2", text: "#e560bc" },
  VERIFIED_BY_MANGAKA: { bg: "#ece5ff", text: "#9065d5" },
  RESOLVED_BY_EDITOR: { bg: "#f4ffd2", text: "#7a8f00" },
};

function getStatusStyle(status: string): { bg: string; text: string } {
  if (statusStyles[status]) return statusStyles[status];

  const normalized = status.toUpperCase().replace(/ /g, "_");
  if (statusStyles[normalized]) return statusStyles[normalized];

  return { bg: "#f1edf7", text: "#6d5d7c" };
}

function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const style = getStatusStyle(status);

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      )}
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {formatStatusLabel(status)}
    </span>
  );
}
