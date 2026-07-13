import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AvatarInitials, StatusPill } from "@/shared/ui";
import type { ReactNode } from "react";
import type { Earning } from "../../_shared";
import { formatDateTime, formatJpy } from "../../_shared";

export function PayrollInspector({
  earning,
  open,
  onOpenChange,
}: {
  earning?: Earning;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!earning) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-xl gap-0 overflow-hidden border-[var(--admin-border)] bg-[var(--admin-surface)] p-0">
        <div className="relative px-6 pb-5 pt-6">
          <div className="absolute inset-0 bg-[var(--admin-hover)] opacity-60" />
          <div className="relative flex items-start gap-4">
            <AvatarInitials
              name={earning.assistantId}
              className="size-16 shrink-0 border-2 border-[var(--admin-border)] text-[20px] shadow-sm"
            />
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="truncate font-serif text-[20px] font-semibold leading-tight text-[var(--admin-ink)]">
                {earning.assistantId}
              </p>
              <p className="mt-1 truncate text-[13px] text-[var(--admin-muted)]">
                Period: {earning.period}
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <StatusPill
                  status={earning.status.toLowerCase()}
                  className="border border-current/15 text-[11px]"
                />
                <span className="rounded-[5px] bg-[var(--admin-border)] px-1.5 py-0.5 text-[10px] text-[var(--admin-ink)]">
                  {formatJpy(earning.amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-h-[56vh] overflow-y-auto">
          <SectionHeading>Amount Summary</SectionHeading>
          <div className="space-y-0 px-6 py-3">
            <FieldRow label="Tasks Count">
              <span className="text-[12px] font-medium text-[var(--admin-ink)]">
                {earning.tasksCount}
              </span>
            </FieldRow>
            <FieldRow label="Subtotal">
              <span className="text-[12px] font-medium text-[var(--admin-ink)]">
                {formatJpy(earning.subtotal)}
              </span>
            </FieldRow>
            <FieldRow label="Bonus / Penalty">
              <span className="text-[12px] font-medium text-[var(--admin-ink)]">
                {formatJpy(earning.bonusPenalty)}
              </span>
            </FieldRow>
            <FieldRow label="Total Amount">
              <span className="text-[12px] font-semibold text-[var(--admin-ink)]">
                {formatJpy(earning.amount)}
              </span>
            </FieldRow>
          </div>

          <SectionHeading>Earning Items</SectionHeading>
          <div className="px-6 py-3">
            {earning.items && earning.items.length > 0 ? (
              <div className="space-y-3">
                {earning.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[6px] border border-[var(--admin-border)] p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-[var(--admin-ink)]">
                        {item.taskTitle}
                      </span>
                      <StatusPill status={item.status.toLowerCase()} className="text-[10px]" />
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--admin-muted)]">
                      <span>
                        {item.series} / {item.chapter}
                      </span>
                      <span>•</span>
                      <span>{item.taskType}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-[var(--admin-border)]/50 pt-2 text-[11px]">
                      <span className="text-[var(--admin-faint)]">
                        Approved: {item.approvedAt ? formatDateTime(item.approvedAt) : "N/A"}
                      </span>
                      <span className="font-mono text-[var(--admin-ink)]">
                        {formatJpy(item.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-[var(--admin-faint)]">No items available.</p>
            )}
          </div>

          <SectionHeading>Audit & Metadata</SectionHeading>
          <div className="px-6 py-3">
            <FieldRow label="Earning ID">
              <span className="font-mono text-[12px] text-[var(--admin-muted)]">{earning.id}</span>
            </FieldRow>
            <FieldRow label="Created">
              <span className="text-[12px] text-[var(--admin-muted)]">
                {earning.createdAt ? formatDateTime(earning.createdAt) : "N/A"}
              </span>
            </FieldRow>
            <FieldRow label="Last Updated">
              <span className="text-[12px] text-[var(--admin-muted)]">
                {earning.updatedAt ? formatDateTime(earning.updatedAt) : "N/A"}
              </span>
            </FieldRow>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--admin-border)] bg-[var(--admin-hover)]/30 px-6 py-3.5">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-t border-[var(--admin-border)] px-6 pb-1 pt-4">
      <div className="size-1 rounded-full bg-[var(--admin-gold)]" />
      <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[var(--admin-faint)]">
        {children}
      </h4>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--admin-border)]/50 py-2.5 last:border-b-0">
      <span className="shrink-0 text-[12px] text-[var(--admin-faint)]">{label}</span>
      <div className="min-w-0 flex-1 text-right">{children}</div>
    </div>
  );
}
