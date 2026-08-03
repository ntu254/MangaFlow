import { ArrowUpRight, Bell, Check } from "lucide-react";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDateTime } from "@/shared/lib/format-date";
import type { NotificationRecord } from "../api/notifications-queries";
import { getSafeNotificationActionUrl } from "../model/notification-action";

export function NotificationDetailSheet({
  notification,
  open,
  onOpenChange,
  onMarkRead,
  busy = false,
}: {
  notification?: NotificationRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkRead?: (id: string) => void;
  busy?: boolean;
}) {
  const actionUrl = getSafeNotificationActionUrl(notification?.actionUrl ?? notification?.link);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border px-6 pb-5 pt-7 text-left">
          <div className="mb-3 grid size-10 place-items-center rounded-md bg-muted text-foreground">
            <Bell className="size-4" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {notification?.kind ?? "Notification"}
          </p>
          <SheetTitle className="font-serif text-2xl">
            {notification?.title || "Notification detail"}
          </SheetTitle>
          {notification ? (
            <p className="text-xs text-muted-foreground">
              {formatDateTime(notification.sentAt ?? notification.createdAt)}
            </p>
          ) : null}
        </SheetHeader>

        {notification ? (
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-4 text-sm leading-6">
              {notification.message}
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-3">
              <Detail label="Priority" value={notification.priority ?? "NORMAL"} />
              <Detail label="Status" value={notification.readAt ? "Read" : "Unread"} />
              <Detail label="Sender" value={notification.createdByName ?? "MangaFlow system"} />
              <Detail
                label="Audience"
                value={
                  notification.audienceType === "ROLE"
                    ? (notification.audienceRole ?? "Role")
                    : (notification.audienceType ?? "User")
                }
              />
              <Detail label="Notification ID" value={notification.id} wide />
              {notification.batchId ? (
                <Detail label="Batch ID" value={notification.batchId} wide />
              ) : null}
            </dl>

            {actionUrl ? (
              <a
                href={actionUrl}
                target={actionUrl.startsWith("/") ? undefined : "_blank"}
                rel={actionUrl.startsWith("/") ? undefined : "noreferrer"}
                className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-xs font-semibold text-background hover:opacity-90"
              >
                Open related item <ArrowUpRight className="size-3.5" />
              </a>
            ) : null}
          </div>
        ) : null}

        <SheetFooter className="border-t border-border px-6 py-4 sm:flex-row sm:justify-end">
          {notification && !notification.readAt && onMarkRead ? (
            <button
              type="button"
              onClick={() => onMarkRead(notification.id)}
              disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-muted disabled:opacity-50"
            >
              <Check className="size-3.5" /> Mark as read
            </button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Detail({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-md border border-border p-3 ${wide ? "col-span-2" : ""}`}>
      <dt className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 break-all text-xs font-semibold">{value}</dd>
    </div>
  );
}
