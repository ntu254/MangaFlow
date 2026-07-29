import { useState } from "react";
import { UNSUPPORTED_MVP } from "@/shared/config/ui-copy";
import { cn } from "@/shared/lib/cn";

type Action = {
  key: string;
  label: string;
  variant?: "primary" | "warn" | "danger" | "neutral";
  requiresReason?: boolean;
  supported?: boolean;
  disabledReason?: string;
  onAct?: (reason?: string) => void;
};

export function DecisionActions({ actions }: { actions: Action[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => {
          const cls =
            a.variant === "primary"
              ? "bg-[var(--admin-navy)] text-white hover:bg-[var(--admin-ink)]"
              : a.variant === "warn"
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : a.variant === "danger"
                  ? "bg-rose-600 text-white hover:bg-rose-700"
                  : "border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-ink)] hover:bg-[var(--admin-hover)]";
          const disabled = a.supported === false;
          return (
            <button
              key={a.key}
              type="button"
              disabled={disabled}
              title={disabled ? (a.disabledReason ?? UNSUPPORTED_MVP) : undefined}
              onClick={() => {
                if (disabled) return;
                if (a.requiresReason) {
                  setOpen(a.key);
                  setReason("");
                } else {
                  a.onAct?.();
                }
              }}
              className={cn(
                `rounded-[6px] px-3 py-1.5 text-xs font-semibold transition-colors ${cls}`,
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              {a.label}
            </button>
          );
        })}
      </div>
      {open ? (
        <div className="rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-page)]/50 p-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--admin-faint)]">
            Reason / Feedback
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-2 text-xs text-[var(--admin-ink)] outline-none focus:border-[var(--admin-ink)]"
            placeholder="Enter detailed feedback..."
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-1 text-xs text-[var(--admin-ink)]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={reason.trim().length < 3}
              onClick={() => {
                const a = actions.find((x) => x.key === open);
                a?.onAct?.(reason.trim());
                setOpen(null);
              }}
              className="rounded-[6px] bg-[var(--admin-navy)] px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
            >
              Confirm
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
