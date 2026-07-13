import {
  mapNotificationError,
  useArchiveAllMutation,
  useArchiveNotificationMutation,
  useMarkAllReadMutation,
  useMarkReadMutation,
  useNotificationsQuery,
} from "@/features/notifications";
import { PageHeader } from "@/shared/ui";
import { EmptyState } from "@/shared/ui/empty-state";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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
  const archive = useArchiveNotificationMutation();
  const [tab, setTab] = useState<"inbox" | "read" | "archived">("inbox");
  const [kindFilter, setKindFilter] = useState<string>("ALL");
  const [selected, setSelected] = useState<string[]>([]);

  const items = useMemo(() => {
    if (tab === "inbox") return allItems.filter((n) => !n.archivedAt && !n.readAt);
    if (tab === "read") return allItems.filter((n) => !n.archivedAt && n.readAt);
    return allItems.filter((n) => !!n.archivedAt);
  }, [allItems, tab]);

  const kinds = useMemo(() => Array.from(new Set(allItems.map((n) => n.kind))).sort(), [allItems]);

  const filtered = useMemo(() => {
    if (kindFilter === "ALL") return items;
    return items.filter((n) => n.kind === kindFilter);
  }, [items, kindFilter]);

  const inboxCount = allItems.filter((n) => !n.archivedAt && !n.readAt).length;
  const readCount = allItems.filter((n) => !n.archivedAt && n.readAt).length;
  const archivedCount = allItems.filter((n) => !!n.archivedAt).length;

  const unreadIds = allItems.filter((n) => !n.archivedAt && !n.readAt).map((n) => n.id);
  const readUnarchivedIds = allItems.filter((n) => !n.archivedAt && n.readAt).map((n) => n.id);

  const markAllReadMutation = useMarkAllReadMutation();
  const archiveAllMutation = useArchiveAllMutation();

  const handleMarkAllRead = async () => {
    if (unreadIds.length === 0) return;
    try {
      const result = await markAllReadMutation.mutateAsync({ notificationIds: unreadIds });
      if (result.errorCount > 0) {
        toast.error(`${result.errorCount} notifications could not be marked.`);
      } else {
        toast.success("All notifications were marked as read.");
      }
    } catch {
      toast.error("An error occurred while marking all as read.");
    }
  };

  const handleArchiveAllRead = async () => {
    if (readUnarchivedIds.length === 0) return;
    try {
      const result = await archiveAllMutation.mutateAsync({ notificationIds: readUnarchivedIds });
      if (result.errorCount > 0) {
        toast.error(`${result.errorCount} notifications could not be archived.`);
      } else {
        toast.success("All notifications were archived.");
      }
    } catch {
      toast.error("An error occurred while archiving all.");
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
        description="Updates from proposals, reviews, and board decisions."
      >
        <button
          onClick={handleMarkAllRead}
          disabled={unreadIds.length === 0 || markRead.isPending}
          className="rounded border border-border bg-card px-3 py-1.5 text-xs disabled:opacity-40"
        >
          Mark all read
        </button>
        <button
          onClick={handleArchiveAllRead}
          disabled={readUnarchivedIds.length === 0 || archive.isPending}
          className="rounded border border-border bg-card px-3 py-1.5 text-xs disabled:opacity-40"
        >
          Archive all read
        </button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded border border-border bg-card text-xs">
          {(["inbox", "read", "archived"] as const).map((t) => {
            const count = t === "inbox" ? inboxCount : t === "read" ? readCount : archivedCount;
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
          <option value="ALL">All kind</option>
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
            <button
              onClick={async () => {
                const results = await Promise.allSettled(
                  selected.map((id) => archive.mutateAsync(id)),
                );
                const failed = results.filter((r) => r.status === "rejected");
                if (failed.length > 0) toast.error(`${failed.length} failed.`);
                else toast.success("Archived.");
                setSelected([]);
              }}
              className="rounded border border-border bg-card px-2 py-1 text-[11px]"
            >
              Archive
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
          description="Notifications will appear when a transition affects you."
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
                className={`flex items-start gap-3 p-3 text-sm ${!n.readAt && !n.archivedAt ? "bg-amber-50/60" : ""}`}
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
                <div className="flex-1">
                  <span className="font-medium">{n.message}</span>
                  <p className="mt-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {n.kind} · {timeAgo(n.createdAt)}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {!n.readAt && !n.archivedAt ? (
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
                  {n.archivedAt ? null : (
                    <button
                      onClick={() =>
                        archive.mutate(n.id, {
                          onError: (e) => toast.error(mapNotificationError(e)),
                        })
                      }
                      className="rounded border border-border bg-background px-2 py-0.5 text-[10px]"
                    >
                      Archive
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
