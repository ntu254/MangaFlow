import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/shared/lib/cn";
import { AlertTriangle, FileClock } from "lucide-react";
import { useState } from "react";

export function OverrideDialog({
  trigger,
  actionLabel = "Confirm",
  onConfirm,
  auditImpact,
  targetLabel,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  trigger: React.ReactNode;
  actionLabel?: string;
  onConfirm?: (reason: string) => void;
  auditImpact?: string;
  targetLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [reason, setReason] = useState("");
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const close = () => {
    setReason("");
    if (isControlled) {
      controlledOnOpenChange?.(false);
    } else {
      setInternalOpen(false);
    }
  };

  const setOpenValue = (nextOpen: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }
  };

  const isReady = reason.trim().length >= 8;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? setOpenValue(true) : close())}>
      {!isControlled && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent aria-describedby="override-dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-rose-700" />
            Confirmation Required
          </DialogTitle>
          <DialogDescription id="override-dialog-description">
            A written confirmation reason is required before this admin user-management change is
            applied.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {targetLabel ? (
            <div className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 p-3 text-xs">
              <p className="font-semibold text-[var(--admin-ink)]">Target</p>
              <p className="mt-1 text-[var(--admin-muted)]">{targetLabel}</p>
            </div>
          ) : null}

          <div className="rounded-md border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-950">
            <p className="flex items-center gap-2 font-semibold">
              <FileClock className="size-3.5" />
              Audit impact
            </p>
            <p className="mt-1">
              {auditImpact ??
                "Records the actor, target, confirmation reason, and request id for this change."}
            </p>
          </div>

          <label className="block text-xs font-semibold" htmlFor="override-reason">
            Confirmation reason
          </label>
          <Textarea
            id="override-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Explain the business reason for this admin confirmation..."
            rows={4}
            className="focus-visible:ring-2 focus-visible:ring-ring"
            aria-invalid={reason.length > 0 && !isReady}
          />
          <p
            className={cn(
              "text-[11px]",
              isReady ? "text-emerald-700" : "text-[var(--admin-faint)]",
            )}
          >
            Minimum 8 characters. Do not include secrets or credentials.
          </p>
        </div>

        <DialogFooter>
          <button
            type="button"
            className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-sm font-semibold text-[var(--admin-ink)] hover:bg-[var(--admin-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px"
            onClick={close}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isReady}
            className="rounded-md bg-rose-700 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:ring-offset-2 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => {
              onConfirm?.(reason.trim());
              close();
            }}
          >
            {actionLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
