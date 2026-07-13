import { useMemo } from "react";
import { toast } from "sonner";
import {
  useNotificationsQuery,
  useMarkReadMutation,
  mapNotificationError,
} from "@/features/notifications";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader } from "@/shared/ui";
import { formatDateTime } from "@/shared/lib/format-date";

export function EditorNotificationsPage() {
  const { data: items = [], isLoading } = useNotificationsQuery();
  const markRead = useMarkReadMutation();

  const visible = useMemo(() => items.filter((n) => !n.archivedAt), [items]);

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
        description="Notifications about submissions, reviews, and workflow."
      />
      {visible.length === 0 ? (
        <EmptyState title="No new notifications" />
      ) : (
        <ul className="space-y-1.5">
          {visible.map((n) => (
            <li
              key={n.id}
              onClick={() => {
                if (!n.readAt) {
                  markRead.mutate(n.id, {
                    onError: (e) => toast.error(mapNotificationError(e)),
                  });
                }
              }}
              className={`cursor-pointer rounded border border-border bg-card p-3 text-xs hover:bg-muted/40 ${
                n.readAt ? "opacity-70" : ""
              }`}
            >
              <p className="font-semibold">{n.message}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {n.kind} · {formatDateTime(n.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
