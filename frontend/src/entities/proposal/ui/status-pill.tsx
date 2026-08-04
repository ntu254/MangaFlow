import { cn } from "@/shared/lib/cn";
import type { ProposalStatus } from "@/entities/proposal/model/proposal-types";
import { STATUS_LABEL } from "@/entities/proposal/model/proposal-types";

const STYLES: Record<ProposalStatus, string> = {
  DRAFT: "bg-zinc-200 text-zinc-800",
  PENDING_EDITOR: "bg-amber-100 text-amber-900",
  EDITOR_REVIEWING: "bg-amber-200 text-amber-900",
  CHANGES_REQUESTED: "bg-orange-100 text-orange-900",
  BOARD_REVIEW: "bg-indigo-200 text-indigo-900",
  PENDING_BOARD: "bg-indigo-100 text-indigo-900",
  APPROVED: "bg-emerald-100 text-emerald-900",
  REJECTED: "bg-rose-100 text-rose-900",
  WITHDRAWN: "bg-zinc-200 text-zinc-600",
  ARCHIVED: "bg-stone-200 text-stone-600",
};

export function ProposalStatusPill({
  status,
  size = "sm",
  className,
}: {
  status: ProposalStatus;
  size?: "sm" | "lg";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded font-bold uppercase tracking-wider",
        size === "lg" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[10px]",
        STYLES[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
