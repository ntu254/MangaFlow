import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useNotificationsQuery,
  useMarkReadMutation,
  mapNotificationError,
  NotificationDetailSheet,
  useArchiveNotificationMutation,
} from "@/features/notifications";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader } from "@/shared/ui";
import { formatDateTime } from "@/shared/lib/format-date";

export function EditorNotificationsPage() {
  const { data: items = [], isLoading } = useNotificationsQuery();
  const markRead = useMarkReadMutation();
  const archive = useArchiveNotificationMutation();
  const [detailId, setDetailId] = useState<string | null>(null);

  const visible = useMemo(() => items.filter((n) => !n.archivedAt), [items]);
  const detailItem = items.find((item) => item.id === detailId);

  if (isLoading)
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6 text-sm text-muted-foreground">
        Loading...
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <PageHeader
        eyebrow="Editor"
        title="Notifications"
        description="Notifications about submissions, reviews, and workflows."
      />
      {visible.length === 0 ? (
        <EmptyState title="No new notifications" />
      ) : (
        <ul className="space-y-1.5">
          {visible.map((n) => (
            <li
              key={n.id}
              onClick={() => setDetailId(n.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setDetailId(n.id);
                }
              }}
              role="button"
              tabIndex={0}
              className={`cursor-pointer rounded border border-border bg-card p-3 text-xs hover:bg-muted/40 ${
                n.readAt ? "opacity-70" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{n.title || n.kind.replaceAll(".", " ")}</p>
                  <p className="mt-1 line-clamp-2 text-muted-foreground">{n.message}</p>
                </div>
                <span className="rounded border border-border px-2 py-1 text-[10px] font-semibold">
                  Details
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {n.kind} · {formatDateTime(n.createdAt)}
              </p>
            </li>
          ))}
        </ul>
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
