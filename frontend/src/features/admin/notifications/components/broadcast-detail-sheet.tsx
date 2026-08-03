import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Bell, Trash2 } from "lucide-react";
import { formatDateTime } from "../../_shared";
import type { ManagedNotification } from "../api/notifications.queries";

export type BroadcastDetail = ManagedNotification & { recipientCount: number };

export function BroadcastDetailSheet({
  broadcast,
  open,
  onOpenChange,
  onDelete,
  deleting,
}: {
  broadcast: BroadcastDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-[var(--admin-border)] bg-[var(--admin-surface)] sm:max-w-lg">
        <SheetHeader className="border-b border-[var(--admin-border)] px-6 pb-5 pt-7 text-left">
          <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-[var(--admin-hover)] text-[var(--admin-navy)]">
            <Bell className="size-4" />
          </div>
          <SheetTitle className="font-serif text-[24px] text-[var(--admin-ink)]">
            {broadcast?.title ?? "Broadcast detail"}
          </SheetTitle>
          <SheetDescription>
            {broadcast ? formatDateTime(broadcast.sentAt ?? broadcast.createdAt) : ""}
          </SheetDescription>
        </SheetHeader>

        {broadcast ? (
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 p-4 text-[14px] leading-6 text-[var(--admin-ink)]">
              {broadcast.message}
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-3">
              <Detail label="Audience">
                {broadcast.audienceType === "ROLE"
                  ? (broadcast.audienceRole ?? "Role")
                  : (broadcast.audienceType ?? "User")}
              </Detail>
              <Detail label="Recipients">{broadcast.recipientCount}</Detail>
              <Detail label="Priority">{broadcast.priority ?? "NORMAL"}</Detail>
              <Detail label="Kind">{broadcast.kind}</Detail>
              <Detail label="Batch ID" className="col-span-2">
                {broadcast.batchId ?? "-"}
              </Detail>
              <Detail label="Created by">{broadcast.createdByName ?? "Admin"}</Detail>
              <Detail label="Delivery">Sent</Detail>
            </dl>
          </div>
        ) : null}

        <SheetFooter className="border-t border-[var(--admin-border)] px-6 py-4 sm:flex-row sm:justify-end">
          {broadcast ? (
            <Button variant="outline" onClick={onDelete} disabled={deleting}>
              <Trash2 className="mr-2 size-3.5" />
              {deleting ? "Deleting..." : "Delete broadcast"}
            </Button>
          ) : null}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Detail({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-md border border-[var(--admin-border)] p-3 ${className}`}>
      <dt className="text-[10px] font-bold uppercase tracking-widest text-[var(--admin-faint)]">
        {label}
      </dt>
      <dd className="mt-1 break-all text-[12px] font-medium text-[var(--admin-ink)]">{children}</dd>
    </div>
  );
}
