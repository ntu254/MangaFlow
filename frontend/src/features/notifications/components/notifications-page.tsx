import {
  mapNotificationError,
  useMarkAllReadMutation,
  useMarkReadMutation,
  useNotificationsQuery,
} from "../api/notifications-queries";
import { PageHeader } from "@/shared/ui";
import { EmptyState } from "@/shared/ui/empty-state";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { NotificationDetailSheet } from "./notification-detail-sheet";

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  return `${Math.floor(d / 86400)}d`;
}

export function NotificationsPage() {
  const { data: allItems = [], isLoading } = useNotificationsQuery();
  const markRead = useMarkReadMutation();
  const [tab, setTab] = useState<"inbox" | "read">("inbox");
  const [kindFilter, setKindFilter] = useState<string>("ALL");
  const [selected, setSelected] = useState<string[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailItem = allItems.find((item) => item.id === detailId);

  const items = useMemo(() => {
    if (tab === "inbox") return allItems.filter((n) => !n.readAt);
    return allItems.filter((n) => !!n.readAt);
  }, [allItems, tab]);

  const kinds = useMemo(() => Array.from(new Set(allItems.map((n) => n.kind))).sort(), [allItems]);

  const filtered = useMemo(() => {
    if (kindFilter === "ALL") return items;
    return items.filter((n) => n.kind === kindFilter);
  }, [items, kindFilter]);

  const inboxCount = allItems.filter((n) => !n.readAt).length;
  const readCount = allItems.filter((n) => !!n.readAt).length;

  const unreadIds = allItems.filter((n) => !n.readAt).map((n) => n.id);

  const markAllReadMutation = useMarkAllReadMutation();

  const handleMarkAllRead = async () => {
    if (unreadIds.length === 0) return;
    try {
      const result = await markAllReadMutation.mutateAsync({ notificationIds: unreadIds });
      if (result.errorCount > 0) {
        toast.error(`${result.errorCount} notifications could not be marked as read.`);
      } else {
        toast.success("All notifications marked as read.");
      }
    } catch {
      toast.error("Could not mark all notifications as read.");
    }
  };

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleAll = () =>
    setSelected((s) => (s.length === filtered.length ? [] : filtered.map((n) => n.id)));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Workflow"
        title="Notifications"
        description="Updates from proposals, reviews, and Board decisions."
      >
        <button
          onClick={handleMarkAllRead}
          disabled={unreadIds.length === 0 || markAllReadMutation.isPending}
          className="rounded border border-border bg-card px-3 py-1.5 text-xs disabled:opacity-40"
        >
          Mark all read
        </button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded border border-border bg-card text-xs">
          {(["inbox", "read"] as const).map((t) => {
            const count = t === "inbox" ? inboxCount : readCount;
            return (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setSelected([]);
                }}
                className={`px-3 py-1.5 font-semibold capitalize ${tab === t ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
              >
                {t} <span className="ml-1 text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
          className="h-8 rounded border border-border bg-background px-2 text-xs"
        >
          <option value="ALL">All kinds</option>
          {kinds.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        {selected.length > 0 ? (
          <div className="ml-auto flex gap-1.5">
            <span className="self-center text-[10px] text-muted-foreground">
              {selected.length} selected
            </span>
            <button
              onClick={async () => {
                const results = await Promise.allSettled(
                  selected.map((id) => markRead.mutateAsync(id)),
                );
                const failed = results.filter((r) => r.status === "rejected");
                if (failed.length > 0) toast.error(`${failed.length} failed.`);
                else toast.success("Marked as read.");
                setSelected([]);
              }}
              className="rounded border border-border bg-card px-2 py-1 text-[11px]"
            >
              Mark read
            </button>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading notifications...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="Notifications appear when a workflow transition affects you."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card/40">
          <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            <input
              type="checkbox"
              checked={selected.length === filtered.length}
              onChange={toggleAll}
            />
            <span>Select all</span>
          </div>
          <ul className="divide-y divide-border">
            {filtered.map((n) => (
              <li
                key={n.id}
                className={`flex items-start gap-3 p-3 text-sm ${!n.readAt ? "bg-amber-50/60" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(n.id)}
                  onChange={() => toggle(n.id)}
                  className="mt-1"
                />
                <span
                  className={`mt-1 size-2 shrink-0 rounded-full ${n.readAt ? "bg-muted" : "bg-accent"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{n.title || n.kind.replaceAll(".", " ")}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                  <p className="mt-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {n.kind} - {timeAgo(n.createdAt)}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDetailId(n.id)}
                    className="rounded border border-border bg-background px-2 py-0.5 text-[10px] font-semibold"
                  >
                    Details
                  </button>
                  {!n.readAt ? (
                    <button
                      onClick={() =>
                        markRead.mutate(n.id, {
                          onError: (e) => toast.error(mapNotificationError(e)),
                        })
                      }
                      className="rounded border border-border bg-background px-2 py-0.5 text-[10px]"
                    >
                      Read
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
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
