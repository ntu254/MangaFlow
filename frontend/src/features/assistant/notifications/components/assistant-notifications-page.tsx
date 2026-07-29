import { useMemo, useState } from "react";
import { Bell, Check } from "lucide-react";
import { toast } from "sonner";
import {
  useNotificationsQuery,
  useMarkReadMutation,
  mapNotificationError,
  type NotificationRecord,
} from "../../api/assistant-queries";
import { EmptyState } from "@/shared/ui/empty-state";
import { formatDateTime } from "@/shared/lib/format-date";
import { NotificationDetailSheet, useArchiveNotificationMutation } from "@/features/notifications";

export function AssistantNotificationsPage() {
  const { data: items = [], isLoading } = useNotificationsQuery();
  const markRead = useMarkReadMutation();
  const archive = useArchiveNotificationMutation();
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailItem = items.find((item) => item.id === detailId);

  const visible = useMemo(() => items.filter((n) => !n.archivedAt), [items]);
  const unreadCount = visible.filter((n) => !n.readAt).length;

  const today: NotificationRecord[] = [];
  const earlier: NotificationRecord[] = [];
  const todayKey = new Date().toDateString();
  visible.forEach((n) =>
    new Date(n.createdAt).toDateString() === todayKey ? today.push(n) : earlier.push(n),
  );

  const handleMarkAllRead = async () => {
    const unreadIds = visible.filter((n) => !n.readAt).map((n) => n.id);
    if (unreadIds.length === 0) return;
    const results = await Promise.allSettled(unreadIds.map((id) => markRead.mutateAsync(id)));
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) toast.error(`${failed.length} notifications could not be marked read.`);
    else toast.success("All notifications marked as read.");
  };

  if (isLoading)
    return <div className="space-y-4 p-6 text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Workspace
          </p>
          <h1 className="font-serif text-3xl">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount} unread / {visible.length} total
          </p>
        </div>
        <button
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0 || markRead.isPending}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-40"
        >
          <Check className="size-3.5" /> Mark all as read
        </button>
      </header>

      {visible.length === 0 ? (
        <EmptyState title="No new notifications" />
      ) : (
        <>
          {today.length > 0 ? (
            <Group
              title="Today"
              items={today}
              onMarkRead={(id) =>
                markRead.mutate(id, { onError: (e) => toast.error(mapNotificationError(e)) })
              }
              onOpen={setDetailId}
            />
          ) : null}
          {earlier.length > 0 ? (
            <Group
              title="Earlier"
              items={earlier}
              onMarkRead={(id) =>
                markRead.mutate(id, { onError: (e) => toast.error(mapNotificationError(e)) })
              }
              onOpen={setDetailId}
            />
          ) : null}
        </>
      )}
      <NotificationDetailSheet
        notification={detailItem}
        open={!!detailItem}
        onOpenChange={(open) => !open && setDetailId(null)}
        onMarkRead={(id) =>
          markRead.mutate(id, {
            onError: (error) => toast.error(mapNotificationError(error)),
          })
        }
        onArchive={(id) =>
          archive.mutate(id, {
            onSuccess: () => setDetailId(null),
            onError: (error) => toast.error(mapNotificationError(error)),
          })
        }
        busy={markRead.isPending || archive.isPending}
      />
    </div>
  );
}

function Group({
  title,
  items,
  onMarkRead,
  onOpen,
}: {
  title: string;
  items: NotificationRecord[];
  onMarkRead: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <section className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((n) => (
          <li
            key={n.id}
            className={`flex items-start gap-3 rounded-md border border-border p-3 ${n.readAt ? "bg-card" : "bg-card ring-1 ring-accent/30"}`}
          >
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded bg-muted">
              <Bell className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{n.title || n.kind.replaceAll(".", " ")}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {formatDateTime(n.createdAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpen(n.id)}
              className="rounded border border-border bg-background px-2 py-1 text-[10px] font-semibold hover:bg-muted"
            >
              Details
            </button>
            {!n.readAt ? (
              <button
                onClick={() => onMarkRead(n.id)}
                className="rounded border border-border bg-background px-2 py-1 text-[10px] font-semibold hover:bg-muted"
              >
                Mark read
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
