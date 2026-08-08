import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Bell, Check } from "lucide-react";
import { toast } from "sonner";
import {
  useNotificationsQuery,
  useMarkReadMutation,
  mapNotificationError,
  type NotificationRecord,
} from "../../api/assistant-queries";
import { EmptyState } from "@/shared/ui/empty-state";
import { formatDateTime } from "@/shared/lib/format-date";
import { NotificationDetailSheet } from "@/features/notifications";

export function AssistantNotificationsPage() {
  const { data: items = [], isLoading } = useNotificationsQuery();
  const markRead = useMarkReadMutation();
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailItem = items.find((item) => item.id === detailId);

  const visible = useMemo(() => items, [items]);
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
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Unified Page Header */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link
              to="/app/assistant/dashboard"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" /> Dashboard
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Notifications</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif flex items-center gap-2.5">
            <Bell className="size-6 text-primary" />
            Notifications & Activity
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {unreadCount} unread message{unreadCount === 1 ? "" : "s"} · {visible.length} total activity updates
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0 || markRead.isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-xs font-bold text-foreground shadow-2xs hover:bg-muted transition-colors disabled:opacity-40 cursor-pointer"
        >
          <Check className="size-3.5" /> Mark all as read
        </button>
      </div>

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
        busy={markRead.isPending}
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
