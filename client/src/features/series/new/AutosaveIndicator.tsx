import { Loader2, Check, Circle } from "lucide-react";
import type { AutosaveStatus } from "./useProposalForm";

function formatAgo(ts: number | null): string {
  if (!ts) return "";
  const diff = Math.max(0, Date.now() - ts);
  const s = Math.floor(diff / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export function AutosaveIndicator({
  status,
  lastSavedAt,
}: {
  status: AutosaveStatus;
  lastSavedAt: number | null;
}) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] text-foreground/50">
        <Loader2 className="h-3 w-3 animate-spin" /> Saving…
      </span>
    );
  }
  if (status === "dirty") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] text-amber-500">
        <Circle className="h-3 w-3 fill-amber-500/40" /> Unsaved changes
      </span>
    );
  }
  if (status === "saved" || (status === "idle" && lastSavedAt)) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] text-foreground/50">
        <Check className="h-3 w-3 text-emerald-500" /> Saved · {formatAgo(lastSavedAt)}
      </span>
    );
  }
  return null;
}
